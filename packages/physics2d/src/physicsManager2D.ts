import { definePlugin, Engine, getComponentByType } from "@framekore/core";
import type { GameObject } from "@framekore/core";
import { Vector2 } from "@framekore/math";
import { Transform2D } from "@framekore/transform2d";
import { BoxCollide2D } from "./boxCollide2D";
import { RigidBody2D } from "./RigidBody2D";
// import { hasBoxCollider, hasRigidBody } from ".";

// O sistema antigo dependia de WeakMaps que eram preenchidos por eventos do ECS.
// Agora vamos varrer a cena dinamicamente (como o RenderManager2D faz).

/**
 * Creates and registers the `physics2d` plugin with the engine.
 *
 * This plugin:
 * - Instantiates a {@link Physics2D} manager and stores it as an engine resource.
 * - Hooks into the engine's fixed-update loop to call {@link Physics2D.step} each tick,
 *   advancing the physics simulation by the fixed time step `delta`.
 *
 * Register once when setting up the engine. After registration you can retrieve the
 * manager at any time via `engine.getResource(Physics2D)`.
 *
 * @returns An `EnginePlugin` definition ready to be passed to `engine.use()`.
 *
 * @example
 * import { physics2d } from "@framekore/physics2d";
 *
 * engine.use(physics2d());
 *
 * // Later, access the physics manager from anywhere:
 * const physics = engine.getResource(Physics2D);
 * physics.gravity.y = 980; // Adjust gravity
 */
export const physics2d = definePlugin(() => {
  return {
    name: "physics",
    setup(engine) {
      // Removemos o setup inicial dos WeakMaps

      const physics = new Physics2D(engine);
      engine.setResource(Physics2D, physics);
    },
    fixedUpdate(engine, delta) {
      const physics = engine.getResource(Physics2D)
      if (!engine.currentScene || !physics)
        return
      physics.step(delta)
    },
    
  };
});

/**
 * Central physics manager for the `@framekore/physics2d` package.
 *
 * `Physics2D` drives the 2D physics simulation each fixed-update step. It:
 * 1. Scans the active {@link Scene} for all {@link RigidBody2D} and {@link BoxCollide2D}
 *    components.
 * 2. Applies gravity to bodies that have `useGravity` enabled.
 * 3. Moves each body along the X axis, then resolves collisions horizontally.
 * 4. Moves each body along the Y axis, then resolves collisions vertically.
 *
 * This separated-axis approach prevents tunnelling and gives predictable results for
 * platformer-style games.
 *
 * Retrieve the singleton instance from anywhere using:
 * ```ts
 * const physics = engine.getResource(Physics2D);
 * ```
 *
 * @example
 * // Change global gravity at runtime
 * const physics = engine.getResource(Physics2D);
 * physics.gravity.y = 2000; // stronger gravity
 *
 * @example
 * // Manual collision check between two objects
 * const physics = engine.getResource(Physics2D);
 * if (physics.checkCollision(player, enemy)) {
 *   takeDamage();
 * }
 */
export class Physics2D {
  /**
   * Global gravity vector applied every fixed step to each {@link RigidBody2D} that
   * has `useGravity` set to `true`.
   *
   * The default value of `(0, 1500)` produces a fast arcade-style downward pull.
   * Reduce `y` for a slower, heavier feel; set it to `0` for zero-gravity environments.
   * Modify `x` for side-scrollers with unusual gravity directions.
   *
   * Units: pixels per second² (applied as `velocity.y += gravity.y * delta`).
   *
   * @default new Vector2(0, 1500)
   *
   * @example
   * const physics = engine.getResource(Physics2D);
   * physics.gravity.y = 980;  // Earth-like (scaled to your pixel units)
   * physics.gravity.y = 0;    // Zero gravity / top-down game
   */
  gravity: Vector2 = new Vector2(0, 1500);

  /** @internal Engine reference used to access the active scene each step. */
  #engine: Engine;

  /**
   * Creates a new `Physics2D` manager bound to the given engine instance.
   * @internal Instantiated automatically by the {@link physics2d} plugin — do not call directly.
   * @param engine - The engine instance this manager belongs to.
   */
  constructor(engine: Engine) {
    this.#engine = engine;
  }

