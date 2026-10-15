import { PriorityQueue } from "./priorityQueue"

/**
 * Sentinel function assigned to a {@link TickerDisposer} after `dispose` has
 * been called once, preventing accidental double-disposal.
 * @internal
 */
const disposerOfDisposer = function () {
    throw new Error("This dispose has already been destroyed.")
}

/**
 * Named constants for the three standard execution phases of the game loop.
 *
 * Listeners registered with {@link Ticker.add} are sorted into one of three
 * internal queues based on their priority value. Within a single queue all
 * listeners run in ascending priority order (lower number = runs first).
 *
 * | Constant        | Value  | Phase                                      |
 * |-----------------|--------|--------------------------------------------|
 * | `FIXED_UPDATE`  | `500`  | Fixed time-step physics / deterministic AI |
 * | `UPDATE`        | `1000` | Variable-delta game logic                  |
 * | `RENDER`        | `10000`| Rendering pipeline                         |
 *
 * @example
 * ticker.add((delta) => myPhysics.step(delta), Priority.FIXED_UPDATE);
 * ticker.add((delta) => player.update(delta),  Priority.UPDATE);
 * ticker.add((delta) => renderer.flush(delta), Priority.RENDER);
 */
export const Priority = {
    /**
     * Fixed time-step phase (`500`).
     * Listeners here run **before** `UPDATE` and receive a constant delta equal
     * to `1 / fixedFPS`. May fire multiple times per frame to catch up if the
     * frame took longer than `fixedInterval`.
     */
    FIXED_UPDATE: 500,
    /**
     * Variable-delta update phase (`1000`).
     * Runs once per frame with the actual elapsed time capped at
     * `maxDeltaMs` (default 100 ms). Suitable for gameplay logic.
     */
    UPDATE: 1000,
    /**
     * Rendering phase (`10000`).
     * Runs last, capped to the target FPS set in the {@link Ticker} constructor.
     * Register draw calls here.
     */
    RENDER: 10000
} as const

/**
 * A numeric priority value. Use one of the {@link Priority} constants or supply
 * a custom number to insert a listener between existing phases.
 */
export type Priority = number

/**
 * A handle returned by {@link Ticker.add} that allows the registered listener
 * to be cleanly removed from the ticker.
 *
 * After `dispose` is called, the internal reference is replaced with a
 * throwing sentinel so that accidental double-disposal is caught immediately.
 *
 * @example
 * const disposer = ticker.add(myCallback, Priority.UPDATE);
 * // Later:
 * disposer.dispose(); // removes myCallback from the loop
 */
export type TickerDisposer = {
    /**
     * Unregisters the associated listener from the {@link Ticker}.
     * Safe to call only once; a second call will throw an error.
     */
    dispose(): void
}

/**
 * Internal entry type stored in the listener priority queues.
 * @internal
 */
type Listener = {
    /** Numeric priority used by the {@link PriorityQueue} comparator. */
    priority: number
    /** The callback to invoke with the time delta (in seconds). */
    f: (delta: number) => void
}

/**
 * The main game-loop controller for FrameKore Engine.
 *
 * `Ticker` drives three distinct execution phases per browser animation frame:
 *
 * 1. **UPDATE** — variable-delta callbacks, fired once per `requestAnimationFrame`.
 * 2. **FIXED_UPDATE** — fixed-step callbacks, fired N times per frame using an
 *    accumulator to maintain a consistent simulation rate regardless of frame rate.
 * 3. **RENDER** — rendering callbacks, throttled to the configured target FPS.
 *
 * The engine creates one `Ticker` internally; plugins obtain it via
 * `engine.ticker`. Register custom callbacks with {@link add}.
 *
 * ### Delta clamping
 * Raw frame deltas are clamped to **100 ms** (`maxDeltaMs`) to prevent
 * large simulation jumps after a tab becomes visible again.  
 * The fixed-update accumulator is also clamped to **250 ms** to cap the
 * number of fixed steps per frame (spiral-of-death prevention).
 *
 * @example
 * const ticker = new Ticker(60, 60);
 *
 * const disposer = ticker.add((delta) => {
 *   console.log('frame delta (s):', delta);
 * }, Priority.UPDATE);
 *
 * ticker.start();
 *
 * // Remove the listener later:
 * disposer.dispose();
 */
