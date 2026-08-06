import type { Component } from "./component"

/**
 * Type representing the constructor of a Component class.
 * Ensures the class has a static `key` property of type symbol.
 */
export type ComponentClass<T extends Component = Component> = {
    /** Constructor signature */
    new(...args: any[]): T
    /** A unique symbol used to register and retrieve the component. */
    key?: symbol
}

/**
 * Represents a valid key type used to identify a component.
 * Can be either the raw symbol itself or the Component class (which contains the static key).
 */
export type ComponentKey<T extends Component = Component> =
    | symbol
    | ComponentClass<T>