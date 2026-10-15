import { Vector2 } from "@framekore/math";
import { Transform2D } from "@framekore/transform2d";
import { Component } from "./component";
import { GameObject } from "@framekore/core";

/**
 * Bitmask flags representing distinct collision layers.
 *
 * Use these constants to assign a layer to a {@link BoxCollide2D} and to specify which
 * layers it should interact with via the `mask` field. The bitmask design allows a single
 * collider to belong to — or detect — multiple layers simultaneously using bitwise OR.
 *
 * @example
 * // A player collider that lives on Layer1 and can hit Layer2 (enemies)
 * const playerBox = new BoxCollide2D(player, 32, 64, {
 *   layer: CollisionLayer.Layer1,
 *   mask:  CollisionLayer.Layer2,
 * });
 *
 * // A collider on multiple layers (Layer1 | Layer3)
 * const box = new BoxCollide2D(obj, 16, 16, {
 *   layer: CollisionLayer.Layer1 | CollisionLayer.Layer3,
 *   mask:  CollisionLayer.Layer2,
 * });
 */
export const CollisionLayer = {
    /** No layer — the collider will not interact with anything when used alone. */
    NONE: 0,
    /** Layer 1 bitmask (`1 << 0 = 0b00000001`). */
    Layer1: 1 << 0,
    /** Layer 2 bitmask (`1 << 1 = 0b00000010`). */
    Layer2: 1 << 1,
    /** Layer 3 bitmask (`1 << 2 = 0b00000100`). */
    Layer3: 1 << 2,
    /** Layer 4 bitmask (`1 << 3 = 0b00001000`). */
    Layer4: 1 << 3,
    /** Layer 5 bitmask (`1 << 4 = 0b00010000`). */
    Layer5: 1 << 4,
    /** Layer 6 bitmask (`1 << 5 = 0b00100000`). */
    Layer6: 1 << 5,
    /** Layer 7 bitmask (`1 << 6 = 0b01000000`). */
    Layer7: 1 << 6,
    /** Layer 8 bitmask (`1 << 7 = 0b10000000`). */
    Layer8: 1 << 7,
    /** Layer 9 bitmask (`1 << 8`). */
    Layer9: 1 << 8,
} as const

/**
 * A numeric bitmask representing one or more collision layers.
 * Composed from the constants in the {@link CollisionLayer} object using bitwise OR.
 *
 * @example
 * const myLayer: CollisionLayer = CollisionLayer.Layer1 | CollisionLayer.Layer3;
 */
export type CollisionLayer = number

/**
 * Component that defines a 2D rectangular collision shape using an
 * Axis-Aligned Bounding Box (AABB). It is required for a {@link GameObject}
 * to participate in physics interactions managed by {@link Physics2D}.
 *
 * Pair this component with {@link RigidBody2D} to make an object that moves
 * and physically collides. Use it alone (without `RigidBody2D`) for static
 * obstacles like terrain. Set `isTrigger = true` to detect overlaps without
 * pushing objects apart (useful for pick-ups, zones, damage areas).
 *
 * @example
 * // Static platform — no RigidBody2D needed
 * const platform = new GameObject();
 * platform.transform = new Transform2D(platform);
 * platform.collider = new BoxCollide2D(platform, 128, 16, {
 *   layer: CollisionLayer.Layer2,
 *   mask:  CollisionLayer.Layer1,
 * });
 * scene.add(platform);
 *
 * @example
 * // Trigger zone that detects the player
 * const zone = new BoxCollide2D(zoneObj, 64, 64, {
 *   isTrigger: true,
 *   layer: CollisionLayer.Layer3,
 *   mask:  CollisionLayer.Layer1,
 * });
 */
export class BoxCollide2D extends Component {
    /**
     * Width of the collision box in pixels (before Transform scale is applied).
     */
    width: number

    /**
     * Height of the collision box in pixels (before Transform scale is applied).
     */
    height: number

    /**
     * Positional offset applied on top of the owning {@link GameObject}'s
     * `Transform2D.position` when computing {@link getBounds}.
     *
     * Use this to shift the collision box relative to the visual representation
     * without moving the actual Transform (e.g., cropping headroom from a sprite).
     *
     * @default new Vector2(0, 0)  (no offset)
     */
    offset = new Vector2()

    /** @internal Normalized anchor point of the box (0–1 range on each axis). Defaults to (0.5, 0.5) = center. */
    #origin = new Vector2(0.5, 0.5)

