import { PriorityQueue } from "./priorityQueue"

const disposerOfDisposer = function () {
    throw new Error("This dispose has already been destroyed.")
}

/**
 * Constants defining the execution priority within the Ticker loop.
 * Lower numbers run first, higher numbers run last.
 */
export const Priority = {
    FIXED_UPDATE: 500,
    UPDATE: 1000,
    RENDER: 10000
} as const

/** Type representing a Priority value. */
export type Priority = number

/** 
 * Interface for an object capable of removing a registered listener.
 */
export type TickerDisposer = { 
    /** Unregisters the listener from the Ticker. */
    dispose(): void 
}

type Listener = {
    priority: number
    f: (delta: number) => void
}

/**
 * The main game loop controller.
 * Responsible for firing update, fixedUpdate, and render events at the correct intervals.
 */
export class Ticker {
    #running = false

    #fps: number
    #interval: number

    #fixedFPS: number
    #fixedInterval: number
    #accumulator = 0

    #lastTime = 0
    #nextTime = 0

    #maxDeltaMs = 100
    #maxAccumulatedMs = 250

    #listeners = new PriorityQueue<Listener>()
    #fixedListeners = new PriorityQueue<Listener>()
    #renderListeners = new PriorityQueue<Listener>()

    /**
     * Creates a new Ticker instance.
     * @param fps - The target frames per second for general updates (default 60).
     * @param fixedFPS - The target frames per second for fixed physics updates (default 60).
     */
    constructor(fps = 60, fixedFPS = 60) {
        this.#fps = fps
        this.#interval = 1000 / fps

        this.#fixedFPS = fixedFPS
        this.#fixedInterval = 1000 / fixedFPS
    }

    /**
     * Starts the ticker loop. Does nothing if already running.
     * @example ticker.start();
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
     * @example ticker.stop();
     */
    stop(): void {
        this.#running = false
    }

    /**
     * Dynamically sets the target FPS for general updates.
     * @param fps - The new frames per second target.
     */
    setFPS(fps: number): void {
        this.#fps = fps
        this.#interval = 1000 / fps
        this.#nextTime = performance.now()
    }

    /**
     * Dynamically sets the target FPS for fixed updates.
     * @param fps - The new fixed frames per second target.
     */
    setFixedFPS(fps: number): void {
        this.#fixedFPS = fps
        this.#fixedInterval = 1000 / fps
    }

    /**
     * Registers a callback function to be executed by the ticker.
     * @param callback - The function to call, receiving the time delta (in seconds).
     * @param priority - The queue to attach to (UPDATE, FIXED_UPDATE, or RENDER).
     * @returns A disposable object to remove the listener later.
     * @example
     * const loopDisposer = ticker.add((delta) => {
     *   console.log("Updated with delta:", delta);
     * }, Priority.UPDATE);
     * 
     * // To remove:
     * loopDisposer.dispose();
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
     * Resets the internal time tracking.
     * Useful if the game was paused for a long time to prevent large delta spikes.
     */
    resetTime(): void {
        const now = performance.now()
        this.#lastTime = now
        this.#nextTime = now
        this.#accumulator = 0
    }

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