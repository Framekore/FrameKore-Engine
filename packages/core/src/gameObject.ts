import type { Engine } from "./engine"

export abstract class GameObject {

    engine: Engine

    destroyed = false

    #objects = new Set<GameObject>()

    constructor(engine: Engine) {
        this.engine = engine
    }

    addComponent(component: GameObject): void {
        this.#objects.add(component)
    }

    getComponents(): Set<GameObject> {
        return this.#objects
    }

    destroy(): void {
        if (this.destroyed) return
        this.destroyed = true
    }

    update?(delta: number): void
    fixedUpdate?(delta: number): void
}