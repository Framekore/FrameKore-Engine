import { Vector2 } from "@framekore/math";
import { Component } from "@framekore/core";
import { Transform2D } from "@framekore/transform2d";

export const BOX_COLLIDE_2D = Symbol("boxCollide2d");

/**
 * Bitmask flags representing distinct collision layers.
 * Used to define what layer an object belongs to (`layer`) and what layers it can collide with (`mask`).
 */
export const CollisionLayer = {
    NONE: 0,
    Layer1: 1 << 0,
    Layer2: 1 << 1,
    Layer3: 1 << 2,
    Layer4: 1 << 3,
    Layer5: 1 << 4,
    Layer6: 1 << 5,
    Layer7: 1 << 6,
    Layer8: 1 << 7,
    Layer9: 1 << 8,
} as const

/** Type representing a collision layer bitmask. */
export type CollisionLayer = number

/**
 * Component that defines a 2D rectangular collision shape (AABB - Axis-Aligned Bounding Box).
 * It's required for objects to interact physically or trigger collision events.
 */
export class BoxCollide2D extends Component {
    /** 
     * Unique symbol key identifying this component. 
     */
    static key = BOX_COLLIDE_2D

    /** Width of the collision box. */
    width: number
    /** Height of the collision box. */
    height: number
    /** Positional offset relative to the GameObject's Transform position. */
    offset = new Vector2()
    #origin = new Vector2(0.5, 0.5)

    /** 
     * If true, this collider will not resolve physical collisions (it won't push objects). 
     * It will only report that a collision happened (useful for sensors/zones). 
     */
    isTrigger: boolean
    /** The collision layer this object belongs to. */
    layer: CollisionLayer
    /** The collision layers this object can interact with. */
    mask: CollisionLayer
    /** 
     * Boolean flag that is true if the collider is currently overlapping with another valid collider. 
     * Automatically reset and updated by the PhysicsManager2D.
     */
    colliding: boolean = false

    /**
     * Creates a new BoxCollide2D component.
     * @param width - The width of the bounding box.
     * @param height - The height of the bounding box.
     * @param options - Optional configuration for triggers and layers.
     * @example
     * // Creates a solid collider for the player on Layer1, colliding with Layer2
     * const box = new BoxCollide2D(32, 64, {
     *   layer: CollisionLayer.Layer1,
     *   mask: CollisionLayer.Layer2
     * });
     */
    constructor(width: number, height: number, options: {
        isTrigger?: boolean
        layer?: CollisionLayer
        mask?: CollisionLayer
    } = {}) {
        super()
        this.width = width
        this.height = height
        this.isTrigger = options.isTrigger ?? false
        this.layer = options.layer ?? 0
        this.mask = options.mask ?? 0
    }

    /**
     * Sets the anchor origin of the collision box relative to its dimensions.
     * @param x - X origin (0 = left, 0.5 = center, 1 = right).
     * @param y - Y origin (0 = top, 0.5 = center, 1 = bottom).
     * @example box.setOrigin(0, 0); // Sets origin to top-left
     */
    setOrigin(x: number, y: number): void {
        this.#origin.x = x
        this.#origin.y = y
    }

    /**
     * Calculates and returns the Axis-Aligned Bounding Box (AABB) limits in world space.
     * Takes the GameObject's Transform position and scale into account.
     * @param transform - The Transform2D component of the GameObject.
     * @returns An object containing the left, right, top, and bottom limits.
     */
    getBounds(transform: Transform2D): { left: number; right: number; top: number; bottom: number; } {
        const scaledWidth = this.width * transform.scale.x
        const scaledHeight = this.height * transform.scale.y

        const offsetX = scaledWidth * this.#origin.x
        const offsetY = scaledHeight * this.#origin.y

        const x = transform.position.x + this.offset.x
        const y = transform.position.y + this.offset.y

        return {
            left: x - offsetX,
            right: x + (scaledWidth - offsetX),
            top: y - offsetY,
            bottom: y + (scaledHeight - offsetY),
        }
    }
}