    /**
     * When `true`, this collider acts as a **sensor**: it reports overlaps via
     * the {@link colliding} flag but does not physically separate the objects.
     *
     * Useful for pick-up items, damage zones, area triggers, and similar
     * non-solid regions.
     *
     * @default false
     */
    isTrigger: boolean

    /**
     * The bitmask layer this collider belongs to.
     * Other colliders whose {@link mask} includes this layer can interact with it.
     *
     * @see {@link CollisionLayer} for available constants.
     * @default CollisionLayer.NONE (0)
     */
    layer: CollisionLayer

    /**
     * The bitmask of layers this collider will interact with.
     * A collision is only processed when both `(this.mask & other.layer) !== 0`
     * and `(other.mask & this.layer) !== 0`.
     *
     * @see {@link CollisionLayer} for available constants.
     * @default CollisionLayer.NONE (0)
     */
    mask: CollisionLayer

    /**
     * `true` when this collider is currently overlapping with at least one other
     * valid collider during the active physics step.
     *
     * Automatically reset to `false` at the beginning of each {@link Physics2D.step}
     * and set to `true` by {@link Physics2D.resolveCollisionsX} /
     * {@link Physics2D.resolveCollisionsY} when an overlap is detected.
     *
     * Primarily useful for trigger colliders — check this each frame to know
     * whether anything is inside the zone.
     *
     * @example
     * if (coin.collider.colliding) {
     *   collectCoin(coin);
     * }
     *
     * @default false
     */
    colliding: boolean = false

    /**
     * Creates a new `BoxCollide2D` component and attaches it to a {@link GameObject}.
     *
     * @param object  - The {@link GameObject} this collider belongs to.
     * @param width   - Width of the bounding box in pixels.
     * @param height  - Height of the bounding box in pixels.
     * @param options - Optional configuration object.
     * @param options.isTrigger - When `true`, collisions are detected but not resolved. Defaults to `false`.
     * @param options.layer     - The {@link CollisionLayer} bitmask this collider belongs to. Defaults to `0` (NONE).
     * @param options.mask      - The {@link CollisionLayer} bitmask of layers this collider interacts with. Defaults to `0` (NONE).
     *
     * @example
     * // Solid player collider
     * const box = new BoxCollide2D(player, 32, 64, {
     *   layer: CollisionLayer.Layer1,
     *   mask:  CollisionLayer.Layer2,
     * });
     *
     * @example
     * // Trigger-only sensor
     * const sensor = new BoxCollide2D(obj, 48, 48, {
     *   isTrigger: true,
     *   layer: CollisionLayer.Layer3,
     *   mask:  CollisionLayer.Layer1,
     * });
     */
    constructor(object: GameObject, width: number, height: number, options: {
        isTrigger?: boolean
        layer?: CollisionLayer
        mask?: CollisionLayer
    } = {}) {
        super(object)
        this.width = width
        this.height = height
        this.isTrigger = options.isTrigger ?? false
        this.layer = options.layer ?? 0
        this.mask = options.mask ?? 0
    }

    /**
     * Sets the anchor origin of the collision box, controlling which point of the
     * box is aligned to the Transform position.
     *
     * Values are normalized (0–1) fractions of the box dimensions:
     * - `(0, 0)` → top-left corner
     * - `(0.5, 0.5)` → center (**default**)
     * - `(1, 1)` → bottom-right corner
     *
     * @param x - Horizontal origin fraction (0 = left edge, 1 = right edge).
     * @param y - Vertical origin fraction (0 = top edge, 1 = bottom edge).
     *
     * @example
     * // Align the bottom-center of the box with the Transform position
     * box.setOrigin(0.5, 1);
     *
     * @example
     * // Align the top-left corner with the Transform position
     * box.setOrigin(0, 0);
     */
    setOrigin(x: number, y: number): void {
        this.#origin.x = x
        this.#origin.y = y
    }

    /**
     * Computes the world-space Axis-Aligned Bounding Box (AABB) for this collider,
     * taking the owning object's {@link Transform2D} position and scale into account
     * as well as the configured {@link offset} and origin.
     *
     * This is called by {@link Physics2D} each step to test and resolve overlaps.
     *
     * @param transform - The `Transform2D` component of the owning {@link GameObject}.
     * @returns An object with four world-space edge positions (in pixels):
     *   - `left`   — X coordinate of the left edge.
     *   - `right`  — X coordinate of the right edge.
     *   - `top`    — Y coordinate of the top edge.
     *   - `bottom` — Y coordinate of the bottom edge.
     *
     * @example
     * const transform = getComponentByType(obj, Transform2D);
     * const bounds = box.getBounds(transform);
     * console.log(bounds.left, bounds.right, bounds.top, bounds.bottom);
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