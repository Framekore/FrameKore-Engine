import type { GameObject } from "../gameObject";

/**
 * Base abstract class for all Components.
 * Components add specific behavior or data to a GameObject.
 * All derived components MUST define a static `key: symbol` for identification.
 */
export abstract class Component {
    /**
     * The GameObject this component is attached to.
     * Automatically assigned when the component is added to a GameObject.
     */
    gameObject?: GameObject

    /**
     * Lifecycle method called immediately after this component is added to a GameObject.
     * Override this to run initialization logic that requires the GameObject context.
     */
    onAdded?(): void

    /**
     * Lifecycle method called immediately after this component is removed from a GameObject.
     * Override this to clean up resources or event listeners.
     */
    onRemoved?(): void
}