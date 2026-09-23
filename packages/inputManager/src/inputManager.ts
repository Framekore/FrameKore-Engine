import { definePlugin, type Engine } from "@framekore/core";

/**
 * Creates an Input plugin for the Engine.
 * Registers the InputManager to handle keyboard events globally.
 * @returns An EnginePlugin definition to be passed to `engine.use()`.
 * @example
 * engine.use(inputPlugin());
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
 * Manages global keyboard input state.
 * Listens to `keydown` and `keyup` events on the window object.
 */
export class InputManager {
    #keys = new Set<string>();
    #justReleased = new Set<string>();
    #justPressed = new Set<string>();

    /**
     * @internal Created automatically by the `inputPlugin`.
     */
    constructor() {
        window.addEventListener("keydown", this.#onKeyDown)
        window.addEventListener("keyup", this.#onKeyUp)
    }

    /**
     * Retrieves the active InputManager instance from an Engine.
     * @param engine - The Engine instance.
     * @returns The InputManager instance.
     * @throws If the InputManager has not been added to the Engine via `inputPlugin`.
     * @example
     * const input = InputManager.get(engine);
     * if (input.isDown("ArrowUp")) { ... }
     */
    static get(engine: Engine): InputManager {
        const input = engine.getResource(InputManager)
        if (!input) throw new Error("InputPlugin has not been added to the Engine.")
        return input
    }

    #onKeyDown = (e: KeyboardEvent) => {
        // Evita registrar múltiplos justPressed se o usuário segurar a tecla (auto-repeat do SO)
        if (!this.#keys.has(e.code)) {
            this.#justPressed.add(e.code)
        }
        this.#keys.add(e.code)
    }

    #onKeyUp = (e: KeyboardEvent) => {
        this.#keys.delete(e.code)
    }

    /**
     * Checks if a specific key is currently being pressed down.
     * @param code - The KeyboardEvent.code string (e.g., "KeyW", "ArrowUp", "Space").
     * @returns True if the key is pressed, false otherwise.
     * @example
     * if (input.isDown("Space")) {
     *   player.jump();
     * }
     */
    isDown(code: string): boolean {
        return this.#keys.has(code)
    }

    /**
     * Checks if a specific key is not currently being pressed down.
     * @param code - The KeyboardEvent.code string (e.g., "KeyW", "ArrowUp", "Space").
     * @returns True if the key is NOT pressed, false otherwise.
     * @example
     * if (input.isUp("Space")) {
     *   // Ação a ser executada enquanto a tecla não estiver pressionada
     * }
     */
    isUp(code: string): boolean {
        return !this.#keys.has(code)
    }

    /**
     * Checks if a specific key was pressed down in the current frame.
     * Ideal for single-trigger actions like jumping or shooting.
     * @param code - The KeyboardEvent.code string.
     */
    isJustDown(code: string): boolean {
        return this.#justPressed.has(code)
    }

    /**
     * Checks if a specific key was released in the current frame.
     * @param code - The KeyboardEvent.code string.
     */
    isJustUp(code: string): boolean {
        return this.#justReleased.has(code)
    }

    /**
     * @internal
     */
    update(): void {
        this.#justPressed.clear()
        this.#justReleased.clear()
    }

    /**
     * Cleans up event listeners and clears the tracked keys.
     * Automatically called when the plugin is destroyed.
     */
    destroy(): void {
        window.removeEventListener("keydown", this.#onKeyDown)
        window.removeEventListener("keyup", this.#onKeyUp)
        this.#keys.clear()
    }

}