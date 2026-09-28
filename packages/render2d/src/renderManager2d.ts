import { type Component, definePlugin, Engine, type GameObject, type Scene, type TickerDisposer } from "@framekore/core";
import { type ITransform2D, TRANSFORM_2D } from "@framekore/transform2d";

import { Camera2D } from "./camera2d";
import { Sprite2D, SPRITE_2D } from "./sprite2D";
import { Texture } from "./texture";

type TransformLike = Component & ITransform2D

const sprites = new WeakMap<Engine, Set<Sprite2D>>()

/**
 * Creates a Render2D plugin for the Engine.
 * Must be initialized with a target HTMLCanvasElement.
 * @param canvas - The HTMLCanvasElement where the engine will draw.
 * @returns An EnginePlugin definition to be passed to `engine.use()`.
 * @example
 * const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
 * engine.use(render2d(canvas));
 */
export const render2d = definePlugin((canvas: HTMLCanvasElement) => {
    let renderDisposer: TickerDisposer | undefined
    return {
        name: "render2d",
        setup(engine) {
            sprites.set(engine, new Set())
            const manager = new RenderManager2D(canvas)
            engine.setResource(RenderManager2D, manager)
        },
        onComponentAdded(component) {
            const gameObject = component.gameObject
            if (!gameObject || !gameObject.engine) return

            if (component instanceof Sprite2D) {
                sprites.get(gameObject.engine)?.add(component)
            }
        },
        onComponentRemoved(component) {
            const gameObject = component.gameObject
            if (!gameObject || !gameObject.engine) return

            if (component instanceof Sprite2D) {
                sprites.get(gameObject.engine)?.delete(component)
            }
        },
        render(scene, delta) {
            const manager = RenderManager2D.getFromScene(scene);
            manager.render(scene, delta);

        },
        destroy() {
            renderDisposer?.dispose()
        }
    }
})




/**
 * Manages all 2D rendering operations on the canvas.
 * Handles the drawing queue, camera transformations, and rendering of Sprite2D components.
 * This class is automatically instantiated and registered as a resource by the `render2d` plugin.
 */
export class RenderManager2D {
    /** The HTMLCanvasElement being drawn to. */
    canvas: HTMLCanvasElement
    /** The 2D rendering context of the canvas. */
    ctx: CanvasRenderingContext2D
    #drawQueue: Array<(ctx: CanvasRenderingContext2D) => void> = []
    #screenDrawQueue: Array<(ctx: CanvasRenderingContext2D) => void> = []
    #antialiasing: boolean = false

