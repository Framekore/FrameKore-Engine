import { Priority, Ticker } from "./utils/ticker"
import type { Scene } from "./scene"

/**
 * Defines the contract for an Engine Plugin.
 *
 * Plugins are the primary extension mechanism of FrameKore. They hook into the
 * engine's lifecycle — `setup`, `update`, `fixedUpdate`, and `render` — to
 * add features such as rendering pipelines, physics systems, input handling, and more.
 *
 * Register a plugin with {@link Engine.use}:
 * ```ts
 * engine.use(myPlugin());
 * ```
 *
 * @example
 * const myPlugin = definePlugin({
 *   name: 'MyPlugin',
 *   setup(engine) {
 *     engine.setResource('greeting', 'Hello!');
 *   },
 *   update(engine, delta) {
 *     console.log('tick', delta);
 *   }
 * });
 *
 * engine.use(myPlugin());
 */
export interface EnginePlugin {
    /**
     * The unique identifier of the plugin.
     * The engine uses this name to prevent duplicate registrations.
     */
    name: string

    /**
     * Called once when the plugin is registered via {@link Engine.use}.
     * Use this hook to initialize resources, register event listeners, or
     * add ticker callbacks.
     *
     * @param engine - The engine instance the plugin is being registered on.
     */
    setup(engine: Engine): void

    /**
     * Optional teardown hook called by {@link Engine.destroy}.
     * Use this to clean up any resources, listeners, or state created in `setup`.
     *
     * @param engine - The engine instance the plugin is being removed from.
     */
    destroy?(engine: Engine): void

    /**
     * Optional hook called once per render frame, after the scene's own
     * `update` has run. Ideal for driving rendering pipelines (e.g., collecting
     * drawables and flushing them to a canvas).
     *
     * @param scene - The currently active scene.
     * @param delta - Time elapsed since the last frame, in seconds.
     */
    render?(scene: Scene, delta: number): void

    /**
     * Optional hook called once per game loop tick, before rendering.
     * Receives the variable delta time and is the standard place for game logic.
     *
     * @param engine - The engine instance.
     * @param delta - Time elapsed since the last frame, in seconds.
     */
    update?(engine: Engine, delta: number): void

    /**
     * Optional hook called at a fixed time step, independent of frame rate.
     * Ideal for physics simulation and any logic that must be deterministic.
     *
     * @param engine - The engine instance.
     * @param delta - The fixed time step duration, in seconds.
     */
    fixedUpdate?(engine: Engine, delta: number): void
}

/**
 * Defines the contract for objects that expose debug-rendering information.
 *
 * Implement this interface on any game object or component whose bounding box
 * should be visualised by a debug overlay plugin.
 *
 * @example
 * class MyCollider extends GameObject implements IDebuggable {
 *   readonly debugCollor = 'rgba(255, 0, 0, 0.5)';
 *
 *   getDebugBounds() {
 *     return { x: this.x, y: this.y, w: this.width, h: this.height };
 *   }
 * }
 */
export interface IDebuggable {
    /**
     * An optional CSS colour string used by a debug overlay to stroke or fill
     * the debug boundary. Falls back to the plugin's default colour if omitted.
     *
     * @example 'rgba(255, 0, 0, 0.4)'
     */
    readonly debugCollor?: string

    /**
     * Returns the axis-aligned bounding box of the object, in world-space pixels.
     * Called every frame by a debug-overlay plugin to draw the boundary.
     *
     * @returns An object with the top-left corner (`x`, `y`) and dimensions (`w`, `h`),
     *          all expressed in pixels.
     */
    getDebugBounds(): {
        /** Left edge of the bounding box, in pixels. */
        x: number
        /** Top edge of the bounding box, in pixels. */
        y: number
        /** Width of the bounding box, in pixels. */
        w: number
        /** Height of the bounding box, in pixels. */
        h: number
    }
}

/**
 * A zero-argument callback invoked during the engine's render phase.
 * Returned by {@link Engine.onRender} and used internally to notify
 * external subscribers of each render tick.
 */
export type RenderCallback = () => void;

/**
 * The central hub of FrameKore Engine.
 *
 * `Engine` owns the game loop ({@link Ticker}), manages the active {@link Scene},
 * coordinates all registered {@link EnginePlugin | plugins}, and acts as a
 * service-locator for shared resources (physics managers, asset managers, etc.).
 *
 * ### Typical setup
 * ```ts
 * const engine = new Engine();
 *
 * engine
 *   .use(renderPlugin())
 *   .use(inputPlugin())
 *   .use(physicsPlugin());
 *
 * engine.setScene(new GameScene(engine));
 * engine.start();
 * ```
 *
 * ### Game loop order per frame
 * 1. `Priority.UPDATE` listeners (variable delta)
 * 2. `Priority.FIXED_UPDATE` listeners (fixed step, may run 0–N times)
 * 3. `Priority.RENDER` listeners (capped to target FPS)
 */
