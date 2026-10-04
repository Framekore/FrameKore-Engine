import type { Frame, Texture } from "./texture";
import { Vector2 } from "@framekore/math";
import { Renderable2D } from "./renderable2D";
import { Transform2D } from "@framekore/transform2d";
import { Engine, GameObject } from "@framekore/core";

/**
 * Component used to render a static 2D image (sprite) from a texture.
 * To be visible, the GameObject must also have a Transform2D component.
 */
export class Sprite2D extends Renderable2D {
    texture: Texture
    frame?: Frame
    #anchor: Vector2 = new Vector2(0.5, 0.5);
    flipX: boolean = false;
    flipY: boolean = false;
    alpha: number = 1.0;

    target?: GameObject = undefined

    constructor(engine: Engine, texture: Texture) {
        super(engine)
        this.texture = texture
    }

    setAnchor(x: number, y: number): void {
        this.#anchor.x = x
        this.#anchor.y = y
    }

    get anchor() {
        return this.#anchor
    }

    setFrame(x: number, y: number): void {
        this.frame = this.texture.getFrame(x, y)
    }

    setFrameByName(name: string): void {
        this.frame = this.texture.getFrameByName(name)
    }

    render(ctx: CanvasRenderingContext2D): void {

        if (!this.visible || this.alpha <= 0 || !this.texture) return;
        let transform

        if (this.target) {
            transform = (this.target as any).transform2d;
        } else {
            transform = (this as any).transform2d;
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

        // Ordem correta: transladar para a posição mundo → depois escalar/flipar → depois rotacionar
        // (antes: scale era aplicado antes do translate, enviando o sprite para fora da tela com flipX=true)
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