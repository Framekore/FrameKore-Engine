import type { Engine } from "./engine"
import type { GameObject } from "./gameObject"

/**
 * Base abstract class for creating Scenes.
 * A Scene manages a collection of GameObjects and handles their lifecycle, updates, and rendering.
 */
export abstract class Scene {
    /** 
     * Internal array storing all GameObjects currently active in this scene. 
     */
    protected objects: GameObject[] = []

    /** 
     * Reference to the Engine instance this scene is attached to. 
     * This is automatically set by the Engine when the scene is loaded.
     */
    engine!: Engine

    /**
     * Lifecycle method called immediately when the scene becomes the active scene in the Engine.
     * Override this to initialize GameObjects, resources, or specific scene logic.
     * @example
     * onEnter() {
     *   this.add(new Player());
     * }
     */
    onEnter?(): void

    /**
     * Lifecycle method called right before the scene is replaced by another scene.
     * Override this to clean up resources, save state, or destroy GameObjects if needed.
     */
    onExit?(): void

    /**
     * Adds a GameObject to the scene.
     * If the scene is already attached to an Engine, the GameObject will also receive the Engine reference.
     * @param obj - The GameObject to add to the scene.
     * @example
     * const enemy = new Enemy();
     * this.add(enemy);
     */
    add(obj: GameObject): void {
        if (this.engine) {
            obj.engine = this.engine
        }

        this.objects.push(obj)
    }

    /**
     * Called every frame to update all GameObjects in the scene.
     * @param delta - Time elapsed since the last frame.
     */
    update(delta: number): void {
        for (const obj of this.objects) {
            obj.update(delta)
        }
    }

    /**
     * Called at fixed intervals to update physics and fixed logic for all GameObjects in the scene.
     * @param delta - The fixed time step.
     */
    fixedUpdate(delta: number): void {
        for (const obj of this.objects) {
            obj.fixedUpdate?.(delta)
        }
    }

    /**
     * Retrieves all GameObjects currently in the scene.
     * @returns An array of GameObjects.
     */
    getObjects(): GameObject[] {
        return this.objects
    }
}