export class Engine {
    /** @internal The underlying game-loop controller. */
    #ticker: Ticker
    /** @internal The currently loaded scene. */
    #currentScene?: Scene
    /** @internal Map of registered plugins, keyed by {@link EnginePlugin.name}. */
    #plugins = new Map<string, EnginePlugin>()
    /** @internal Map of global resources, keyed by class constructor or arbitrary key. */
    #resources = new Map<any, any>()
    /** @internal Set of callbacks subscribed via {@link onRender}. */
    #renderListeners = new Set<RenderCallback>();

    /**
     * When `true`, all scene updates and plugin update/fixedUpdate hooks are skipped.
     * The render phase still runs so that a "paused" visual state can be displayed.
     * Set to `false` to resume normal execution.
     *
     * @example
     * engine.paused = true;   // freeze the game
     * engine.paused = false;  // resume
     */
    paused: boolean = false

    /**
     * Creates a new Engine instance and wires up the three core ticker phases:
     * `UPDATE`, `FIXED_UPDATE`, and `RENDER`.
     *
     * @internal Instantiate this once at application startup, not inside scenes.
     */
    constructor() {
        this.#ticker = new Ticker()
        this.#ticker.add(this.#update, Priority.UPDATE)
        this.#ticker.add(this.#fixedUpdate, Priority.FIXED_UPDATE)
        this.#ticker.add(this.#render, Priority.RENDER)
    }

    /**
     * Stores a global resource so it can be retrieved anywhere via {@link getResource}.
     *
     * Resources are singletons shared across the whole engine — physics managers,
     * asset managers, configuration objects, etc. The `key` can be either the
     * resource's class constructor (for type-safe retrieval) or any arbitrary value.
     *
     * @param key - Identifier for the resource. Typically the class constructor.
     * @param resource - The resource instance or value to store.
     * @returns The engine instance, enabling method chaining.
     *
     * @example
     * // Using a class constructor as key (recommended)
     * engine.setResource(Physics2D, new Physics2D());
     *
     * // Using a string key
     * engine.setResource('volume', 0.8);
     */
    setResource(key: any, resource: any): this {
        this.#resources.set(key, resource)
        return this
    }

    /**
     * Retrieves a previously registered resource by its class constructor.
     *
     * @typeParam T - The type of the resource.
     * @param key - The class constructor used as the resource key.
     * @returns The resource instance typed as `T`.
     *
     * @example
     * const physics = engine.getResource(Physics2D);
     * physics.addBody(myRigidBody);
     */
    getResource<T>(key: new (...args: any[]) => T): T
    /**
     * Retrieves a previously registered resource by an arbitrary property key.
     *
     * @typeParam T - The expected type of the resource value.
     * @param key - A string, number, or symbol key used when the resource was stored.
     * @returns The resource value typed as `T`.
     *
     * @example
     * const volume = engine.getResource<number>('volume');
     */
    getResource<T>(key: PropertyKey): T
    getResource(key: any) {
        if (!this.#resources.has(key)) return
        return this.#resources.get(key)
    }

    // Engine

    /**
     * @internal Called by the ticker at `Priority.UPDATE` every frame.
     * Forwards variable-delta updates to the active scene and all plugins.
     */
    #update = (delta: number) => {
        if (this.paused) return
        this.#currentScene?.update(delta)
        for (const plugin of this.#plugins.values()) {
            plugin.update?.(this, delta)
        }
    }

    /**
     * @internal Called by the ticker at `Priority.FIXED_UPDATE` on a fixed time step.
     * Forwards fixed-step updates to the active scene and all plugins.
     */
    #fixedUpdate = (delta: number) => {
        if (this.paused) return
        this.#currentScene?.fixedUpdate?.(delta)

