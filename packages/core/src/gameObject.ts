import type { Engine } from "./engine"

/**
 * The fundamental building block of every entity in FrameKore Engine.
 *
 * `GameObject` is an abstract base class that every in-game object — characters,
 * bullets, colliders, cameras, UI elements — must extend. It provides:
 *
 * - A reference to the owning {@link Engine} instance.
 * - A component sub-graph: child `GameObject` instances attached via
 *   {@link addComponent} and iterated via {@link getComponents}.
 * - Optional `update` / `fixedUpdate` lifecycle hooks called by the active
 *   {@link Scene} each frame.
 * - A {@link destroy} method that marks the object as dead.
 *
 * ### Component pattern
 * FrameKore uses a **property-based** component model. Attach a component by
 * assigning it as a public property of the owner *and* calling `addComponent`:
 *
 * ```ts
 * class Player extends GameObject {
 *   transform = new Transform2D(this.engine);
 *   sprite    = new Sprite2D(this.engine);
 *
 *   constructor(engine: Engine) {
 *     super(engine);
 *     this.addComponent(this.transform);
 *     this.addComponent(this.sprite);
 *   }
 * }
 * ```
 *
 * Helpers such as `getComponentByType` can then locate a component by its class.
 *
 * @abstract
 */
export abstract class GameObject {

    /**
     * Reference to the engine instance that owns this object.
     *
     * Automatically populated by {@link Scene.add} and {@link Engine.setScene}.
     * Plugins and components should read this reference rather than holding a
     * direct engine reference to avoid stale closures when scenes change.
     */
    engine: Engine

    /**
     * Indicates whether this object has been destroyed.
     *
     * Set to `true` by {@link destroy}. Systems and plugins should check this
     * flag to skip processing of dead objects before removing them from their
     * internal lists.
     *
     * @defaultValue false
     */
    destroyed = false

    /**
     * Internal set of attached child components.
     * Populated via {@link addComponent} and exposed read-only via {@link getComponents}.
     * @internal
     */
    #objects = new Set<GameObject>()

    /**
     * Creates a new `GameObject`.
     *
     * @param engine - The engine instance this object belongs to.
     *                 Usually passed down from a {@link Scene} or parent object.
     * @internal Subclasses call `super(engine)` — do not instantiate `GameObject` directly.
     */
    constructor(engine: Engine) {
        this.engine = engine
    }

    /**
     * Attaches a child component to this object.
     *
     * Registering a component here ensures that {@link Scene.add} will propagate
     * the engine reference to it and that {@link getComponentByType} can locate it.
     * Conventionally, also assign the component to a public property so it is
     * accessible via normal property access.
     *
     * @param component - The `GameObject`-derived component to attach.
     *
     * @example
     * class Enemy extends GameObject {
     *   body = new RigidBody2D(this.engine);
     *
     *   constructor(engine: Engine) {
     *     super(engine);
     *     this.addComponent(this.body);
     *   }
     * }
     */
    addComponent(component: GameObject): void {
        this.#objects.add(component)
    }

    /**
     * Returns the set of all components attached to this object via {@link addComponent}.
     *
     * The returned `Set` is the live internal collection — do not mutate it directly.
     * Use {@link addComponent} to register new components.
     *
     * @returns A `Set` containing all attached child components.
     *
     * @example
     * for (const component of player.getComponents()) {
     *   component.update?.(delta);
     * }
     */
    getComponents(): Set<GameObject> {
        return this.#objects
    }

    /**
     * Marks this object as destroyed by setting {@link destroyed} to `true`.
     *
     * Calling `destroy` on an already-destroyed object is a no-op, making it
     * safe to call multiple times. Actual removal from the scene or any system
     * is the responsibility of the caller (e.g., the scene's update loop).
     *
     * @example
     * if (enemy.health <= 0) {
     *   enemy.destroy();
     * }
     */
    destroy(): void {
        if (this.destroyed) return
        this.destroyed = true
    }

    /**
     * Optional per-frame update hook called by the active {@link Scene} with a
     * variable time step.
     *
     * Override this in subclasses to implement game logic that runs every frame,
     * such as input reading, animation, AI, or movement.
     *
     * @param delta - Time elapsed since the last frame, in seconds.
     *
     * @example
     * update(delta: number): void {
     *   this.transform.x += this.speed * delta;
     * }
     */
    update?(delta: number): void

    /**
     * Optional fixed-step update hook called by the active {@link Scene} at a
     * consistent rate (default 60 times per second), independent of frame rate.
     *
     * Override this in subclasses for physics simulation, collision resolution,
     * or any logic that must be deterministic and frame-rate independent.
     *
     * @param delta - The fixed time step duration, in seconds.
     *
     * @example
     * fixedUpdate(delta: number): void {
     *   this.body.velocity.y += this.gravity * delta;
     * }
     */
    fixedUpdate?(delta: number): void
}

/**
 * Locates the first component of a given type attached to a `GameObject`.
 *
 * The search iterates over the **enumerable own properties** of `obj` using
 * `Object.values`, returning the first value that is an instance of `constructor`.
 * This means the component must be stored as a public property of the owner
 * (not only registered via `addComponent`) in order to be found.
 *
 * @typeParam T - The expected component type.
 * @param obj - The `GameObject` whose properties are searched.
 * @param constructor - The class constructor to match against (using `instanceof`).
 * @returns The first matching component instance, or `undefined` if none is found.
 *
 * @example
 * const body = getComponentByType(player, RigidBody2D);
 * if (body) {
 *   body.velocity.x = 100;
 * }
 *
 * @example
 * // Also works with base classes
 * const renderable = getComponentByType(enemy, Renderable2D);
 */
export function getComponentByType<T>(obj: GameObject, constructor: new (...args: any[]) => T): T | undefined {
    return Object.values(obj).find((val): val is T => val instanceof constructor);
}