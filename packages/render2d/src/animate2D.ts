import { Component } from "@framekore/core";
import { AnimatedSprite2D } from "./animatedSprite2D";

/**
 * State machine component that manages multiple `AnimatedSprite2D` instances.
 * Handles switching between named animation clips and delegates update and render cycles.
 */
export class Animator2D extends Component {
    /** Unique static symbol key identifying this component type within the engine core. */
    static readonly key = Symbol.for("@framekore/render2d/Animator2D");

    private animations = new Map<string, AnimatedSprite2D>();
    private currentName?: string;

    /** Gets the currently active `AnimatedSprite2D` instance, or undefined if none is playing. */
    get current(): AnimatedSprite2D | undefined {
        if (!this.currentName) return undefined;
        return this.animations.get(this.currentName);
    }

    /**
     * Registers a named animation clip.
     * @param name - Unique string identifier for the animation clip.
     * @param animation - The AnimatedSprite2D instance to register.
     * @example
     * animator.add("run", playerRunAnimation);
     */
    add(name: string, animation: AnimatedSprite2D): void {
        animation.gameObject = this.gameObject;
        this.animations.set(name, animation);
    }

    /**
     * Transitions playback to the specified animation clip.
     * @param name - Unique string identifier of the target animation.
     * @param restartOnSame - If true, forces the animation to restart even if already active. Defaults to false.
     * @example
     * animator.play("run");
     */
    play(name: string, restartOnSame: boolean = false): void {
        if (this.currentName === name && !restartOnSame) return;

        const nextAnimation = this.animations.get(name);
        if (!nextAnimation) {
            console.warn(`Animator2D: Animation "${name}" was not found.`);
            return;
        }

        this.currentName = name;
        nextAnimation.gameObject = this.gameObject;
        nextAnimation.reset();
        nextAnimation.play();
    }

    /**
     * Propagates update cycle execution to the active animation clip.
     * @param delta - Time elapsed since the last frame in seconds.
     */
    override update(delta: number): void {
        this.current?.update(delta);
    }

    /**
     * Renders the active animation clip to the Canvas 2D context.
     * @param ctx - Target CanvasRenderingContext2D instance.
     */
    render(ctx: CanvasRenderingContext2D): void {
        this.current?.render(ctx);
    }
}