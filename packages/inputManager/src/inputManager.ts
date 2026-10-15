import { definePlugin, type Engine } from "@framekore/core";

/**
 * Creates the Input plugin for the FrameKore Engine.
 *
 * When registered with `engine.use()`, this plugin instantiates an
 * {@link InputManager}, stores it as an engine resource, and ensures
 * the per-frame `update()` and cleanup `destroy()` lifecycle methods
 * are called automatically by the engine loop.
 *
 * @returns An `EnginePlugin` definition to be passed to `engine.use()`.
 *
 * @example
 * import { inputPlugin } from "@framekore/input-manager";
 *
 * engine.use(inputPlugin());
 *
 * // Later in your game loop, retrieve the manager:
 * const input = InputManager.get(engine);
 */
export const inputPlugin = definePlugin(() => {
    return {
        name: "input",
        setup(engine) {
            const input = new InputManager()
            engine.setResource(InputManager, input)
        },
        update(engine) {
            const input = engine.getResource(InputManager)
            input?.update()
        },
        destroy(engine) {
            const input = engine.getResource(InputManager)
            input?.destroy()
        },
    }
})

/**
 * Tracks the real-time keyboard input state for the entire game window.
 *
 * `InputManager` listens to the native `keydown` and `keyup` events on
 * `window` and exposes a simple, frame-aware API to query key states.
 * It differentiates between **held** keys ({@link isDown}/{@link isUp}) and
 * **edge-triggered** keys ({@link isJustDown}/{@link isJustUp}), which are
 * only `true` for the single frame in which the transition occurred.
 *
 * All key identifiers use the [`KeyboardEvent.code`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)
 * property (e.g. `"ArrowUp"`, `"KeyW"`, `"Space"`), which is
 * layout-independent.
 *
 * This class is intended to be used as an engine resource. Do not
 * instantiate it directly — use {@link inputPlugin} instead.
 *
 * @example
 * // Registration
 * engine.use(inputPlugin());
 *
 * // Usage inside a game object's update method
 * const input = InputManager.get(engine);
 *
 * if (input.isJustDown("Space")) {
 *   player.jump();
 * }
 *
 * if (input.isDown("ArrowRight")) {
 *   player.moveRight();
 * }
 */
export class InputManager {
    /** Set of `KeyboardEvent.code` values for all currently held keys. */
    #keys = new Set<string>();

    /** Set of `KeyboardEvent.code` values released during the current frame. */
    #justReleased = new Set<string>();

    /** Set of `KeyboardEvent.code` values first pressed during the current frame. */
    #justPressed = new Set<string>();

    /**
     * Initialises the InputManager and attaches `keydown`/`keyup` listeners
     * to the global `window` object.
     *
     * @internal Created automatically by the {@link inputPlugin}. Do not call directly.
     */
    constructor() {
        window.addEventListener("keydown", this.#onKeyDown)
        window.addEventListener("keyup", this.#onKeyUp)
    }

    /**
     * Retrieves the active `InputManager` instance registered with the given engine.
     *
     * This is the recommended way to access the `InputManager` from anywhere
     * in your game logic (e.g. inside a `GameObject` update callback).
     *
     * @param engine - The `Engine` instance to retrieve the resource from.
     * @returns The `InputManager` instance stored in the engine's resource map.
     * @throws {Error} If {@link inputPlugin} has not been registered with the engine.
     *
     * @example
     * const input = InputManager.get(engine);
     *
     * if (input.isDown("ArrowUp")) {
     *   player.transform.position.y -= speed * dt;
     * }
     */
    static get(engine: Engine): InputManager {
        const input = engine.getResource(InputManager)
        if (!input) throw new Error("InputPlugin has not been added to the Engine.")
        return input
    }

    /**
     * Internal `keydown` handler attached to `window`.
     *
     * Guards against OS-level key-repeat events so that {@link isJustDown}
     * only returns `true` on the very first frame the key is pressed, not
     * every frame while it is held.
     *
     * @internal
     */
    #onKeyDown = (e: KeyboardEvent) => {
        // Evita registrar múltiplos justPressed se o usuário segurar a tecla (auto-repeat do SO)
        if (!this.#keys.has(e.code)) {
            this.#justPressed.add(e.code)
        }
        this.#keys.add(e.code)
    }

    /**
     * Internal `keyup` handler attached to `window`.
     *
     * Removes the key from the held-keys set and marks it as just-released
     * so {@link isJustUp} returns `true` for the current frame.
     *
     * @internal
     */
    #onKeyUp = (e: KeyboardEvent) => {
        this.#keys.delete(e.code)
    }