        for (const plugin of this.#plugins.values()) {
            plugin.fixedUpdate?.(this, delta)
        }
    }

    // Scene

    /**
     * Replaces the currently active scene.
     *
     * The lifecycle hooks are called in the following order:
     * 1. `currentScene.onExit()` — tears down the old scene.
     * 2. The new scene becomes current and its `engine` reference is updated,
     *    as are the `engine` references of all its child objects.
     * 3. `newScene.onEnter()` — initialises the new scene.
     *
     * @param cena - The scene instance to activate.
     *
     * @example
     * const level1 = new Level1Scene(engine);
     * engine.setScene(level1);
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

    /**
     * @internal Called by the ticker at `Priority.RENDER` each frame.
     * Forwards the render call to all registered plugins.
     */
    #render = (delta: number) => {
        if (!this.#currentScene) return
        for (const plugin of this.#plugins.values()) {
            plugin.render?.(this.#currentScene, delta)
        }
    }

    /**
     * Registers and initialises an {@link EnginePlugin}.
     *
     * The plugin's `setup` method is called immediately. If a plugin with the
     * same {@link EnginePlugin.name} is already registered, an error is thrown
     * to prevent duplicate registrations.
     *
     * @param plugin - The plugin object to register.
     * @returns The engine instance, enabling method chaining.
     * @throws {Error} If a plugin with the same name has already been added.
     *
     * @example
     * engine
     *   .use(renderPlugin())
     *   .use(inputPlugin())
     *   .use(physicsPlugin());
     */
    use(plugin: EnginePlugin): this {
        if (this.#plugins.has(plugin.name)) throw new Error(`The plugin ${plugin.name} is already added.`)
        plugin.setup(this)
        this.#plugins.set(plugin.name, plugin)
        return this
    }

    /**
     * Shuts down the engine by calling the `destroy` hook on every registered plugin.
     * Call this when the application is unmounted or the engine is no longer needed.
     *
     * @example
     * window.addEventListener('unload', () => engine.destroy());
     */
    destroy(): void {
        for (const plugin of this.#plugins.values()) {
            plugin.destroy?.(this)
        }
    }

    /**
     * Starts the internal {@link Ticker}, beginning the game loop.
     * Safe to call multiple times — the ticker ignores redundant start calls.
     *
     * @example
     * engine.start();
     */
    start(): void {
        this.#ticker.start()
    }

    /**
     * Stops the internal {@link Ticker}, halting the game loop.
     * The loop can be restarted at any time by calling {@link start}.
     *
     * @example
     * engine.stop();
     */
    stop(): void {
        this.#ticker.stop()
    }

    /**
     * The engine's underlying {@link Ticker} instance.
     * Expose it to plugins that need to register their own ticker callbacks
     * at specific priorities.
     *
     * @example
     * const disposer = engine.ticker.add(myCallback, Priority.RENDER);
     */
    get ticker(): Ticker {
        return this.#ticker
    }

    /**
     * The currently active {@link Scene}, or `undefined` if no scene has been
     * set yet via {@link setScene}.
     *
     * @example
     * if (engine.currentScene) {
     *   console.log('Scene is active');
     * }
     */
    get currentScene(): Scene | undefined {
        return this.#currentScene
    }

    /**
     * Subscribes a callback to be invoked during the engine's render phase.
     *
     * Unlike plugin render hooks, this is intended for lightweight, ad-hoc render
     * subscriptions (e.g., from a React component or a one-off effect). The callback
     * receives no arguments — use a closure to capture any needed state.
     *
     * @param listener - The callback to invoke on each render tick.
     * @returns A cleanup function that unsubscribes the listener when called.
     *
     * @example
     * const unsubscribe = engine.onRender(() => {
     *   myHUD.draw();
     * });
     *
     * // Later, to stop receiving render events:
     * unsubscribe();
     */
    onRender(listener: RenderCallback): () => void {
        this.#renderListeners.add(listener);
        return () => this.#renderListeners.delete(listener);
    }

}

/**
 * Helper that normalises an {@link EnginePlugin} object or factory function into
 * a consistent zero-argument factory, making plugin registration uniform regardless
 * of how the plugin was defined.
 *
 * Use this to define plugins that will be consumed with `engine.use(myPlugin())`.
 *
 * @param plugin - A plain `EnginePlugin` object (will be wrapped in a factory) or
 *                 a function that returns an `EnginePlugin` (returned as-is).
 * @returns A factory function `() => EnginePlugin` (for object input) or
 *          the original factory function (for function input).
 * @throws {TypeError} If `plugin` is neither an object nor a function.
 *
 * @example
 * // Defining a static plugin
 * const logPlugin = definePlugin({
 *   name: 'LogPlugin',
 *   setup: (engine) => console.log('LogPlugin ready'),
 * });
 * engine.use(logPlugin());
 *
 * @example
 * // Defining a configurable plugin factory
 * const debugPlugin = definePlugin((color: string) => ({
 *   name: 'DebugPlugin',
 *   setup: (engine) => console.log('Debug color:', color),
 * }));
 * engine.use(debugPlugin('red'));
 */
export function definePlugin(plugin: EnginePlugin): () => EnginePlugin
/**
 * Overload for defining a plugin using a factory function.
 * The factory is returned as-is, preserving its signature so callers can
 * pass arguments when invoking `engine.use(myPlugin(options))`.
 *
 * @typeParam T - A function type that accepts any arguments and returns an `EnginePlugin`.
 * @param plugin - A factory function that returns an `EnginePlugin`.
 * @returns The same factory function, unchanged.
 *
 * @example
 * const physicsPlugin = definePlugin((gravity: number) => ({
 *   name: 'PhysicsPlugin',
 *   setup: (engine) => engine.setResource(Physics2D, new Physics2D(gravity)),
 * }));
 * engine.use(physicsPlugin(9.8));
 */
export function definePlugin<T extends ((...args: any[]) => EnginePlugin)>(plugin: T): T
export function definePlugin(plugin: any): any {
    if (typeof plugin === "object") return () => plugin
    if (typeof plugin === "function") return plugin
    throw new TypeError("The Plugin must be an object or a function that returns an object")
}