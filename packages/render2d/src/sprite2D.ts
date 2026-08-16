import { Component } from "@framekore/core";
import type { Frame, Texture } from "./texture";

export const SPRITE_2D = Symbol("sprite2d")

/**
 * Component used to render a static 2D image (sprite) from a texture.
 * To be visible, the GameObject must also have a Transform2D component.
 */
export class Sprite2D extends Component {
    /** 
     * Unique symbol key identifying this component. 
     */
    static key = SPRITE_2D

    /**
     * The texture source used for rendering.
     */
    texture: Texture

    /**
     * The specific frame (region) of the texture to render.
     * If undefined, the entire texture might be rendered depending on the render manager.
     */
    frame?: Frame

    /**
     * Creates a new Sprite2D component.
     * @param texture - The Texture object containing the image data.
     * @example
     * const texture = new Texture(myImageElement);
     * const sprite = new Sprite2D(texture);
     * gameObject.addComponent(sprite);
     */
    constructor(texture: Texture) {
        super()
        this.texture = texture
    }

    /**
     * Sets the active frame using grid coordinates (column, row).
     * The texture must have been previously sliced into a grid.
     * @param x - The column index (0-based) on the texture grid.
     * @param y - The row index (0-based) on the texture grid.
     * @example
     * // Sets the sprite to display the frame at column 1, row 0
     * sprite.setFrame(1, 0);
     */
    setFrame(x: number, y: number): void {
        this.frame = this.texture.getFrame(x, y)
    }

    /**
     * Sets the active frame using a predefined alias name.
     * The name must have been previously defined on the texture using `define()`.
     * @param name - The named alias of the frame.
     * @example
     * sprite.setFrameByName("player_idle");
     */
    setFrameByName(name: string): void {
        this.frame = this.texture.getFrameByName(name)
    }
}