  /**
   * Tests whether two GameObjects' AABB colliders are currently overlapping.
   *
   * Both objects **must** have a {@link Transform2D} and a {@link BoxCollide2D} component;
   * otherwise an error is thrown. The check does **not** consider layer/mask filters —
   * use {@link canCollide} beforehand if you need layer-aware filtering.
   *
   * @param a - The first {@link GameObject} to test.
   * @param b - The second {@link GameObject} to test.
   * @returns `true` if the two AABB bounds overlap, `false` otherwise.
   * @throws {Error} If either object is missing a `Transform2D` or `BoxCollide2D` component.
   *
   * @example
   * const physics = engine.getResource(Physics2D);
   *
   * if (physics.checkCollision(player, bullet)) {
   *   console.log("Player hit by bullet!");
   *   bullet.destroy();
   * }
   */
  checkCollision(a: GameObject, b: GameObject): boolean {
    const transformA = getComponentByType(a, Transform2D);
    const boxA = getComponentByType(a, BoxCollide2D);
    const transformB = getComponentByType(b, Transform2D);
    const boxB = getComponentByType(b, BoxCollide2D);

    if (!boxA || !boxB || !transformA || !transformB) {
      throw new Error(
        "Objects must have 'Transform2D' and 'BoxCollide2D' components to check collisions.",
      );
    }
    
    const boundA = boxA.getBounds(transformA);
    const boundB = boxB.getBounds(transformB);

    return (
      boundA.right > boundB.left &&
      boundA.left < boundB.right &&
      boundA.bottom > boundB.top &&
      boundA.top < boundB.bottom
    );
  }

  /**
   * Checks whether two {@link BoxCollide2D} colliders are permitted to interact based on
   * their `layer` and `mask` bitmask configuration.
   *
   * A pair can collide only when **both** conditions are true:
   * - `boxA.mask` includes `boxB.layer` (`boxA.mask & boxB.layer !== 0`)
   * - `boxB.mask` includes `boxA.layer` (`boxB.mask & boxA.layer !== 0`)
   *
   * This is used internally by {@link resolveCollisionsX} and {@link resolveCollisionsY}
   * to skip pairs that should not interact, reducing unnecessary computation.
   *
   * @param boxA - The first {@link BoxCollide2D}.
   * @param boxB - The second {@link BoxCollide2D}.
   * @returns `true` if the pair is allowed to collide, `false` otherwise.
   *
   * @example
   * const physics = engine.getResource(Physics2D);
   * const playerBox = getComponentByType(player, BoxCollide2D);
   * const wallBox   = getComponentByType(wall, BoxCollide2D);
   *
   * if (physics.canCollide(playerBox, wallBox)) {
   *   console.log("Player and wall can interact");
   * }
   */
  canCollide(boxA: BoxCollide2D, boxB: BoxCollide2D): boolean {
    const aHitsB = (boxA.mask & boxB.layer) !== 0
    const bHitsA = (boxB.mask & boxA.layer) !== 0

    return aHitsB && bHitsA
  }

