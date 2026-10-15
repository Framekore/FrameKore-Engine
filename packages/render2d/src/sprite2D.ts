import type { Frame, Texture } from "./texture";
import { Vector2 } from "@framekore/math";
import { Renderable2D } from "./renderable2D";
import { Transform2D } from "@framekore/transform2d";
import { Engine, GameObject, getComponentByType } from "@framekore/core";

/**
 * Component that renders a static 2D image (or a single frame of a spritesheet)
 * onto the canvas, positioned and transformed by a sibling {@link Transform2D}
 * component.
 *
 * `Sprite2D` is the simplest visual component in the engine. Attach it to a
 * `GameObject` that also has a `Transform2D`; the `RenderManager2D` will
 * invoke {@link render} automatically every frame.
 *
 * For animated sprites use {@link AnimatedSprite2D}. For multi-state animation
 * management use {@link Animator2D}.
 *
 * @example
 * const texture = new Texture(image);
 * texture.slice(32, 32);
 *
 * const sprite = new Sprite2D(engine, texture);
 * sprite.setFrame(0, 0);  // first tile
 * sprite.zIndex = 1;
 *
 * const player = new GameObject(engine);
 * player.transform = new Transform2D(engine);
 * player.sprite = sprite;
 * scene.add(player);
 */
export class Sprite2D extends Renderable2D {
    /**
     * The texture (image source) used to draw this sprite.
     * Must be set before the first render call.
     */
    texture: Texture

    /**
     * The rectangular region of the texture to draw.
     * When `undefined`, the entire texture is drawn.
     * Use {@link setFrame} or {@link setFrameByName} to set this from a sliced texture,
     * or assign a {@link Frame} object directly.
     */
    frame?: Frame

    /** @internal Pivot/origin point used to offset the drawn image. Normalised (0–1). */
    #anchor: Vector2 = new Vector2(0.5, 0.5);

    /**
     * When `true`, the sprite is drawn mirrored along the X axis (left–right flip).
     * @default false
     */
    flipX: boolean = false;

    /**
     * When `true`, the sprite is drawn mirrored along the Y axis (top–bottom flip).
     * @default false
     */
    flipY: boolean = false;

    /**
     * Global opacity of the sprite, in the range `[0, 1]`.
     * Values are clamped: `0` is fully transparent, `1` is fully opaque.
     * Multiplied onto the existing `ctx.globalAlpha` so parent transparency is inherited.
     * @default 1.0
     */
    alpha: number = 1.0;

    /**
     * Optional override target whose {@link Transform2D} is used for positioning
     * instead of this sprite's own sibling transform.
     *
     * Useful when the sprite lives as a sub-component of a different object but
     * needs to follow a specific entity's position.
     *
     * @default undefined  (uses the sprite's own Transform2D)
     */
    target?: GameObject = undefined

    /**
     * @internal Instantiated by the user or by higher-level components.
     * @param engine - The engine instance.
     * @param texture - The {@link Texture} to render.
     */
    constructor(engine: Engine, texture: Texture) {
        super(engine)
        this.texture = texture
    }

    /**
     * Sets the normalised pivot (anchor) point used when positioning the sprite.
     *
     * `(0, 0)` anchors at the top-left corner; `(1, 1)` anchors at the bottom-right.
     * The default `(0.5, 0.5)` centres the sprite on the transform's position.
     *
     * @param x - Horizontal anchor factor, in the range `[0, 1]`.
     * @param y - Vertical anchor factor, in the range `[0, 1]`.
     * @example
     * sprite.setAnchor(0, 0);   // top-left origin
     * sprite.setAnchor(0.5, 1); // bottom-centre (feet of a character)
     */
    setAnchor(x: number, y: number): void {
        this.#anchor.x = x
        this.#anchor.y = y
    }

    /**
     * The current anchor point as a {@link Vector2}.
     * Read-only — use {@link setAnchor} to modify it.
     */
    get anchor() {
        return this.#anchor
    }

    /**
     * Sets {@link frame} to the texture tile at the given grid coordinates.
     * Requires the texture to have been sliced with {@link Texture.slice} first.
     *
     * @param x - Column index (0-based) on the sliced texture grid.
     * @param y - Row index (0-based) on the sliced texture grid.
     * @example
     * texture.slice(32, 32);
     * sprite.setFrame(2, 1); // third column, second row
     */
    setFrame(x: number, y: number): void {
        this.frame = this.texture.getFrame(x, y)
    }

    /**
     * Sets {@link frame} to the texture frame registered under a string alias.
     * Requires the frame to have been registered with {@link Texture.define} first.
     *
     * @param name - The alias name previously passed to `texture.define()`.
     * @example
     * texture.define("idle", 0, 0);
     * sprite.setFrameByName("idle");
     */
    setFrameByName(name: string): void {
        this.frame = this.texture.getFrameByName(name)
    }

    /**
     * Draws the sprite onto the canvas using the transform found on this
     * object (or on {@link target} if set).
     *
     * The draw order respects the canvas transform set up by `RenderManager2D`
     * (world space). Pixel-art sprites render crisply because
     * `imageSmoothingEnabled` is disabled inside this call.
     *
     * Called automatically by {@link RenderManager2D} — do not call manually.
     *
     * @param ctx - The canvas 2D rendering context.
     */
    render(ctx: CanvasRenderingContext2D): void {

        if (!this.visible || this.alpha <= 0 || !this.texture) return;
        let transform

        if (this.target) {
            transform = getComponentByType(this.target, Transform2D);
        } else {
            transform = getComponentByType(this, Transform2D);
        }
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
        const scaleX = (this.flipX ? -1 : 1) * transform.scale.x;
        const scaleY = (this.flipY ? -1 : 1) * transform.scale.y;

        // Correct order: translate to world position → then scale/flip → then rotate
        // (previously scale was applied before translate, pushing the sprite off-screen when flipX=true)
        ctx.translate(
            Math.round(transform.position.x),
            Math.round(transform.position.y)
        );
        ctx.scale(scaleX, scaleY);
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