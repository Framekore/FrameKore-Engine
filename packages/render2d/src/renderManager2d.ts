import { definePlugin, Engine, getComponentByType, type GameObject, type Scene, type TickerDisposer } from "@framekore/core";
import { Transform2D, type ITransform2D } from "@framekore/transform2d";

import { Camera2D } from "./camera2d";
import { Sprite2D } from "./sprite2D";
import { Texture } from "./texture";
import { Renderable2D } from "./renderable2D";
// import { hasCamera2D, hasSprite2D } from ".";

type TransformLike = ITransform2D

const sprites = new WeakMap<Engine, Set<Sprite2D>>()

export const render2d = definePlugin((canvas: HTMLCanvasElement) => {
    let renderDisposer: TickerDisposer | undefined
    return {
        name: "render2d",
        setup(engine) {
            sprites.set(engine, new Set())
            const manager = new RenderManager2D(canvas)
            engine.setResource(RenderManager2D, manager)
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

    set antialiasing(value: boolean) {
        this.#antialiasing = value
        this.ctx.imageSmoothingEnabled = value
    }

    get antialiasing(): boolean {
        return this.#antialiasing;
    }
    static get(engine: Engine): RenderManager2D {
        const render = engine.getResource(RenderManager2D)
        if (!render)
            throw new Error("RenderManager2D has not been added to the Engine.")
        return render
    }

    getCanvasImage(x: number, y: number, w: number, h: number): Texture {
        const newCanvas = document.createElement('canvas')
        newCanvas.width = w
        newCanvas.height = h

        const newCtx = newCanvas.getContext('2d')!
        newCtx.drawImage(this.canvas, x, y, w, h, 0, 0, w, h)

        return new Texture(newCanvas)
    }

    static getFromScene(scene: Scene): RenderManager2D {
        return this.get(scene.engine);
    }

    #getMainCamera(scene: Scene): {
        camera: Camera2D,
        transform: TransformLike
    } | null {
        for (const obj of scene.getObjects()) {
            // const camera = hasCamera2D(obj) ? obj.camera : null
            const camera = obj instanceof Camera2D ? obj : null
            if (!camera || !camera.isMain) continue

            const transform = getComponentByType(camera, Transform2D)
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
        const targetTransform = getComponentByType(camera.target, Transform2D)
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

    createTexture(image: HTMLImageElement | HTMLCanvasElement): Texture {
        return new Texture(image)
    }

    draw(callback: (ctx: CanvasRenderingContext2D) => void): void {
        this.#drawQueue.push(callback)
    }

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
    //     const f = sprite.frame!;

    //     this.ctx.save();

    //     sprite.render(this.ctx)

    //     this.ctx.restore();
    // }

    #renderObjects(obj: GameObject) {
        // OLD: depended on hasSprite2D to detect renderables
        // const transform = hasTransform2D(obj) ? obj.transform2d : null
        // const sprite = hasSprite2D(obj) ? obj.sprite : null
        // if (!transform || !sprite || !sprite.frame) return
        // this.#renderSprite(transform, sprite)

        // NEW: qualquer Renderable2D na cena é renderizado automaticamente
        if (obj instanceof Renderable2D) {
            obj.render(this.ctx)
        }
    }

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