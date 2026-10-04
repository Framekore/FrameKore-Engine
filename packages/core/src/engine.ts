import { Priority, Ticker } from "./utils/ticker"
import type { Scene } from "./scene"

/**
 * Interface defining the structure of an Engine Plugin.
 * Plugins extend the core functionality of the engine.
 */
export interface EnginePlugin {
    /** The unique name of the plugin */
    name: string
    /**
     * Called when the plugin is added to the engine.
     * @param engine - The engine instance.
     */
    setup(engine: Engine): void
    /**
     * Called when the plugin is destroyed or removed from the engine.
     * @param engine - The engine instance.
     */
    destroy?(engine: Engine): void

    /**
     * Called during the engine's render cycle.
     * @param scene - The current active scene.
     * @param delta - The time elapsed since the last render frame.
     */
    render?(scene: Scene, delta: number): void
    /**
     * Called during the engine's update cycle.
     * @param engine - The engine instance.
     * @param delta - The time elapsed since the last update frame.
     */
    update?(engine: Engine, delta: number): void
    /**
     * Called during the engine's fixed update cycle.
     * @param engine - The engine instance.
     * @param delta - The fixed time step.
     */
    fixedUpdate?(engine: Engine, delta: number): void
}

/**
 * Interface for objects that can be debugged visually.
 */
export interface IDebuggable {
    /** Optional color used for drawing debug boundaries */
    readonly debugCollor?: string
    /**
     * Retrieves the bounding box of the object for debugging purposes.
     * @returns An object containing x, y, width (w), and height (h).
     */
    getDebugBounds(): {
        x: number
        y: number
        w: number
        h: number
    }
}

export type RenderCallback = () => void;

/**
 * The core Engine class.
 * It manages scenes, plugins, resources, and the main game loop (ticker).
 */
export class Engine {
    #ticker: Ticker
    #currentScene?: Scene
    #plugins = new Map<string, EnginePlugin>()
    #resources = new Map<any, any>()
    #renderListeners = new Set<RenderCallback>();

    paused: boolean = false

    constructor() {
        this.#ticker = new Ticker()
        this.#ticker.add(this.#update, Priority.UPDATE)
        this.#ticker.add(this.#fixedUpdate, Priority.FIXED_UPDATE)
        this.#ticker.add(this.#render, Priority.RENDER)
    }

    /**
     * Registers a global resource in the engine.
     * @param key - The identifier for the resource.
     * @param resource - The resource instance or value.
     * @returns The engine instance for chaining.
     * @example
     * engine.setResource('MyConfig', { volume: 1.0 });
     * engine.setResource(PhysicsSystem, new PhysicsSystem());
     */
    setResource(key: any, resource: any): this {
        this.#resources.set(key, resource)
        return this
    }

    /**
     * Retrieves a registered resource from the engine.
     * @param key - The class constructor of the resource to retrieve.
     * @returns The resource instance.
     * @example const physics = engine.getResource(PhysicsSystem);
     */
    getResource<T>(key: new (...args: any[]) => T): T
    /**
     * Retrieves a registered resource from the engine by its property key (e.g., string).
     * @param key - The string or symbol identifier of the resource.
     * @returns The resource instance.
     * @example const config = engine.getResource('MyConfig');
     */
    getResource<T>(key: PropertyKey): T
    getResource(key: any) {
        if (!this.#resources.has(key)) return
        return this.#resources.get(key)
    }

    // Engine

    #update = (delta: number) => {
        if (this.paused) return
        this.#currentScene?.update(delta)
        for (const plugin of this.#plugins.values()) {
            plugin.update?.(this, delta)
        }
    }

    #fixedUpdate = (delta: number) => {
        if (this.paused) return
        this.#currentScene?.fixedUpdate?.(delta)

        for (const plugin of this.#plugins.values()) {
            plugin.fixedUpdate?.(this, delta)
        }
    }

    // Scene
    /**
     * Sets the active scene for the engine.
     * Replaces the current scene and manages lifecycle hooks (onExit/onEnter).
     * @param cena - The scene to be set as active.
     * @example
     * const myScene = new Scene();
     * engine.setScene(myScene);
     */
    setScene(cena: Scene): void {
        this.#currentScene?.onExit?.()
        this.#currentScene = cena
        this.#currentScene.engine = this
        for (const obj of this.#currentScene.getObjects()) {
            obj.engine = this
        }
        this.#currentScene.onEnter?.()
    }

    #render = (delta: number) => {
        if (!this.#currentScene) return
        for (const plugin of this.#plugins.values()) {
            plugin.render?.(this.#currentScene, delta)
        }
    }

    /**
     * Registers and initializes a plugin in the engine.
     * @param plugin - The plugin instance to add.
     * @returns The engine instance for chaining.
     * @throws Error if a plugin with the same name is already registered.
     * @example
     * engine.use(new InputPlugin());
     */
    use(plugin: EnginePlugin): this {
        if (this.#plugins.has(plugin.name)) throw new Error(`The plugin ${plugin.name} is already added.`)
        plugin.setup(this)
        this.#plugins.set(plugin.name, plugin)
        return this
    }

    /**
     * Destroys the engine and cleans up all registered plugins.
     * @example engine.destroy();
     */
    destroy(): void {
        for (const plugin of this.#plugins.values()) {
            plugin.destroy?.(this)
        }
    }

    /**
     * Starts the engine's internal ticker (game loop).
     * @example engine.start();
     */
    start(): void {
        this.#ticker.start()
    }

    /**
     * Stops the engine's internal ticker (game loop).
     * @example engine.stop();
     */
    stop(): void {
        this.#ticker.stop()
    }

    /**
     * Gets the engine's ticker instance.
     * @returns The Ticker used by the engine.
     */
    get ticker(): Ticker {
        return this.#ticker
    }

    /**
     * Gets the currently active scene.
     * @returns The current Scene, or undefined if no scene is set.
     */
    get currentScene(): Scene | undefined {
        return this.#currentScene
    }

    /**
     * Subscribes a listener to be executed during the render phase of the engine loop.
     * @param listener - Callback function executed during render step.
     * @returns Cleanup function to unsubscribe the listener.
     */
    onRender(listener: RenderCallback): () => void {
        this.#renderListeners.add(listener);
        return () => this.#renderListeners.delete(listener);
    }

}

/**
 * Helper function to define an engine plugin.
 * @param plugin - An EnginePlugin object or a function that returns an EnginePlugin object.
 * @returns A factory function that returns the plugin.
 * @example
 * const myPlugin = definePlugin({
 *   name: 'MyPlugin',
 *   setup: (engine) => console.log('Plugin Setup!')
 * });
 * engine.use(myPlugin());
 */
export function definePlugin(plugin: EnginePlugin): () => EnginePlugin
/**
 * Helper function to define an engine plugin using a factory function.
 * @param plugin - A factory function that returns an EnginePlugin object.
 * @returns The same factory function.
 * @example
 * const myPluginFactory = definePlugin((config) => ({
 *   name: 'MyConfigurablePlugin',
 *   setup: (engine) => console.log('Configured with:', config)
 * }));
 * engine.use(myPluginFactory({ debug: true }));
 */
export function definePlugin<T extends ((...args: any[]) => EnginePlugin)>(plugin: T): T
export function definePlugin(plugin: any): any {
    if (typeof plugin === "object") return () => plugin
    if (typeof plugin === "function") return plugin
    throw new TypeError("The Plugin must be an object or a function that returns an object")
}