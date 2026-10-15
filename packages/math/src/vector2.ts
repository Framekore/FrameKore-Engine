/**
 * A 2D mathematical vector with `x` and `y` components.
 *
 * `Vector2` is the core math primitive used throughout FrameKore Engine for
 * representing positions, velocities, directions, and scales in 2D space.
 * It provides both **static** utility methods (which return new vectors and
 * leave operands unchanged) and **instance** mutation methods (which modify
 * the vector in place for zero-allocation hot paths).
 *
 * @example
 * // Static usage – compute a direction from player to enemy
 * const dir = Vector2.sub(enemy.transform.position, player.transform.position).normalize();
 *
 * @example
 * // Instance mutation – integrate velocity into position each frame
 * player.transform.position.add(velocity);
 */
export class Vector2 {
    /**
     * The X component of the vector, measured in pixels when used as a position.
     *
     * @example
     * const vec = new Vector2(10, 5);
     * console.log(vec.x); // 10
     */
    x: number

    /**
     * The Y component of the vector, measured in pixels when used as a position.
     * In FrameKore's canvas coordinate system, positive Y points **downward**.
     *
     * @example
     * const vec = new Vector2(10, 5);
     * console.log(vec.y); // 5
     */
    y: number

    /**
     * Creates a new `Vector2` instance.
     *
     * @param x - The X component. Defaults to `0`.
     * @param y - The Y component. Defaults to `0`.
     *
     * @example
     * const position = new Vector2(100, 200);
     * const origin   = new Vector2();          // (0, 0)
     */
    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }

    // -------------------------------------------------------------------------
    // Static methods — return new vectors, operands are not mutated
    // -------------------------------------------------------------------------

    /**
     * Adds two vectors and returns the result as a **new** `Vector2`.
     * Neither operand is mutated.
     *
     * @param v1 - The first vector (addend).
     * @param v2 - The second vector (addend).
     * @returns A new `Vector2` equal to `(v1.x + v2.x, v1.y + v2.y)`.
     *
     * @example
     * const v1     = new Vector2(10, 10);
     * const v2     = new Vector2(5, 5);
     * const result = Vector2.add(v1, v2); // Vector2(15, 15)
     */
    static add(v1: Vector2, v2: Vector2): Vector2 {
        return new Vector2(v1.x + v2.x, v1.y + v2.y)
    }

    /**
     * Subtracts `v2` from `v1` and returns the result as a **new** `Vector2`.
     * Neither operand is mutated. Useful for computing the vector between two
     * world-space positions (e.g. direction from one object to another).
     *
     * @param v1 - The base vector (minuend).
     * @param v2 - The vector to subtract (subtrahend).
     * @returns A new `Vector2` equal to `(v1.x - v2.x, v1.y - v2.y)`.
     *
     * @example
     * const v1     = new Vector2(10, 10);
     * const v2     = new Vector2(5, 5);
     * const result = Vector2.sub(v1, v2); // Vector2(5, 5)
     */
    static sub(v1: Vector2, v2: Vector2): Vector2 {
        return new Vector2(v1.x - v2.x, v1.y - v2.y)
    }

    /**
     * Multiplies a vector by a scalar and returns the result as a **new** `Vector2`.
     * The original vector is not mutated. Commonly used to scale a velocity by
     * `deltaTime` to produce frame-rate-independent movement.
     *
     * @param vector - The vector to scale.
     * @param scalar - The scalar multiplier.
     * @returns A new `Vector2` equal to `(vector.x * scalar, vector.y * scalar)`.
     *
     * @example
     * const v      = new Vector2(10, 5);
     * const result = Vector2.mul(v, 2); // Vector2(20, 10)
     */
    static mul(vector: Vector2, scalar: number): Vector2 {
        return new Vector2(vector.x * scalar, vector.y * scalar)
    }

    /**
     * Divides a vector by a scalar and returns the result as a **new** `Vector2`.
     * The original vector is not mutated.
     *
     * @param vector - The vector to divide.
     * @param scalar - The scalar divisor. Must be non-zero to avoid `Infinity`.
     * @returns A new `Vector2` equal to `(vector.x / scalar, vector.y / scalar)`.
     *
     * @example
     * const v      = new Vector2(10, 6);
     * const result = Vector2.div(v, 2); // Vector2(5, 3)
     */
    static div(vector: Vector2, scalar: number): Vector2 {
        return new Vector2(vector.x / scalar, vector.y / scalar)
    }

    /**
     * Computes the **dot product** of two vectors.
     *
     * The dot product equals `|v1| * |v2| * cos(θ)`, where `θ` is the angle
     * between the vectors. It is useful for:
     * - Checking perpendicularity (result is `0`).
     * - Checking whether two vectors point in the same general direction (result > 0).
     * - Projecting one vector onto another.
     *
     * Formula: `(v1.x * v2.x) + (v1.y * v2.y)`
     *
     * @param v1 - The first vector.
     * @param v2 - The second vector.
     * @returns The scalar dot product.
     *
     * @example
     * const right = new Vector2(1, 0);
     * const up    = new Vector2(0, 1);
     * const dot   = Vector2.dot(right, up); // 0 — perpendicular
     */
    static dot(v1: Vector2, v2: Vector2): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /**
     * Computes the Euclidean distance between two points represented as vectors.
     *
     * Uses the Pythagorean theorem: `√((v1.x - v2.x)² + (v1.y - v2.y)²)`.
     * For distance *comparisons* prefer squared magnitude to avoid the
     * expensive square-root operation.
     *
     * @param v1 - The first point (pixels).
     * @param v2 - The second point (pixels).
     * @returns The Euclidean distance between `v1` and `v2`, in pixels.
     *
     * @example
     * const a    = new Vector2(0, 0);
     * const b    = new Vector2(3, 4);
     * const dist = Vector2.distanceTo(a, b); // 5
     */
    static distanceTo(v1: Vector2, v2: Vector2): number {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Performs a **Linear Interpolation** (Lerp) between two vectors and returns
     * the result as a **new** `Vector2`. Neither operand is mutated.
     *
     * At `alpha = 0` the result equals `v1`; at `alpha = 1` the result equals
     * `v2`. Values outside `[0, 1]` will extrapolate beyond the endpoints.
     *
     * @param v1    - The starting vector.
     * @param v2    - The ending (target) vector.
     * @param alpha - Interpolation factor in the range `[0, 1]`.
     * @returns A new interpolated `Vector2`.
     *
     * @example
     * const start = new Vector2(0, 0);
     * const end   = new Vector2(10, 10);
     * const mid   = Vector2.lerp(start, end, 0.5); // Vector2(5, 5)
     */
    static lerp(v1: Vector2, v2: Vector2, alpha: number): Vector2 {
        return new Vector2(
            v1.x + (v2.x - v1.x) * alpha,
            v1.y + (v2.y - v1.y) * alpha
        );
    }

    // -------------------------------------------------------------------------
    // Instance methods — mutate this vector in place (zero allocation)
    // -------------------------------------------------------------------------

    /**
     * Adds another vector to **this** vector in place.
     * Mutates `this`; no new object is created.
     *
     * @param v - The vector to add.
     *
     * @example
     * const pos = new Vector2(10, 10);
     * pos.add(new Vector2(5, 5)); // pos is now (15, 15)
     */
    add(v: Vector2): void {
        this.x += v.x
        this.y += v.y
    }

    /**
     * Subtracts another vector from **this** vector in place.
     * Mutates `this`; no new object is created.
     *
     * @param v - The vector to subtract.
     *
     * @example
     * const pos = new Vector2(10, 10);
     * pos.sub(new Vector2(2, 3)); // pos is now (8, 7)
     */
    sub(v: Vector2): void {
        this.x -= v.x
        this.y -= v.y
    }

    /**
     * Multiplies **this** vector by a scalar in place.
     * Mutates `this`; no new object is created.
     *
     * @param scalar - The scalar multiplier.
     *
     * @example
     * const v = new Vector2(5, 5);
     * v.mul(2); // v is now (10, 10)
     */
    mul(scalar: number): void {
        this.x *= scalar
        this.y *= scalar
    }

    /**
     * Divides **this** vector by a scalar in place.
     * Mutates `this`; no new object is created.
     *
     * @param scalar - The scalar divisor. Must be non-zero to avoid `Infinity`.
     *
     * @example
     * const v = new Vector2(10, 10);
     * v.div(2); // v is now (5, 5)
     */
    div(scalar: number): void {
        this.x /= scalar
        this.y /= scalar
    }

    /**
     * Computes the **dot product** of **this** vector and another.
     *
     * Formula: `(this.x * v.x) + (this.y * v.y)`
     *
     * @param v - The other vector.
     * @returns The scalar dot product.
     *
     * @example
     * const right = new Vector2(1, 0);
     * const dot   = right.dot(new Vector2(0, 1)); // 0 — perpendicular
     */
    dot(v: Vector2): number {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * Computes the Euclidean distance from **this** vector to another.
     *
     * @param v - The target vector (pixels).
     * @returns The Euclidean distance in pixels.
     *
     * @example
     * const origin = new Vector2(0, 0);
     * const dist   = origin.distanceTo(new Vector2(3, 4)); // 5
     */
    distanceTo(v: Vector2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Returns the **squared** magnitude (length²) of **this** vector.
     *
     * Computing the squared magnitude avoids an expensive `Math.sqrt` call and
     * is therefore preferred for distance-comparison operations (e.g. "is the
     * enemy within 100 px?").
     *
     * @returns The squared magnitude: `x² + y²`.
     *
     * @example
     * const v     = new Vector2(3, 4);
     * const magSq = v.magnitudeSq(); // 25  (faster than magnitude() which gives 5)
     */
    magnitudeSq(): number {
        return this.x * this.x + this.y * this.y
    }

    /**
     * Returns the magnitude (Euclidean length) of **this** vector.
     *
     * Implements the Pythagorean theorem: `√(x² + y²)`.
     * When only comparing lengths, prefer {@link magnitudeSq} to avoid the
     * square-root overhead.
     *
     * @returns The magnitude of the vector, in pixels when used as a position or velocity.
     *
     * @example
     * const v   = new Vector2(3, 4);
     * const mag = v.magnitude(); // 5
     */
    magnitude(): number {
        return Math.sqrt(this.magnitudeSq());
    }

    /**
     * Returns a **new** `Vector2` that has the same direction as `this` but a
     * magnitude of `1` (unit vector).
     *
     * If `this` is the zero vector `(0, 0)`, a zero vector is returned to avoid
     * division by zero.
     *
     * @returns A new normalized `Vector2`.
     *
     * @example
     * const velocity  = new Vector2(10, 0);
     * const direction = velocity.normalize(); // Vector2(1, 0)
     */
    normalize(): Vector2 {
        const mag = this.magnitude()

        if (mag === 0) {
            return new Vector2(0, 0)
        }

        return new Vector2(
            this.x / mag,
            this.y / mag
        )
    }

    /**
     * Creates a **deep copy** of **this** vector.
     * The returned vector is independent — mutations to the clone do not affect
     * the original, and vice-versa.
     *
     * @returns A new `Vector2` with the same `x` and `y` values.
     *
     * @example
     * const original = new Vector2(5, 5);
     * const copy     = original.clone();
     * copy.x = 99;
     * console.log(original.x); // 5 — unaffected
     */
    clone(): Vector2 {
        return new Vector2(this.x, this.y)
    }

    /**
     * Performs a **Linear Interpolation** (Lerp) toward a target vector **in
     * place**, mutating `this`. Returns `this` to allow method chaining.
     *
     * Useful inside the game-loop update to smoothly move an object toward a
     * destination without allocating a new vector every frame.
     *
     * At `alpha = 0` the vector is unchanged; at `alpha = 1` it equals `target`.
     *
     * @param target - The destination vector to interpolate toward.
     * @param alpha  - Interpolation factor in the range `[0, 1]`.
     * @returns `this`, after mutation, for chaining.
     *
     * @example
     * // Smoothly follow the mouse each frame (called inside update)
     * camera.position.lerp(mouse.worldPosition, 0.1);
     */
    lerp(target: Vector2, alpha: number): this {
        this.x += (target.x - this.x) * alpha
        this.y += (target.y - this.y) * alpha
        return this
    }
}