  /**
   * Manually resolves a collision between two GameObjects by calculating the minimum
   * overlap on each axis (AABB MTV — Minimum Translation Vector) and separating them.
   *
   * - If both objects have a {@link RigidBody2D}, the correction is split equally between them.
   * - If only one object has a {@link RigidBody2D}, the full correction is applied to that object.
   * - The velocity component along the collision axis is zeroed out.
   * - The relevant `touching` flag is set on each `RigidBody2D` involved.
   *
   * Both objects **must** have `Transform2D` and `BoxCollide2D` components, otherwise
   * an error is thrown.
   *
   * > **Note:** Prefer letting {@link step} handle resolution automatically. Call this
   * > method directly only for one-off, manual resolution outside the physics loop.
   *
   * @param object1 - The first {@link GameObject}.
   * @param object2 - The second {@link GameObject}.
   * @throws {Error} If either object is missing a `Transform2D` or `BoxCollide2D` component.
   *
   * @example
   * const physics = engine.getResource(Physics2D);
   * // Manually push two objects apart after a custom overlap test
   * physics.resolveCollision(playerObj, wallObj);
   */
  resolveCollision(object1: GameObject, object2: GameObject): void {
    
    const transformA = getComponentByType(object1, Transform2D);
    const boxA = getComponentByType(object1, BoxCollide2D);
    const transformB = getComponentByType(object2, Transform2D);
    const boxB = getComponentByType(object2, BoxCollide2D);

    if (!boxA || !boxB || !transformA || !transformB)
      throw new Error(
        "Objects must have 'Transform2D' and 'BoxCollide2D' components to resolve collisions.",
      );

    const dx =
      transformA.position.x +
      boxA.width / 2 -
      (transformB.position.x + boxB.width / 2);
    const dy =
      transformA.position.y +
      boxA.height / 2 -
      (transformB.position.y + boxB.height / 2);

    const combinedHalfWidths = boxA.width / 2 + boxB.width / 2;
    const combinedHalfHeights = boxA.height / 2 + boxB.height / 2;

    if (
      Math.abs(dx) < combinedHalfWidths &&
      Math.abs(dy) < combinedHalfHeights
    ) {
      const overlapX = combinedHalfWidths - Math.abs(dx);
      const overlapY = combinedHalfHeights - Math.abs(dy);

      const rbA = getComponentByType(object1, RigidBody2D);
      const rbB = getComponentByType(object2, RigidBody2D);
      if (rbA && rbB) {
        if (overlapX < overlapY) {
          if (dx > 0) {
            transformA.position.x += overlapX / 2
            transformB.position.x -= overlapX / 2

            rbA.touching.left = true
            rbB.touching.right = true
          } else {
            transformA.position.x -= overlapX / 2
            transformB.position.x += overlapX / 2

            rbA.touching.right = true
            rbB.touching.left = true
          }

          rbA.velocity.x = 0
          rbB.velocity.x = 0

        } else {
          if (dy > 0) {
            transformA.position.y += overlapY / 2
            transformB.position.y -= overlapY / 2

            rbA.touching.top = true
            rbB.touching.bottom = true
          } else {
            transformA.position.y -= overlapY / 2
            transformB.position.y += overlapY / 2

            rbA.touching.bottom = true
            rbB.touching.top = true
          }

          rbA.velocity.y = 0
          rbB.velocity.y = 0
        }
      } else if (rbA) {
        if (overlapX < overlapY) {
          if (dx > 0) {
            transformA.position.x += overlapX;
            rbA.touching.left = true
          }
          else {
            transformA.position.x -= overlapX;
            rbA.touching.right = true
          }
          rbA.velocity.x = 0
        } else {
          if (dy > 0) {
            transformA.position.y += overlapY;
            rbA.touching.top = true
          }
          else {
            transformA.position.y -= overlapY;
            rbA.touching.bottom = true
          }
          rbA.velocity.y = 0
        }
      } else if (rbB) {
        if (overlapX < overlapY) {
          if (dx > 0) {
            transformB.position.x += overlapX;
            rbB.touching.left = true
          }
          else {
            transformB.position.x -= overlapX;
            rbB.touching.right = true
          }
          rbB.velocity.x = 0
        } else {
          if (dy > 0) {
            transformB.position.y += overlapY;
            rbB.touching.top = true
          }
          else {
            transformB.position.y -= overlapY;
            rbB.touching.bottom = true
          }
          rbB.velocity.y = 0
        }
      }
    }
  }

  /**
   * Advances the physics simulation by one fixed time step.
   *
   * Execution order each call:
   * 1. Collect all {@link RigidBody2D} and {@link BoxCollide2D} components from the active scene.
   * 2. Reset every collider's `colliding` flag to `false`.
   * 3. Reset every rigid body's `touching` state (top/bottom/left/right) to `false`.
   * 4. For each rigid body:
   *    a. Apply `gravity.y` to `velocity.y` (if `useGravity` is enabled).
   *    b. Move the object along the X axis (`position.x += velocity.x * delta`).
   *    c. Resolve X-axis collisions via {@link resolveCollisionsX}.
   *    d. Move the object along the Y axis (`position.y += velocity.y * delta`).
   *    e. Resolve Y-axis collisions via {@link resolveCollisionsY}.
   *
   * Called automatically by the `physics2d` plugin on every `fixedUpdate` tick.
   * Do not call this manually unless you are managing the physics loop yourself.
   *
   * @param delta - The fixed time step in seconds (e.g., `1/60` for a 60 Hz physics rate).
   *
   * @example
   * // The plugin calls this for you — manual usage is rare:
   * const physics = engine.getResource(Physics2D);
   * physics.step(1 / 60);
   */
  step(delta: number): void {
    const scene = this.#engine.currentScene;
    if (!scene) return;

    const objects = scene.getObjects();
    const rbSet = new Set<RigidBody2D>();
    const colSet = new Set<BoxCollide2D>();

    // Coleta todos os corpos rígidos e colisores da cena atual
    for (const obj of objects) {
      const rb = getComponentByType(obj, RigidBody2D);
      const col = getComponentByType(obj, BoxCollide2D);
      
      if (rb) rbSet.add(rb);
      if (col) colSet.add(col);
    }

    for (const collider of colSet) {
      collider.colliding = false
    }

    for (const rb of rbSet) {
      rb.touching.top = false
      rb.touching.bottom = false
      rb.touching.left = false
      rb.touching.right = false
      if (!rb.gameObject)
        continue
      const transform = getComponentByType(rb.gameObject, Transform2D);
      if (!transform)
        continue;

      if (rb.useGravity)
        rb.velocity.y += this.gravity.y * delta;

      transform.position.x += rb.velocity.x * delta;
      this.resolveCollisionsX(rb, colSet)
      transform.position.y += rb.velocity.y * delta;
      this.resolveCollisionsY(rb, colSet)
    }
  }