    /**
     * Returns `true` while the specified key is physically held down.
     *
     * Suitable for continuous actions such as movement, where the action
     * should repeat every frame for as long as the key is held.
     *
     * @param code - A `KeyboardEvent.code` string (e.g. `"KeyW"`, `"ArrowUp"`, `"Space"`).
     * @returns `true` if the key is currently pressed, `false` otherwise.
     *
     * @example
     * // Move the player right every frame while the key is held
     * if (input.isDown("ArrowRight")) {
     *   player.transform.position.x += speed * dt;
     * }
     */
    isDown(code: string): boolean {
        return this.#keys.has(code)
    }

    /**
     * Returns `true` while the specified key is **not** held down.
     *
     * This is the logical inverse of {@link isDown}. Useful for guards or
     * conditional logic that should only run when a key is not being pressed.
     *
     * @param code - A `KeyboardEvent.code` string (e.g. `"KeyW"`, `"ArrowUp"`, `"Space"`).
     * @returns `true` if the key is NOT currently pressed, `false` otherwise.
     *
     * @example
     * if (input.isUp("ShiftLeft")) {
     *   // Player is not sprinting — apply normal movement speed
     *   player.speed = BASE_SPEED;
     * }
     */
    isUp(code: string): boolean {
        return !this.#keys.has(code)
    }

    /**
     * Returns `true` only on the **single frame** the key transitions from
     * released → pressed.
     *
     * Use this for one-shot actions such as jumping, firing a weapon, or
     * toggling a menu — actions that should happen exactly once per key press,
     * regardless of how long the key is held.
     *
     * @param code - A `KeyboardEvent.code` string (e.g. `"Space"`, `"KeyE"`).
     * @returns `true` if the key was pressed for the first time this frame, `false` otherwise.
     *
     * @example
     * if (input.isJustDown("Space")) {
     *   player.jump(); // Fires once even if Space is held for several frames
     * }
     */
    isJustDown(code: string): boolean {
        return this.#justPressed.has(code)
    }

    /**
     * Returns `true` only on the **single frame** the key transitions from
     * pressed → released.
     *
     * Useful for actions that should trigger at the moment the player lets go
     * of a key (e.g. releasing a charged attack).
     *
     * @param code - A `KeyboardEvent.code` string (e.g. `"Space"`, `"KeyE"`).
     * @returns `true` if the key was released this frame, `false` otherwise.
     *
     * @example
     * if (input.isJustUp("Space")) {
     *   player.releaseChargedShot();
     * }
     */
    isJustUp(code: string): boolean {
        return this.#justReleased.has(code)
    }

    /**
     * Clears the per-frame edge-triggered sets (`justPressed` and `justReleased`).
     *
     * This must be called once per game frame — the {@link inputPlugin} handles
     * this automatically by invoking it inside its `update` lifecycle hook.
     *
     * @internal Called automatically each frame by the plugin. Do not call manually.
     */
    update(): void {
        this.#justPressed.clear()
        this.#justReleased.clear()
    }

    /**
     * Removes the `keydown`/`keyup` event listeners from `window` and clears
     * all tracked key state.
     *
     * Called automatically by the {@link inputPlugin} when the engine is
     * destroyed. Safe to call manually if you need to detach input handling
     * early.
     *
     * @example
     * // Manually destroy if you need to disable input during a cutscene:
     * InputManager.get(engine).destroy();
     */
    destroy(): void {
        window.removeEventListener("keydown", this.#onKeyDown)
        window.removeEventListener("keyup", this.#onKeyUp)
        this.#keys.clear()
    }

}