export class Ticker {
    /** @internal Whether the loop is currently running. */
    #running = false

    /**
     * Target frames per second for the UPDATE and RENDER queues.
     * @internal
     */
    #fps: number
    /**
     * Minimum milliseconds between render flushes (`1000 / fps`).
     * @internal
     */
    #interval: number

    /**
     * Target frames per second for the FIXED_UPDATE queue.
     * @internal
     */
    #fixedFPS: number
    /**
     * Fixed time step in milliseconds (`1000 / fixedFPS`).
     * @internal
     */
    #fixedInterval: number
    /**
     * Accumulated milliseconds not yet consumed by fixed-update steps.
     * @internal
     */
    #accumulator = 0

    /**
     * Timestamp (ms) of the previous animation frame, used to compute `deltaMs`.
     * @internal
     */
    #lastTime = 0
    /**
     * Timestamp (ms) at which the next render flush is permitted.
     * @internal
     */
    #nextTime = 0

    /**
     * Maximum allowed frame delta in milliseconds. Frames slower than this are
     * clamped to prevent spiral-of-death in physics and large position jumps.
     * @internal
     */
    #maxDeltaMs = 100
    /**
     * Maximum accumulated milliseconds for fixed-update steps per frame.
     * Caps the number of fixed-update iterations when the frame is very slow.
     * @internal
     */
    #maxAccumulatedMs = 250

    /**
     * Priority queue for UPDATE-phase listeners.
     * @internal
     */
    #listeners = new PriorityQueue<Listener>()
    /**
     * Priority queue for FIXED_UPDATE-phase listeners.
     * @internal
     */
    #fixedListeners = new PriorityQueue<Listener>()
    /**
     * Priority queue for RENDER-phase listeners.
     * @internal
     */
    #renderListeners = new PriorityQueue<Listener>()

    /**
     * Creates a new `Ticker`.
     *
     * @param fps - Target frames per second for `UPDATE` and `RENDER` phases.
     *              Defaults to `60`.
     * @param fixedFPS - Target frames per second for the `FIXED_UPDATE` phase.
     *                   Defaults to `60`.
     *
     * @example
     * const ticker = new Ticker();          // 60 fps / 60 fixed fps
     * const ticker = new Ticker(60, 50);   // 60 fps render, 50 fixed steps/s
     */
    constructor(fps = 60, fixedFPS = 60) {
        this.#fps = fps
        this.#interval = 1000 / fps

        this.#fixedFPS = fixedFPS
        this.#fixedInterval = 1000 / fixedFPS
    }