  /**
   * Resolves horizontal (X-axis) overlaps between a specific {@link RigidBody2D} and all
   * active colliders in the scene after the body has been moved along the X axis.
   *
   * For each other collider that passes the layer/mask and AABB overlap tests:
   * - If either collider is a **trigger**, only the `colliding` flag is set — no position correction.
   * - Otherwise, the body is pushed back to remove the overlap, velocity X is zeroed, and the
   *   appropriate `touching` flag (`left` or `right`) is set based on the direction of movement.
   *
   * Called internally by {@link step}. Should not need to be called directly.
   *
   * @param rb     - The {@link RigidBody2D} whose X movement is being resolved.
   * @param colSet - The set of all active {@link BoxCollide2D} components in the scene.
   */
  resolveCollisionsX(rb: RigidBody2D, colSet: Set<BoxCollide2D>): void {
    const objA = rb.gameObject
    if (!objA)
      return
    const transformA = getComponentByType(objA, Transform2D);
    const boxA = getComponentByType(objA, BoxCollide2D);

    if (!transformA || !boxA)
      return

    for (const collider of colSet) {
      const objB = collider.gameObject
      if (!objB || objA === objB) continue

      const transformB = getComponentByType(objB, Transform2D);
      const boxB = getComponentByType(objB, BoxCollide2D);

      if (!transformB || !boxB) continue
      if (!this.canCollide(boxA, boxB)) continue
      if (!this.checkCollision(objA, objB)) continue

      if (boxA.isTrigger || boxB.isTrigger) {
        if (boxA.isTrigger)
          boxA.colliding = true
        if (boxB.isTrigger)
          boxB.colliding = true
        continue
      }

      const boundsA = boxA.getBounds(transformA)
      const boundsB = boxB.getBounds(transformB)

      if (rb.velocity.x > 0) {
        transformA.position.x -= boundsA.right - boundsB.left
        rb.touching.right = true
      } else if (rb.velocity.x < 0) {
        transformA.position.x += boundsB.right - boundsA.left
        rb.touching.left = true
      }

      rb.velocity.x = 0
    }
  }

  /**
   * Resolves vertical (Y-axis) overlaps between a specific {@link RigidBody2D} and all
   * active colliders in the scene after the body has been moved along the Y axis.
   *
   * For each other collider that passes the layer/mask and AABB overlap tests:
   * - If either collider is a **trigger**, the overlap is skipped (trigger flags are already
   *   handled during the X pass in {@link resolveCollisionsX}).
   * - Otherwise, the body is pushed back to remove the overlap, velocity Y is zeroed, and the
   *   appropriate `touching` flag (`top` or `bottom`) is set based on the direction of movement.
   *
   * Setting `touching.bottom = true` indicates the body is **grounded** this frame.
   *
   * Called internally by {@link step}. Should not need to be called directly.
   *
   * @param rb     - The {@link RigidBody2D} whose Y movement is being resolved.
   * @param colSet - The set of all active {@link BoxCollide2D} components in the scene.
   */
  resolveCollisionsY(rb: RigidBody2D, colSet: Set<BoxCollide2D>): void {
    const objA = rb.gameObject
    if (!objA) return
    
    const transformA = getComponentByType(objA, Transform2D);
    const boxA = getComponentByType(objA, BoxCollide2D);

    if (!transformA || !boxA) return

    for (const collider of colSet) {
      const objB = collider.gameObject
      if (!objB || objA === objB) continue

      const transformB = getComponentByType(objB, Transform2D);
      const boxB = getComponentByType(objB, BoxCollide2D);

      if (!transformB || !boxB) continue
      if (!this.canCollide(boxA, boxB)) continue
      if (!this.checkCollision(objA, objB)) continue
      if (boxA.isTrigger || boxB.isTrigger) {
        continue
      }
      const boundsA = boxA.getBounds(transformA)
      const boundsB = boxB.getBounds(transformB)

      if (rb.velocity.y > 0) {
        transformA.position.y -= boundsA.bottom - boundsB.top
        rb.touching.bottom = true
      } else if (rb.velocity.y < 0) {
        transformA.position.y += boundsB.bottom - boundsA.top
        rb.touching.top = true
      }

      rb.velocity.y = 0
    }
  }
}

