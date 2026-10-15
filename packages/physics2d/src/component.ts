import { GameObject } from "@framekore/core";

/**
 * Abstract base class for all physics components in the `@framekore/physics2d` package.
 *
 * A `Component` binds itself to a specific {@link GameObject} at construction time,
 * giving the component access to the object it belongs to (e.g., to look up sibling
 * components like `Transform2D`).
 *
 * You should not use this class directly — extend it when creating custom physics
 * components such as `RigidBody2D` or `BoxCollide2D`.
 *
 * @example
 * // Creating a custom physics component
 * class MyPhysicsComponent extends Component {
 *   speed = 0;
 *
 *   constructor(object: GameObject) {
 *     super(object);
 *   }
 * }
 *
 * const comp = new MyPhysicsComponent(myGameObject);
 */
export class Component {
    /**
     * The {@link GameObject} this component is attached to.
     * Use this reference to access sibling components via `getComponentByType`.
     */
    gameObject: GameObject

    /**
     * Creates a new Component and binds it to the given {@link GameObject}.
     * @internal Extend this class instead of using it directly.
     * @param object - The {@link GameObject} this component will be attached to.
     */
    constructor(object: GameObject) {
        this.gameObject = object
    }
}