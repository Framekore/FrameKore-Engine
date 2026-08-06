import { definePlugin, Engine } from "@framekore/core";
import type { GameObject } from "@framekore/core";
import type { Component } from "@framekore/core";
import { Vector2 } from "@framekore/math";
import { TRANSFORM_2D, type ITransform2D } from "@framekore/transform2d";
import { BOX_COLLIDE_2D, BoxCollide2D } from "./boxCollide2D";
import { RIGID_BODY_2D, RigidBody2D } from "./RigidBody2D";

type TransformLike = Component & ITransform2D

const rigidBodies = new WeakMap<Engine, Set<RigidBody2D>>();
const boxColliders = new WeakMap<Engine, Set<BoxCollide2D>>();

/**
 * Creates the Physics2D plugin for the Engine.
 * Registers PhysicsManager2D and handles fixed step updates for physics resolution.
 * @returns An EnginePlugin definition to be passed to `engine.use()`.
 * @example
 * engine.use(physics2d());
 */
export const physics2d = definePlugin(() => {
  return {
    name: "physics",
    setup(engine) {
      rigidBodies.set(engine, new Set());
      boxColliders.set(engine, new Set());
      const physics = new Physics2D(engine);
      engine.setResource(Physics2D, physics);
    },
    fixedUpdate(engine, delta) {
      const physics = engine.getResource(Physics2D)
      if (!engine.currentScene || !physics)
        return
      physics.step(delta)
    },
    onComponentAdded(component) {
      const gameObject = component.gameObject;
      if (!gameObject || !gameObject.engine)
        return
      if (component instanceof RigidBody2D) {
        rigidBodies.get(gameObject.engine)?.add(component);
      }
      if (component instanceof BoxCollide2D) {
        boxColliders.get(gameObject.engine)?.add(component);
      }
    },
    onComponentRemoved(component) {
      const gameObject = component.gameObject;
      if (!gameObject || !gameObject.engine)
        return
      if (component instanceof RigidBody2D) {
        rigidBodies.get(gameObject.engine)?.delete(component);
      }
      if (component instanceof BoxCollide2D) {
        boxColliders.get(gameObject.engine)?.delete(component);
      }
    },
  };
});

/**
 * Manages physics simulation, collision detection, and resolution.
 * Accessed globally through the Engine resources.
 */
export class Physics2D {
  /** 
   * Global gravity vector applied to all RigidBody2D components that have `useGravity` enabled.
   */
  gravity: Vector2 = new Vector2(0, 1500);

  #engine: Engine;

  /**
   * @internal Instantiated automatically by the physics2d plugin.
   */
  constructor(engine: Engine) {
    this.#engine = engine;
  }

  /**
   * Checks if two GameObjects are physically overlapping (AABB collision).
   * Both objects must have a Transform2D and BoxCollide2D component.
   * @param a - The first GameObject.
   * @param b - The second GameObject.
   * @returns True if the colliders overlap, otherwise false.
   * @example
   * const physics = engine.getResource(Physics2D);
   * if (physics.checkCollision(player, bullet)) {
   *   console.log("Player hit!");
   * }
   */
  checkCollision(a: GameObject, b: GameObject): boolean {
    const transformA = a.getComponent<TransformLike>(TRANSFORM_2D);
    const boxA = a.getComponent<BoxCollide2D>(BOX_COLLIDE_2D);
    const transformB = b.getComponent<TransformLike>(TRANSFORM_2D);
    const boxB = b.getComponent<BoxCollide2D>(BOX_COLLIDE_2D);

    if (!boxA || !boxB || !transformA || !transformB)
      throw new Error(
        "Objects must have 'Transform2D' and 'BoxCollide2D' components to check collisions.",
      );

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
   * Determines whether two colliders are allowed to interact based on their layer and mask configuration.
   * @param boxA - The first BoxCollide2D.
   * @param boxB - The second BoxCollide2D.
   * @returns True if they can collide, false otherwise.
   */
  canCollide(boxA: BoxCollide2D, boxB: BoxCollide2D): boolean {
    const aHitsB = (boxA.mask & boxB.layer) !== 0
    const bHitsA = (boxB.mask & boxA.layer) !== 0

    return aHitsB && bHitsA
  }

  /**
   * Manually resolves a collision between two GameObjects by separating them.
   * Updates velocities and touching state if RigidBody2D components are present.
   * @param object1 - The first GameObject.
   * @param object2 - The second GameObject.
   */
  resolveCollision(object1: GameObject, object2: GameObject): void {
    const transformA = object1.getComponent<TransformLike>(TRANSFORM_2D);
    const boxA = object1.getComponent<BoxCollide2D>(BOX_COLLIDE_2D);
    const transformB = object2.getComponent<TransformLike>(TRANSFORM_2D);
    const boxB = object2.getComponent<BoxCollide2D>(BOX_COLLIDE_2D);

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

      const rbA = object1.getComponent<RigidBody2D>(RIGID_BODY_2D);
      const rbB = object2.getComponent<RigidBody2D>(RIGID_BODY_2D);
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
   * Updates physics states, applies gravity, moves objects, and resolves collisions using a separated-axis approach.
   * Called automatically by the engine's fixed update loop.
   * @param delta - The fixed time step.
   */
  step(delta: number): void {
    const rbSet = rigidBodies.get(this.#engine);
    const colSet = boxColliders.get(this.#engine);
    if (!rbSet || !colSet) return;
    
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
      const transform = rb.gameObject.getComponent<TransformLike>(TRANSFORM_2D);
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
   * Resolves horizontal (X-axis) collisions for a specific rigid body against all other colliders.
   * @param rb - The moving RigidBody2D.
   * @param colSet - Set of all active BoxCollide2D components.
   */
  resolveCollisionsX(rb: RigidBody2D, colSet: Set<BoxCollide2D>): void {
    const objA = rb.gameObject
    if (!objA)
      return
    const transformA = objA.getComponent<TransformLike>(TRANSFORM_2D)
    const boxA = objA.getComponent<BoxCollide2D>(BOX_COLLIDE_2D)

    if (!transformA || !boxA)
      return

    for (const collider of colSet) {
      const objB = collider.gameObject
      if (!objB || objA === objB) continue

      const transformB = objB.getComponent<TransformLike>(TRANSFORM_2D)
      const boxB = objB.getComponent<BoxCollide2D>(BOX_COLLIDE_2D)
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
   * Resolves vertical (Y-axis) collisions for a specific rigid body against all other colliders.
   * @param rb - The moving RigidBody2D.
   * @param colSet - Set of all active BoxCollide2D components.
   */
  resolveCollisionsY(rb: RigidBody2D, colSet: Set<BoxCollide2D>): void {
    const objA = rb.gameObject
    if (!objA) return

    const transformA = objA.getComponent<TransformLike>(TRANSFORM_2D)
    const boxA = objA.getComponent<BoxCollide2D>(BOX_COLLIDE_2D)
    if (!transformA || !boxA) return

    for (const collider of colSet) {
      const objB = collider.gameObject
      if (!objB || objA === objB) continue

      const transformB = objB.getComponent<TransformLike>(TRANSFORM_2D)
      const boxB = objB.getComponent<BoxCollide2D>(BOX_COLLIDE_2D)
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
