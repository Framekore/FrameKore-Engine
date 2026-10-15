import type { Vector2 } from "@framekore/math"

/**
 * Structural contract for any object that describes the 2D spatial state of a
 * GameObject: its world-space position, rotation, and scale.
 *
 * `ITransform2D` is implemented by {@link Transform2D} and can be used as a
 * lightweight type when you only need to read or write spatial data without
 * depending on the concrete class (e.g. in physics or rendering subsystems).
 *
 * @example
 * function applyGravity(transform: ITransform2D, dt: number): void {
 *     transform.position.y += 9.8 * dt;
 * }
 */
export interface ITransform2D {
    /**
     * The world-space position of the GameObject, in pixels.
     * `x` increases to the right; `y` increases **downward** (canvas convention).
     */
    position: Vector2

    /**
     * The rotation of the GameObject, in **radians**.
     * A positive value rotates the object clockwise on the canvas.
     * Use `Math.PI / 2` for 90°, `Math.PI` for 180°, etc.
     */
    rotation: number

    /**
     * The scale multiplier applied to the GameObject's width (`x`) and height
     * (`y`). A value of `(1, 1)` means the original (unscaled) size.
     * Use `(2, 2)` to double the size, or `(-1, 1)` to mirror horizontally.
     */
    scale: Vector2
}