import { definePlugin, Engine, getComponentByType, type GameObject, type Scene, type TickerDisposer } from "@framekore/core";
import { Transform2D, type ITransform2D } from "@framekore/transform2d";

import { Camera2D } from "./camera2d";
import { Sprite2D } from "./sprite2D";
import { Texture } from "./texture";
import { Renderable2D } from "./renderable2D";

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
        update(engine, delta) {
            if (!engine.currentScene) return
            const manager = RenderManager2D.get(engine);
            manager.updateCamera(engine.currentScene, delta);
        },
        destroy() {
            renderDisposer?.dispose()
        }
    }
})

/** A draw call queued manually via draw() or drawScreen(). */
type DrawEntry = {
    depth: number
    screen: boolean
    fn: (ctx: CanvasRenderingContext2D) => void
}

/**
 * Manages all 2D rendering operations on the canvas.
 * Handles the drawing queue, camera transformations, and rendering of Sprite2D components.
 * 
 * All renderables and manual draw calls are sorted by **depth** before being drawn each frame:
 * - **Lower depth = drawn first (behind everything)** — use negative values for backgrounds.
 * - **Higher depth = drawn last (in front of everything)** — use positive values for foreground/UI.
 * 
 * This class is automatically instantiated and registered as a resource by the `render2d` plugin.
 */
export class RenderManager2D {
    /** The HTMLCanvasElement being drawn to. */
    canvas: HTMLCanvasElement
    /** The 2D rendering context of the canvas. */
    ctx: CanvasRenderingContext2D
    #drawQueue: DrawEntry[] = []
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

    updateCamera(scene: Scene, delta: number): void {
        const cam = this.#getMainCamera(scene)
        if (!cam) return
        this.#updateCameraInternal(cam.camera, cam.transform, delta)
    }

    #updateCameraInternal(camera: Camera2D, transform: TransformLike, delta: number) {
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

    /**
     * Queues a manual draw call to be executed in world space (affected by camera), sorted by depth.
     * - **Negative depth** = behind sprites (backgrounds, tiles, floors).
     * - **Positive depth** = in front of sprites (shadows, effects, debug).
     * - **Default is `0`** (same layer as sprites with zIndex 0).
     * @param callback - Function receiving the CanvasRenderingContext2D.
     * @param depth - Drawing order. Lower = drawn first (behind). Default: `0`.
     * @example
     * // Background (drawn behind everything)
     * render.draw((ctx) => ctx.fillRect(0, 0, 800, 800), -100);
     *
     * // Foreground effect (drawn in front of sprites)
     * render.draw((ctx) => { ... }, 10);
     */
    draw(callback: (ctx: CanvasRenderingContext2D) => void, depth: number = 0): void {
        this.#drawQueue.push({ depth, screen: false, fn: callback })
    }

    /**
     * Queues a manual draw call in screen space (ignores camera and zoom), sorted by depth.
     * Use this for HUD, UI, debug text, etc.
     * - **Lower depth** = drawn behind other screen elements.
     * - **Higher depth** = drawn in front.
     * @param callback - Function receiving the CanvasRenderingContext2D.
     * @param depth - Drawing order within screen space. Default: `0`.
     * @example
     * render.drawScreen((ctx) => {
     *   ctx.fillText("Score: 100", 10, 20);
     * }, 10);
     */
    drawScreen(callback: (ctx: CanvasRenderingContext2D) => void, depth: number = 0): void {
        this.#drawQueue.push({ depth, screen: true, fn: callback })
    }

    render(scene?: Scene, delta: number = 1 / 60): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if (!scene) return

        const cam = this.#getMainCamera(scene)

        // Collect all Renderable2D objects from the scene
        const renderables: { depth: number, screen: false, fn: (ctx: CanvasRenderingContext2D) => void }[] = []
        for (const obj of scene.getObjects()) {
            if (obj instanceof Renderable2D && obj.visible) {
                const depth = obj.zIndex
                renderables.push({ depth, screen: false, fn: (ctx) => obj.render(ctx) })
            }
        }

        // Merge manual draw calls with renderables and sort all by depth
        const worldEntries: DrawEntry[] = []
        const screenEntries: DrawEntry[] = []

        for (const entry of renderables) {
            worldEntries.push(entry)
        }
        for (const entry of this.#drawQueue) {
            if (entry.screen) {
                screenEntries.push(entry)
            } else {
                worldEntries.push(entry)
            }
        }
        this.#drawQueue.length = 0

        // Sort: lower depth first (drawn behind), higher depth last (drawn in front)
        worldEntries.sort((a, b) => a.depth - b.depth)
        screenEntries.sort((a, b) => a.depth - b.depth)

        // Draw world (camera-affected) entries
        this.ctx.save()
        if (cam) {
            this.#applyCamera(cam.camera, cam.transform)
        }
        for (const entry of worldEntries) {
            entry.fn(this.ctx)
        }
        this.ctx.restore()

        // Draw screen (UI) entries — outside camera transform
        for (const entry of screenEntries) {
            entry.fn(this.ctx)
        }
    }
}