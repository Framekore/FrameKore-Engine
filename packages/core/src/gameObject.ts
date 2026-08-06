import type { Engine } from "./engine"
import type { Component } from "./utils/component"
import type { ComponentKey, ComponentClass } from "./utils/componentKey"

/**
 * Base class for all entities in a Scene.
 * A GameObject acts as a container for Components, which define its behavior and data.
 */
export class GameObject {
    #components = new Map<symbol, Component>()
    
    /** 
     * The engine instance this GameObject belongs to. 
     * Automatically set when added to a Scene that is attached to the Engine.
     */
    engine?: Engine
    
    /** 
     * Indicates whether this GameObject has been destroyed.
     * A destroyed GameObject should no longer be used or updated.
     */
    destroyed = false

    #resolveKey<T extends Component>(key: ComponentKey<T>): symbol {
        if (typeof key === "symbol") return key
        if (key.key) return key.key

        throw new Error("Component class missing static key.")
    }

    /**
     * Adds a component to this GameObject.
     * @param component - The component instance to add.
     * @returns The added component instance.
     * @throws Error if the component class lacks a static key or if the GameObject is destroyed/not attached to an Engine.
     * @example
     * const transform = gameObject.addComponent(new Transform2D());
     */
    addComponent<T extends Component>(component: T): T {
        const ctor = component.constructor as ComponentClass<T>

        if (!ctor.key) {
            throw new Error(`Component ${ctor.name} missing static key.`)
        }

        return this.#setComponent(ctor.key, component)
    }

    #setComponent<T extends Component>(key: symbol, component: T): T {
        this.#assertNotDestroyed()
        this.#assertEngine()
        this.#assertComponentOwnership(component)

        const current = this.#components.get(key)

        if (current === component) {
            return component
        }

        if (current) {
            this.#detachComponent(key, current)
        }

        component.gameObject = this
        this.#components.set(key, component)

        component.onAdded?.()
        this.engine!.notifyComponentAdded(component)

        return component
    }

    /**
     * Removes a specific component from this GameObject.
     * @param key - The class or symbol key of the component to remove.
     * @returns The removed component, or undefined if it was not found.
     * @example
     * const removedTransform = gameObject.removeComponent(Transform2D);
     */
    removeComponent<T extends Component>(key: ComponentKey<T>): T | undefined {
        this.#assertNotDestroyed()
        this.#assertEngine()

        const resolvedKey = this.#resolveKey(key)
        const component = this.#components.get(resolvedKey) as T | undefined

        if (!component) return undefined

        this.#detachComponent(resolvedKey, component)
        return component
    }

    /**
     * Retrieves a specific component from this GameObject.
     * @param key - The class or symbol key of the component to retrieve.
     * @returns The component instance, or undefined if not found.
     * @example
     * const transform = gameObject.getComponent(Transform2D);
     * if (transform) { transform.x = 100; }
     */
    getComponent<T extends Component>(key: ComponentKey<T>): T | undefined {
        return this.#components.get(this.#resolveKey(key)) as T | undefined
    }

    /**
     * Checks if this GameObject has a specific component.
     * @param key - The class or symbol key of the component to check for.
     * @returns True if the component exists on this GameObject, otherwise false.
     * @example
     * if (gameObject.hasComponent(Transform2D)) { ... }
     */
    hasComponent<T extends Component>(key: ComponentKey<T>): boolean {
        return this.#components.has(this.#resolveKey(key))
    }

    /**
     * Retrieves all components attached to this GameObject.
     * @returns A read-only array of all component instances.
     * @example
     * const components = gameObject.getAllComponents();
     */
    getAllComponents(): readonly Component[] {
        return [...this.#components.values()]
    }

    /**
     * Destroys this GameObject and removes all its components.
     * Cannot be undone.
     * @example
     * gameObject.destroy();
     */
    destroy(): void {
        if (this.destroyed) return
        this.#assertEngine()

        const entries = [...this.#components.entries()]

        for (const [key, component] of entries) {
            this.#detachComponent(key, component)
        }

        this.destroyed = true
    }

    #detachComponent(key: symbol, component: Component): void {
        component.onRemoved?.()
        this.engine!.notifyComponentRemoved(component)
        this.#components.delete(key)
        component.gameObject = undefined
    }

    #assertComponentOwnership(component: Component): void {
        if (component.gameObject && component.gameObject !== this) {
            throw new Error("This component already belongs to another GameObject.")
        }
    }

    #assertEngine(): void {
        if (!this.engine) {
            throw new Error("GameObject is not attached to an Engine.")
        }
    }

    #assertNotDestroyed(): void {
        if (this.destroyed) {
            throw new Error("GameObject has already been destroyed.")
        }
    }

    /**
     * Optional draw method for custom rendering logic directly on the GameObject.
     * Usually, rendering should be handled by a specific Component (like Sprite2D) and a RenderPlugin.
     */
    draw?(): void

    /**
     * Called every frame during the update cycle.
     * Override this method to add custom frame-by-frame logic to the GameObject.
     * @param _delta - The time elapsed since the last frame.
     */
    update(_delta: number): void {}

    /**
     * Called at fixed time intervals during the fixedUpdate cycle.
     * Override this method to add physics or time-consistent logic to the GameObject.
     * @param _delta - The fixed time step.
     */
    fixedUpdate(_delta: number): void {}
}