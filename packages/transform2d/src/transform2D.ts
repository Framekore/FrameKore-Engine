import { Vector2 } from "@framekore/math"
import { ITransform2D } from "./contract"

/**
 * Component responsible for the position, scale, and rotation of a GameObject in 2D space.
 * Virtually all visible objects will need this component.
 */
export class Transform2D implements ITransform2D {
    
    /**
     * The position of the GameObject in 2D space (x, y coordinates).
     * @example 
     * const transform = gameObject.getComponent(Transform2D);
     * transform.position.x = 100;
     */
    position = new Vector2()

    /**
     * The scale multiplier of the GameObject. 
     * Default is (1, 1), which means original size.
     * @example
     * const transform = gameObject.getComponent(Transform2D);
     * transform.scale.set(2, 2); // Doubles the size
     */
    scale = new Vector2(1,1)

    /**
     * The rotation angle of the GameObject in radians.
     * @example
     * const transform = gameObject.getComponent(Transform2D);
     * transform.rotation = Math.PI / 2; // 90 degrees
     */
    rotation = 0
}