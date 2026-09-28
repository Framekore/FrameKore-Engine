import type { Frame, Texture } from "./texture";
import { Vector2 } from "@framekore/math";
import { Renderable2D } from "./renderable2D";
import { Transform2D } from "@framekore/transform2d";

export const SPRITE_2D = Symbol("sprite2d")



/**
 * Component used to render a static 2D image (sprite) from a texture.
 * To be visible, the GameObject must also have a Transform2D component.
 */
export class Sprite2D extends Renderable2D {
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

    #anchor: Vector2 = new Vector2(0.5, 0.5);

    /** Flips the sprite horizontally across its anchor point. Default is `false`. */
    public flipX: boolean = false;

    /** Flips the sprite vertically across its anchor point. Default is `false`. */
    public flipY: boolean = false;

    /** Opacity multiplier ranging from 0.0 (fully transparent) to 1.0 (fully opaque). Default is `1.0`. */
    public alpha: number = 1.0;

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

    /**
     * Ponto de ancoragem/pivô do sprite (de 0 a 1).
     * (0.5, 0.5) = Centro | (0, 0) = Canto Superior Esquerdo (Top-Left)
     * Padrão: (0.5, 0.5)
     */
    get anchor() {
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

    /**
     * Renders the active texture frame to the Canvas 2D context.
     *
     * Applies pixel rounding (`Math.round`) to source frame coordinates, origin offsets,
     * and world positions retrieved from the parent GameObject's `Transform2D` component.
     * Disables image smoothing to ensure crisp pixel art output without sub-pixel artifacts.
     *
     * @param ctx - The target CanvasRenderingContext2D instance.
     * @returns Void. Aborts early if the component is hidden, lacks a texture, or if no `Transform2D` exists on the parent GameObject.
    */
    /**
     * Renders the sprite to the Canvas 2D context with pixel-snapping, orientation flips, and opacity.
     * @param ctx - Target CanvasRenderingContext2D instance.
     */
    override render(ctx: CanvasRenderingContext2D): void {
        
        if (!this.visible || this.alpha <= 0 || !this.texture || !this.gameObject) return;

        const transform = this.gameObject.getComponent(Transform2D);
        if (!transform) return;
        const srcX = this.frame?.x ?? 0;
        const srcY = this.frame?.y ?? 0;
        const srcW = this.frame?.width ?? this.texture.width;
        const srcH = this.frame?.height ?? this.texture.height;

        const offsetX = Math.round(-srcW * this.anchor.x);
        const offsetY = Math.round(-srcH * this.anchor.y);

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        ctx.globalAlpha *= Math.max(0, Math.min(1, this.alpha));
        ctx.scale(1, 1);
        
        ctx.translate(
            Math.round(transform.position.x),
            Math.round(transform.position.y)
        );

        ctx.rotate(transform.rotation);

        
        ctx.drawImage(
            this.texture.image,
            Math.round(srcX),
            Math.round(srcY),
            srcW,
            srcH,
            offsetX,
            offsetY,
            srcW,
            srcH
        );
        
        ctx.restore();
    }
}