    /**
     * @internal Created automatically by the plugin.
     * @param canvas The target canvas element.
     */
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) {
            throw new Error("Canvas2d context not available.")
        }
        this.ctx = ctx
        ctx.imageSmoothingEnabled = this.antialiasing
    }

    /** 
     * Enables or disables antialiasing (image smoothing). 
     * Set to false for pixel art games.
     */
    set antialiasing(value: boolean) {
        this.#antialiasing = value
        this.ctx.imageSmoothingEnabled = value
    }

    /** Gets the current antialiasing state. */
    get antialiasing(): boolean {
        return this.#antialiasing;
    }

    /**
     * Retrieves the active RenderManager2D instance from an Engine.
     * @param engine - The Engine instance.
     * @returns The RenderManager2D instance.
     * @throws If the render manager is not registered in the engine.
     */
    static get(engine: Engine): RenderManager2D {
        const render = engine.getResource(RenderManager2D)
        if (!render)
            throw new Error("RenderManager2D has not been added to the Engine.")
        return render
    }

    /**
     * Creates a new Texture from a specific region of the current canvas.
     * Useful for capturing screenshots or dynamic textures.
     * @param x - Start X coordinate.
     * @param y - Start Y coordinate.
     * @param w - Width of the region.
     * @param h - Height of the region.
     * @returns A new Texture object.
     */
    getCanvasImage(x: number, y: number, w: number, h: number): Texture {
        const newCanvas = document.createElement('canvas')
        newCanvas.width = w
        newCanvas.height = h

        const newCtx = newCanvas.getContext('2d')!
        newCtx.drawImage(this.canvas, x, y, w, h, 0, 0, w, h)

        return new Texture(newCanvas)
    }

    /**
     * Retrieves the active RenderManager2D from a Scene's engine.
     * @param scene - The Scene instance.
     * @returns The RenderManager2D instance.
     */
    static getFromScene(scene: Scene): RenderManager2D {
        return this.get(scene.engine);
    }

    #getMainCamera(scene: Scene): {
        camera: Camera2D,
        transform: TransformLike
    } | null {
        for (const obj of scene.getObjects()) {
            const camera = obj.getComponent(Camera2D)
            if (!camera || !camera.isMain) continue

            const transform = obj.getComponent<TransformLike>(TRANSFORM_2D)
            if (!transform) continue

            return { camera, transform }
        }

        return null
    }

    #applyCamera(camera: Camera2D, transform: TransformLike) {
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2)
        this.ctx.scale(camera.zoom, camera.zoom)
        this.ctx.rotate(-camera.rotation)
        this.ctx.translate(-transform.position.x, -transform.position.y)
    }

    #updateCamera(camera: Camera2D, transform: TransformLike, delta: number) {
        if (!camera.target)
            return
        const targetTransform = camera.target.getComponent<TransformLike>(TRANSFORM_2D)
        if (!targetTransform)
            return
        const targetX = targetTransform.position.x + camera.offset.x
        const targetY = targetTransform.position.y + camera.offset.y

        const t = Math.min(1, camera.followSpeed * delta)

        let desiredX = transform.position.x
        let desiredY = transform.position.y

        const zoomDiff = camera.targetZoom - camera.zoom
        camera.zoom += zoomDiff * Math.min(1, camera.zoomSpeed * delta)
        camera.zoom = this.#clamp(camera.zoom, camera.minZoom, camera.maxZoom)

        if (camera.deadZoneWidth > 0) {
            const halfDeadZoneW = camera.deadZoneWidth / 2
            const left = transform.position.x - halfDeadZoneW
            const right = transform.position.x + halfDeadZoneW

            if (targetX < left) desiredX = targetX + halfDeadZoneW
            else if (targetX > right) desiredX = targetX - halfDeadZoneW
        } else {
            desiredX = targetX
        }

        if (camera.deadZoneHeight > 0) {
            const halfDeadZoneH = camera.deadZoneHeight / 2
            const top = transform.position.y - halfDeadZoneH
            const bottom = transform.position.y + halfDeadZoneH

            if (targetY < top) desiredY = targetY + halfDeadZoneH
            else if (targetY > bottom) desiredY = targetY - halfDeadZoneH
        } else {
            desiredY = targetY
        }

        if (camera.followX) {
            transform.position.x = this.#moveTowards(transform.position.x, desiredX, t)
        }

        if (camera.followY) {
            transform.position.y = this.#moveTowards(transform.position.y, desiredY, t)
        }

        this.#clampCameraToBounds(camera, transform)
    }

    #moveTowards(current: number, target: number, t: number) {
        return current + (target - current) * t
    }

    #clamp(value: number, min: number, max: number) {
        return Math.max(min, Math.min(max, value))
    }

    #clampCameraToBounds(camera: Camera2D, transform: TransformLike) {
        if (!camera.worldBounds)
            return

        const bounds = camera.worldBounds

        const halfWidth = this.canvas.width / 2 / camera.zoom
        const halfHeight = this.canvas.height / 2 / camera.zoom

        const minX = bounds.x + halfWidth
        const maxX = bounds.x + bounds.width - halfWidth
        const minY = bounds.y + halfHeight
        const maxY = bounds.y + bounds.height - halfHeight

        if (minX > maxX) {
            transform.position.x = bounds.x + bounds.width / 2
        } else {
            transform.position.x = this.#clamp(transform.position.x, minX, maxX)
        }

        if (minY > maxY) {
            transform.position.y = bounds.y + bounds.height / 2
        } else {
            transform.position.y = this.#clamp(transform.position.y, minY, maxY)
        }
    }

    /**
     * Helper to create a new Texture from an image or canvas.
     * @param image - The source element.
     * @returns A new Texture instance.
     */
    createTexture(image: HTMLImageElement | HTMLCanvasElement): Texture {
        return new Texture(image)
    }

    /**
     * Enqueues a custom drawing operation to be executed in the world space (affected by camera).
     * @param callback - A function that receives the 2D context to perform custom drawing.
     * @example
     * renderManager.draw((ctx) => {
     *   ctx.fillStyle = "red";
     *   ctx.fillRect(0, 0, 100, 100);
     * });
     */
    draw(callback: (ctx: CanvasRenderingContext2D) => void): void {
        this.#drawQueue.push(callback)
    }

    /**
     * Enqueues a custom drawing operation to be executed in screen space (unaffected by camera, e.g., UI).
     * @param callback - A function that receives the 2D context.
     * @example
     * renderManager.drawScreen((ctx) => {
     *   ctx.fillText("Score: 100", 10, 20);
     * });
     */
    drawScreen(callback: (ctx: CanvasRenderingContext2D) => void): void {
        this.#screenDrawQueue.push(callback)
    }

    #flushDrawQueue() {
        for (const draw of this.#drawQueue) {
            draw(this.ctx)
        }
        this.#drawQueue.length = 0
    }

    #flushScreenDrawQueue() {
        for (const draw of this.#screenDrawQueue) {
            draw(this.ctx)
        }
        this.#screenDrawQueue.length = 0
    }

    // #renderSprite(transform: ITransform2D, sprite: Sprite2D) {
    //     const f = sprite.frame!

    //     this.ctx.save()

    //     this.ctx.translate(transform.position.x, transform.position.y)
    //     this.ctx.rotate(transform.rotation)
    //     this.ctx.scale(transform.scale.x, transform.scale.y)

    //     this.ctx.drawImage(
    //         sprite.texture.image,
    //         f.x, f.y, f.width, f.height,
    //         -f.width / 2, -f.height / 2, f.width, f.height
    //     )
    //     this.ctx.restore()
    // }

    #renderSprite(transform: ITransform2D, sprite: Sprite2D) {
        const f = sprite.frame!;

        this.ctx.save();

        sprite.render(this.ctx)

        this.ctx.restore();
    }

    #renderObjects(obj: GameObject) {
        
        const transform = obj.getComponent<TransformLike>(TRANSFORM_2D)
        const sprite = obj.getComponent<Sprite2D>(SPRITE_2D)

        if (!transform || !sprite || !sprite.frame) return

        this.#renderSprite(transform, sprite)
    }

    /**
     * @internal Called automatically by the engine to render the scene.
     * @param scene - The current scene.
     * @param delta - Time delta.
     */
    render(scene?: Scene, delta: number = 1 / 60): void {
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if (!scene) return

        const cam = this.#getMainCamera(scene)

        this.ctx.save()

        if (cam) {
            this.#updateCamera(cam.camera, cam.transform, delta)
            this.#applyCamera(cam.camera, cam.transform)
        }

        const objects = scene.getObjects()

        for (const obj of objects) {
            this.#renderObjects(obj)
        }

        this.#flushDrawQueue()

        this.ctx.restore()

        this.#flushScreenDrawQueue()
    }
}
