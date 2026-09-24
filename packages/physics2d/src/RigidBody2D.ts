import { Vector2 } from "@framekore/math"
import { Component } from "@framekore/core"

export const RIGID_BODY_2D = Symbol("rigidBody2d");

/**
 * Component that adds physical behavior to a GameObject, allowing it to be affected by gravity and forces.
 * Works in conjunction with the Physics2D manager and BoxCollide2D for collision resolution.
 */
export class RigidBody2D extends Component {
    /** 
     * Unique symbol key identifying this component. 
     */
    static key = RIGID_BODY_2D
    
    /**
     * The current velocity vector of the rigid body.
     */
    velocity = new Vector2()

    /**
     * The mass of the rigid body. Affects how forces are applied to it.
     * Default is 1.
     */
    mass = 1

    /**
     * Determines whether the global gravity from PhysicsManager2D affects this body.
     */
    useGravity = true

    /**
     * Tracks the collision state on all four sides of the body during the current frame.
     * Useful for determining if a character is grounded (touching.bottom).
     */
    touching = {
        top: false,
        bottom: false,
        left: false,
        right: false
    }

    /**
     * Applies an instantaneous force to the rigid body, modifying its velocity based on its mass.
     * Formula: velocity += force / mass
     * @param force - The force vector to apply.
     * @example
     * const rb = gameObject.getComponent(RigidBody2D);
     * // Jump by applying an upward force
     * rb.applyForce(new Vector2(0, -500));
     */
    applyForce(x: number, y: number): void {
        this.velocity.x += x / this.mass
        this.velocity.y += y / this.mass
    }
}