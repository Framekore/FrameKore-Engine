import { Vector2 } from '@framekore/math'
import { GameObject, Component } from '@framekore/core'

export const CAMERA_2D = Symbol("camera2d")

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
export class Camera2D extends Component {
    /** 
     * Unique symbol key identifying this component. 
     */
    static key = CAMERA_2D

    #zoom: number = 1
    /** 
     * The desired zoom level the camera will interpolate towards over time.
     */
    targetZoom = 1
    /** 
     * The speed at which the camera interpolates towards `targetZoom`. 0 means instant.
     */
    zoomSpeed = 0
    /** Minimum allowed zoom level. */
    minZoom = 0.25
    /** Maximum allowed zoom level. */
    maxZoom = 4
    /** Camera rotation in radians. */
    rotation: number = 0
    /** 
     * Indicates if this is the primary camera. 
     * The RenderManager2D will automatically look for the first Main Camera.
     */
    isMain: boolean = true
    /** 
     * An optional target GameObject for the camera to follow automatically. 
     * The target must have a Transform2D component.
     */
    target?: GameObject
    /** Speed at which the camera follows its target. */
    followSpeed = 6
    /** Whether the camera should follow the target on the X axis. */
    followX = true
    /** Whether the camera should follow the target on the Y axis. */
    followY = true

    /** Offset position applied relative to the target's position. */
    offset = new Vector2(0, 0)
    /** 
     * Width of the deadzone where the target can move without moving the camera. 
     */
    deadZoneWidth = 0
    /** 
     * Height of the deadzone where the target can move without moving the camera. 
     */
    deadZoneHeight = 0

    /** 
     * Hard boundaries restricting the camera's movement in world space.
     * The camera will not render anything outside this rectangle.
     */
    worldBounds?: {
        x: number
        y: number
        width: number
        height: number
    }

    constructor(options: Camera2DOptions = {}) {
        super()
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