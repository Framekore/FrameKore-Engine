import { Component } from "@framekore/core";
import type { Frame, Texture } from "./texture";
import { Vector2 } from "@framekore/math";

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
     * Ponto de ancoragem/pivô do sprite (de 0 a 1).
     * (0.5, 0.5) = Centro | (0, 0) = Canto Superior Esquerdo (Top-Left)
     * Padrão: (0.5, 0.5)
     */
    #anchor: Vector2 = new Vector2(0.5, 0.5);

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
     * Sets the anchor origin of the Sprite relative to its dimensions.
     * @param x - X anchor (0 = left, 0.5 = center, 1 = right).
     * @param y - Y anchor (0 = top, 0.5 = center, 1 = bottom).
     * @example sprite.setOrigin(0, 0); // Sets origin to top-left
     */
    setAnchor(x: number, y: number): void {
        this.#anchor.x = x
        this.#anchor.y = y
    }

    getAnchor() {
        return this.#anchor
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