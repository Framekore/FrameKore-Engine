import { Vector2 } from "@framekore/math"
import { Component } from "./component"

/**
 * Component that adds physical behavior to a {@link GameObject}, making it respond to
 * gravity and forces. Attach this component alongside a {@link BoxCollide2D} so the
 * {@link Physics2D} manager can move the object, detect overlaps, and resolve collisions
 * each fixed-update step.
 *
 * Only one `RigidBody2D` should be attached per GameObject.
 *
 * @example
 * // Attach a RigidBody2D to a player GameObject
 * const player = new GameObject();
 * player.transform = new Transform2D(player);
 * player.body = new RigidBody2D(player);
 * player.collider = new BoxCollide2D(player, 32, 64, {
 *   layer: CollisionLayer.Layer1,
 *   mask:  CollisionLayer.Layer2,
 * });
 * scene.add(player);
 */
export class RigidBody2D extends Component {
    /**
     * The current velocity of the rigid body in world-space pixels per second.
     * Modify this directly for instant speed changes, or use {@link applyForce} for
     * mass-aware impulses.
     *
     * @default new Vector2(0, 0)
     */
    velocity = new Vector2()

    /**
     * The mass of the rigid body (arbitrary units).
     * A higher mass requires greater force to achieve the same acceleration.
     * Used as the divisor in {@link applyForce}: `velocity += force / mass`.
     *
     * @default 1
     */
    mass = 1

    /**
     * When `true`, the global {@link Physics2D.gravity} vector is applied to
     * {@link velocity} every fixed-update step. Set to `false` for floating
     * objects (e.g., flying enemies, UI physics elements) that should not fall.
     *
     * @default true
     */
    useGravity = true

    /**
     * Tracks which sides of the collider are in contact with a solid surface during
     * the **current** physics step. Automatically reset to `false` at the start of each
     * {@link Physics2D.step} call and updated by the collision-resolution routines.
     *
     * Use `touching.bottom` to determine whether a character is grounded:
     * @example
     * if (rb.touching.bottom && input.isJustDown("Space")) {
     *   rb.applyForce(0, -800); // Jump
     * }
     */
    touching = {
        /** `true` when the top edge is pressing against a solid collider this frame. */
        top: false,
        /** `true` when the bottom edge is resting on a solid collider this frame (grounded). */
        bottom: false,
        /** `true` when the left edge is pressing against a solid collider this frame. */
        left: false,
        /** `true` when the right edge is pressing against a solid collider this frame. */
        right: false
    }

    /**
     * Applies an instantaneous impulse to the rigid body by adding a scaled force
     * vector to the current {@link velocity}.
     *
     * Formula: `velocity += force / mass`
     *
     * @param x - The horizontal component of the force (pixels/s² × mass units).
     * @param y - The vertical component of the force. Negative values push upward
     *            (world-space Y increases downward).
     *
     * @example
     * const rb = getComponentByType(player, RigidBody2D);
     *
     * // Make the player jump with an upward impulse
     * if (rb.touching.bottom) {
     *   rb.applyForce(0, -600);
     * }
     *
     * // Knock the player to the right
     * rb.applyForce(300, 0);
     */
    applyForce(x: number, y: number): void {
        this.velocity.x += x / this.mass
        this.velocity.y += y / this.mass
    }
}