    /**
     * Starts the ticker loop using `requestAnimationFrame`.
     *
     * Resets internal time-tracking state before the first frame so that
     * the first delta is always zero (or very small). If the ticker is already
     * running, this method is a no-op.
     *
     * @example
     * ticker.start();
     */
    start(): void {
        if (this.#running) return

        this.#running = true
        const now = performance.now()
        this.#lastTime = now
        this.#nextTime = now
        this.#accumulator = 0

        requestAnimationFrame(this.#loop)
    }

    /**
     * Stops the ticker loop.
     *
     * The current animation frame is allowed to complete, but no further frames
     * are scheduled. Call {@link start} to resume.
     *
     * @example
     * ticker.stop();
     */
    stop(): void {
        this.#running = false
    }

    /**
     * Changes the target FPS for the `UPDATE` and `RENDER` phases at runtime.
     *
     * Resets `#nextTime` to `performance.now()` so the next render frame fires
     * immediately rather than waiting out the remainder of the old interval.
     *
     * @param fps - The new target frames per second.
     *
     * @example
     * ticker.setFPS(30); // switch to 30 fps (e.g., battery-saver mode)
     */
    setFPS(fps: number): void {
        this.#fps = fps
        this.#interval = 1000 / fps
        this.#nextTime = performance.now()
    }

    /**
     * Changes the target FPS for the `FIXED_UPDATE` phase at runtime.
     *
     * The change takes effect from the next animation frame. The accumulator
     * is not reset, so existing accumulated time is consumed at the new rate.
     *
     * @param fps - The new fixed frames per second target.
     *
     * @example
     * ticker.setFixedFPS(120); // double the physics rate
     */
    setFixedFPS(fps: number): void {
        this.#fixedFPS = fps
        this.#fixedInterval = 1000 / fps
    }

    /**
     * Registers a callback function to be called by the ticker each frame (or
     * at a fixed rate for `FIXED_UPDATE`).
     *
     * The `priority` value determines which internal queue the listener joins:
     * - `Priority.FIXED_UPDATE` (`500`) → fixed-step queue.
     * - `Priority.UPDATE` (`1000`) → variable-delta queue (default).
     * - `Priority.RENDER` (`10000`) → render-throttled queue.
     *
     * Within the same queue, listeners are ordered by ascending priority value.
     * Supply a custom number (e.g., `999`) to insert before all `UPDATE` listeners.
     *
     * @param callback - Function called with `delta` in **seconds** each tick.
     * @param priority - Queue selector. Defaults to `Priority.UPDATE`.
     * @returns A {@link TickerDisposer} to unregister the callback later.
     *
     * @example
     * // Variable-delta update
     * const disp = ticker.add((delta) => player.move(delta), Priority.UPDATE);
     *
     * // Fixed-step physics
     * ticker.add((delta) => physics.step(delta), Priority.FIXED_UPDATE);
     *
     * // Render callback
     * ticker.add(() => renderer.flush(), Priority.RENDER);
     *
     * // Remove when no longer needed
     * disp.dispose();
     */
    add(callback: (delta: number) => void, priority: Priority = Priority.UPDATE): TickerDisposer {
        const entry: Listener = {
            f: callback,
            priority
        }

        let queue = this.#listeners

        if (priority === Priority.FIXED_UPDATE) {
            queue = this.#fixedListeners
        } else if (priority === Priority.RENDER) {
            queue = this.#renderListeners
        }

        queue.enqueue(entry)

        const disposer = {
            dispose: () => {
                queue.delete(entry)
                disposer.dispose = disposerOfDisposer
            }
        }

        return disposer
    }

    /**
     * Resets all internal time-tracking variables to the current moment.
     *
     * Call this after a prolonged pause (e.g., the browser tab was hidden) to
     * prevent the first post-pause frame from producing a huge delta that would
     * cause physics objects to teleport or animations to skip.
     *
     * @example
     * document.addEventListener('visibilitychange', () => {
     *   if (document.visibilityState === 'visible') {
     *     ticker.resetTime();
     *   }
     * });
     */
    resetTime(): void {
        const now = performance.now()
        this.#lastTime = now
        this.#nextTime = now
        this.#accumulator = 0
    }

    /**
     * The core `requestAnimationFrame` loop body.
     *
     * Each invocation:
     * 1. Computes `deltaMs` from the previous frame, clamping to `maxDeltaMs`.
     * 2. Fires all **UPDATE** listeners with `deltaMs / 1000` (seconds).
     * 3. Accumulates `deltaMs` and fires **FIXED_UPDATE** listeners once per
     *    fixed interval, consuming the accumulator.
     * 4. When the render interval has elapsed, fires all **RENDER** listeners.
     *
     * @param time - High-resolution timestamp provided by `requestAnimationFrame` (ms).
     * @internal
     */
    #loop = (time: number) => {
        if (!this.#running) return
        requestAnimationFrame(this.#loop)

        let deltaMs = time - this.#lastTime
        this.#lastTime = time

        if (deltaMs > this.#maxDeltaMs) {
            deltaMs = this.#maxDeltaMs
        }

        for (const entry of this.#listeners) {
            entry.f(deltaMs / 1000)
        }

        this.#accumulator += deltaMs
        if (this.#accumulator > this.#maxAccumulatedMs) {
            this.#accumulator = this.#maxAccumulatedMs
        }

        while (this.#accumulator >= this.#fixedInterval) {
            for (const entry of this.#fixedListeners) {
                entry.f(this.#fixedInterval / 1000)
            }

            this.#accumulator -= this.#fixedInterval
        }

        if (time >= this.#nextTime) {
            while (this.#nextTime <= time) {
                this.#nextTime += this.#interval
            }

            for (const entry of this.#renderListeners) {
                entry.f(deltaMs / 1000)
            }
        }
    }
}