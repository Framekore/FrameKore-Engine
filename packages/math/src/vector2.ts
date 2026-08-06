export class Vector2 {
    /**
     * The X coordinate of the vector.
     * @example const vec = new Vector2(10, 5); console.log(vec.x); // 10
     */
    x: number

    /**
     * The Y coordinate of the vector.
     * @example const vec = new Vector2(10, 5); console.log(vec.y); // 5
     */
    y: number

    /**
     * Creates a new 2D Vector.
     * @param x - The X coordinate (default is 0).
     * @param y - The Y coordinate (default is 0).
     * @example
     * const position = new Vector2(100, 200);
     */
    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }

    /**
     * Adds two vectors and returns a new vector.
     * @param v1 - The first vector.
     * @param v2 - The second vector.
     * @returns A new Vector2 representing the sum of v1 and v2.
     * @example
     * const v1 = new Vector2(10, 10);
     * const v2 = new Vector2(5, 5);
     * const result = Vector2.add(v1, v2); // Vector2(15, 15)
     */
    static add(v1: Vector2, v2: Vector2): Vector2 {
        return new Vector2(v1.x + v2.x, v1.y + v2.y)
    }

    /**
     * Subtracts the second vector from the first and returns a new vector.
     * @param v1 - The base vector.
     * @param v2 - The vector to subtract.
     * @returns A new Vector2 representing the difference.
     * @example
     * const v1 = new Vector2(10, 10);
     * const v2 = new Vector2(5, 5);
     * const result = Vector2.sub(v1, v2); // Vector2(5, 5)
     */
    static sub(v1: Vector2, v2: Vector2): Vector2 {
        return new Vector2(v1.x - v2.x, v1.y - v2.y)
    }

    /**
     * Multiplies a vector by a scalar and returns a new vector.
     * @param vector - The vector to multiply.
     * @param scalar - The scalar value to multiply by.
     * @returns A new Vector2 representing the product.
     * @example
     * const v = new Vector2(10, 5);
     * const result = Vector2.mul(v, 2); // Vector2(20, 10)
     */
    static mul(vector: Vector2, scalar: number): Vector2 {
        return new Vector2(vector.x * scalar, vector.y * scalar)
    }

    /**
     * Divides a vector by a scalar and returns a new vector.
     * @param vector - The vector to divide.
     * @param scalar - The scalar value to divide by.
     * @returns A new Vector2 representing the quotient.
     * @example
     * const v = new Vector2(10, 6);
     * const result = Vector2.div(v, 2); // Vector2(5, 3)
     */
    static div(vector: Vector2, scalar: number): Vector2 {
        return new Vector2(vector.x / scalar, vector.y / scalar)
    }

    /**
     * Calculates the dot product between two vectors.
     * Mathematically: (x1 * x2) + (y1 * y2)
     * @param v1 - The first vector.
     * @param v2 - The second vector.
     * @returns The scalar dot product.
     * @example
     * const v1 = new Vector2(1, 0);
     * const v2 = new Vector2(0, 1);
     * const dot = Vector2.dot(v1, v2); // 0 (they are perpendicular)
     */
    static dot(v1: Vector2, v2: Vector2): number {
        return v1.x * v2.x + v1.y * v2.y;
    }

    /** 
     * Calculates the distance between two vectors.
     * @param v1 - The first vector.
     * @param v2 - The second vector.
     * @returns The distance between v1 and v2.
     * @example
     * const v1 = new Vector2(0, 0);
     * const v2 = new Vector2(3, 4);
     * const dist = Vector2.distanceTo(v1, v2); // 5
     */
    static distanceTo(v1: Vector2, v2: Vector2): number {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Performs a Linear Interpolation (Lerp) between two vectors.
     * @param v1 - The starting vector.
     * @param v2 - The target vector.
     * @param alpha - A value between 0 and 1 (0 = start, 1 = end, 0.5 = middle).
     * @returns A new interpolated Vector2.
     * @example
     * const start = new Vector2(0, 0);
     * const end = new Vector2(10, 10);
     * const mid = Vector2.lerp(start, end, 0.5); // Vector2(5, 5)
     */
    static lerp(v1: Vector2, v2: Vector2, alpha: number): Vector2 {
        return new Vector2(
            v1.x + (v2.x - v1.x) * alpha,
            v1.y + (v2.y - v1.y) * alpha
        );
    }

    /**
     * Adds another vector to this vector in place.
     * @param v - The vector to add.
     * @example
     * const v1 = new Vector2(10, 10);
     * v1.add(new Vector2(5, 5)); // v1 is now (15, 15)
     */
    add(v: Vector2): void {
        this.x += v.x
        this.y += v.y
    }

    /**
     * Subtracts another vector from this vector in place.
     * @param v - The vector to subtract.
     * @example
     * const v1 = new Vector2(10, 10);
     * v1.sub(new Vector2(2, 3)); // v1 is now (8, 7)
     */
    sub(v: Vector2): void {
        this.x -= v.x
        this.y -= v.y
    }

    /**
     * Multiplies this vector by a scalar in place.
     * @param scalar - The scalar value to multiply by.
     * @example
     * const v = new Vector2(5, 5);
     * v.mul(2); // v is now (10, 10)
     */
    mul(scalar: number): void {
        this.x *= scalar
        this.y *= scalar
    }

    /**
     * Divides this vector by a scalar in place.
     * @param scalar - The scalar value to divide by.
     * @example
     * const v = new Vector2(10, 10);
     * v.div(2); // v is now (5, 5)
     */
    div(scalar: number): void {
        this.x /= scalar
        this.y /= scalar
    }

    /**
     * Calculates the dot product between this vector and another.
     * Mathematically: (x1 * x2) + (y1 * y2)
     * @param v - The other vector.
     * @returns The scalar dot product.
     * @example
     * const v1 = new Vector2(1, 0);
     * const dot = v1.dot(new Vector2(0, 1)); // 0
     */
    dot(v: Vector2): number {
        return this.x * v.x + this.y * v.y;
    }

    /** 
     * Calculates the distance between this vector and another.
     * @param v - The target vector.
     * @returns The distance to the target vector.
     * @example
     * const v1 = new Vector2(0, 0);
     * const dist = v1.distanceTo(new Vector2(3, 4)); // 5
     */
    distanceTo(v: Vector2): number {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Returns the squared magnitude of the vector.
     * Useful for distance comparisons as it's much faster than magnitude() (avoids square root).
     * @returns The squared magnitude.
     * @example
     * const v = new Vector2(3, 4);
     * const magSq = v.magnitudeSq(); // 25
     */
    magnitudeSq(): number {
        return this.x * this.x + this.y * this.y
    }

    /**
     * Returns the magnitude (length) of the vector.
     * Implements Pythagorean theorem: a² + b² = c²
     * @returns The magnitude of the vector.
     * @example
     * const v = new Vector2(3, 4);
     * const mag = v.magnitude(); // 5
     */
    magnitude(): number {
        return Math.sqrt(this.magnitudeSq());
    }

    /**
     * Normalizes the vector (keeps direction but transforms length to 1) and returns a new vector.
     * If the vector is (0,0), returns a zero vector to avoid division by zero.
     * @returns A new normalized Vector2.
     * @example
     * const v = new Vector2(10, 0);
     * const normalized = v.normalize(); // Vector2(1, 0)
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
     * Creates a new vector with the same x and y values as this vector.
     * @returns A cloned Vector2.
     * @example
     * const v1 = new Vector2(5, 5);
     * const clone = v1.clone();
     */
    clone(): Vector2 {
        return new Vector2(this.x, this.y)
    }

    /**
     * Performs a Linear Interpolation (Lerp) between this vector and a target vector in place.
     * @param target - The target vector.
     * @param alpha - A value between 0 and 1 (0 = start, 1 = end, 0.5 = middle).
     * @returns This vector for chaining.
     * @example
     * const v1 = new Vector2(0, 0);
     * v1.lerp(new Vector2(10, 10), 0.5); // v1 is now (5, 5)
     */
    lerp(target: Vector2, alpha: number): this {
        this.x += (target.x - this.x) * alpha
        this.y += (target.y - this.y) * alpha
        return this
    }
}