import { Vector2 } from '@framekore/math'
import { Engine, GameObject } from '@framekore/core'

interface WorldBounds {
    x: number
    y: number
    width: number
    height: number
}

interface Camera2DOptions {
    targetZoom?: number
    zoomSpeed?: number
    minZoom?: number
    maxZoom?: number
    rotation?: number
    isMain?: boolean
    target?: GameObject
    followSpeed?: number
    followX?: boolean
    followY?: boolean
    offset?: Vector2
    deadZoneWidth?: number
    deadZoneHeight?: number
    worldBounds?: WorldBounds
}

/**
 * Component that defines a 2D Camera.
 * Placed on a GameObject (which must also have a Transform2D), it dictates what portion of the world is rendered.
 */
export class Camera2D extends GameObject{

    #zoom: number = 1
    targetZoom = 1
    zoomSpeed = 0
    minZoom = 0.25
    maxZoom = 4
    rotation: number = 0
    isMain: boolean = true
    
    target?: GameObject
    followSpeed = 6
    followX = true
    followY = true

    offset = new Vector2(0, 0)
    deadZoneWidth = 0
    deadZoneHeight = 0

    worldBounds?: {
        x: number
        y: number
        width: number
        height: number
    }

    constructor(engine: Engine, options: Camera2DOptions = {}) {
        super(engine)
        this.targetZoom = options.targetZoom ?? 1
        this.zoomSpeed = options.zoomSpeed ?? 0
        this.minZoom = options.minZoom ?? 0.25
        this.maxZoom = options.maxZoom ?? 4
        this.rotation = options.rotation ?? 0
        this.isMain = options.isMain ?? true
        this.target = options.target
        this.followSpeed = options.followSpeed ?? 6
        this.followX = options.followX ?? true
        this.followY = options.followY ?? true
        this.offset = options.offset ?? new Vector2(0, 0)
        this.deadZoneWidth = options.deadZoneWidth ?? 0
        this.deadZoneHeight = options.deadZoneHeight ?? 0
        this.worldBounds = options.worldBounds
    }
    
    /** Sets the current zoom level, constrained by minZoom and maxZoom. */
    set zoom(value: number) {
        if (value < this.minZoom || value > this.maxZoom)
            return
        this.#zoom = value
    }

    /** Gets the current zoom level. */
    get zoom(): number {
        return this.#zoom
    }
}