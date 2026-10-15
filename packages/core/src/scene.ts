import { GameObject } from "./gameObject"

/**
 * The container for all active game objects in FrameKore Engine.
 *
 * `Scene` extends {@link GameObject}, making it a first-class participant in
 * the engine's lifecycle. Plugins and the engine itself interact with the active
 * scene to drive updates and rendering every frame.
 *
 * ### Responsibilities
 * - **Object registry**: holds every `GameObject` and its components in a flat
 *   list so that the scene can dispatch `update` / `fixedUpdate` calls without
 *   recursive traversal.
 * - **Lifecycle hooks**: `onEnter` fires when the scene becomes active;
 *   `onExit` fires when it is replaced by another scene via `engine.setScene`.
 * - **Engine propagation**: `add` automatically stamps the engine reference onto
 *   objects and their registered components.
 *
 * ### Usage
 * Extend `Scene` to create a concrete game state (level, menu, cutscene, …):
 *
 * ```ts
 * class Level1 extends Scene {
 *   player!: Player;
 *
 *   onEnter(): void {
 *     this.player = new Player(this.engine);
 *     this.add(this.player);
 *   }
 *
 *   onExit(): void {
 *     console.log('Leaving Level 1');
 *   }
 * }
 *
 * engine.setScene(new Level1(engine));
 * ```
 *
 * @abstract
 */
export abstract class Scene extends GameObject {
    /**
     * Flat list of every {@link GameObject} registered in the scene, including
     * the components of objects added via {@link add}.
     *
     * Kept as a flat array so that `update` and `fixedUpdate` can iterate once
     * over the whole scene without recursion. Do not mutate this array directly —
     * use {@link add} instead.
     *
     * @protected
     */
    protected objects: GameObject[] = []

    /**
     * Optional lifecycle hook invoked by {@link Engine.setScene} immediately after
     * this scene becomes the active scene and all engine references have been
     * propagated.
     *
     * Use this to spawn initial game objects, load resources, or play intro
     * effects. Equivalent to a constructor that has access to `this.engine`.
     *
     * @example
     * onEnter(): void {
     *   this.background = new Background(this.engine);
     *   this.add(this.background);
     * }
     */
    onEnter?(): void

    /**
     * Optional lifecycle hook invoked by {@link Engine.setScene} on the *outgoing*
     * scene, just before it is replaced.
     *
     * Use this to clean up timers, pause music, or persist state before the scene
     * is discarded. The return type is `SecurityPolicyViolationEventDisposition`
     * to satisfy the browser's `beforeunload`-style event API; returning `void`
     * is also acceptable in most scenarios.
     *
     * @example
     * onExit(): void {
     *   this.backgroundMusic.stop();
     * }
     */
    onExit?(): SecurityPolicyViolationEventDisposition

    /**
     * Registers a {@link GameObject} (and all its attached components) with the scene.
     *
     * When called after a scene has been made active (i.e., `this.engine` is set),
     * the engine reference is stamped onto `obj` and every one of its components
     * before they are appended to the internal object list.
     *
     * The insertion order is:
     * 1. Each component of `obj` (in the order they were added via `addComponent`).
     * 2. `obj` itself.
     *
     * @param obj - The `GameObject` to register. Its components are automatically
     *              flattened into the scene's object list.
     *
     * @example
     * onEnter(): void {
     *   const player = new Player(this.engine);
     *   this.add(player); // also registers player.transform, player.sprite, etc.
     * }
     */
    add(obj: GameObject): void {
        const engine = this.engine
        if (engine) {
            obj.engine = engine
        }
        for (const component of obj.getComponents()) {
            if (engine) {
                component.engine = engine
            }
            this.objects.push(component)
        }
        this.objects.push(obj)
    }

    /**
     * Iterates over all registered objects and invokes their optional `update` hook.
     *
     * Called once per frame by the engine at `Priority.UPDATE` with a variable
     * time step. Objects are visited in insertion order (components before their owner).
     *
     * @param delta - Time elapsed since the last frame, in seconds.
     *
     * @example
     * // Automatically called by the engine — no manual invocation needed.
     * scene.update(delta);
     */
    update(delta: number): void {
        for (const obj of this.objects) {
            obj.update?.(delta)
        }
    }

    /**
     * Iterates over all registered objects and invokes their optional `fixedUpdate` hook.
     *
     * Called at a fixed time step by the engine at `Priority.FIXED_UPDATE`.
     * Objects are visited in insertion order (components before their owner).
     *
     * @param delta - The fixed time step duration, in seconds.
     *
     * @example
     * // Automatically called by the engine — no manual invocation needed.
     * scene.fixedUpdate(delta);
     */
    fixedUpdate(delta: number): void {
        for (const obj of this.objects) {
            obj.fixedUpdate?.(delta)
        }
    }

    /**
     * Returns the flat array of every {@link GameObject} currently registered in
     * the scene, including components.
     *
     * Used by {@link Engine.setScene} to propagate the engine reference to all
     * objects when a scene is (re-)activated, and by plugins that need to scan
     * the scene for specific component types.
     *
     * @returns The live internal array of registered objects. Do not mutate it directly.
     *
     * @example
     * const renderables = scene
     *   .getObjects()
     *   .filter(obj => obj instanceof Renderable2D);
     */
    getObjects(): GameObject[] {
        return this.objects
    }
}
