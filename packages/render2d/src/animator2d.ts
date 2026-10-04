import { Engine } from "@framekore/core";
import { AnimatedSprite2D } from "./animatedSprite2D";
import { Sprite2D } from "./sprite2D";
import { Renderable2D } from "./renderable2D";

/**
 * A state-machine-like component that manages multiple AnimatedSprite2D instances,
 * switching between them by name. Only the active animation is updated and rendered.
 *
 * @example
 * const animator = new Animator2D(engine);
 * animator.add("idle", idleAnim);
 * animator.add("run", runAnim);
 * animator.play("idle");
 *
 * // In game loop:
 * animator.update(delta);
 */
export class Animator2D extends Renderable2D {
    #animations = new Map<string, AnimatedSprite2D | Sprite2D>();
    #current: AnimatedSprite2D | Sprite2D | null = null;
    #currentName: string | null = null;

    /** Se true, inverte a animação atual horizontalmente */
    flipX: boolean = false;
    
    /** Se true, inverte a animação atual verticalmente */
    flipY: boolean = false;

    constructor(engine: Engine) {
        super(engine);
    }

    /**
     * Registers an animation or a static sprite under a given name.
     * @param name - The string key to identify this state.
     * @param animation - The AnimatedSprite2D or Sprite2D instance to associate with the name.
     */
    add(name: string, animation: AnimatedSprite2D | Sprite2D): void {
        this.#animations.set(name, animation);
    }

    /**
     * Switches to the animation with the given name.
     * If the animation is already playing, it does nothing.
     * The previous animation is stopped before the new one starts.
     * @param name - The name of the animation to play.
     */
    play(name: string): void {
        if (this.#currentName === name) return;

        const anim = this.#animations.get(name);
        if (!anim) return;

        if (this.#current && this.#current instanceof AnimatedSprite2D) {
            this.#current.stop();
        }
        
        this.#current = anim;
        this.#currentName = name;
        
        if (this.#current instanceof AnimatedSprite2D) {
            this.#current.play();
        }
    }

    /**
     * Stops the currently playing animation.
     */
    stop(): void {
        if (this.#current && this.#current instanceof AnimatedSprite2D) {
            this.#current.stop();
        }
    }

    /**
     * The name of the currently active animation, or null if none is playing.
     */
    get currentAnimation(): string | null {
        return this.#currentName;
    }

    /**
     * Updates the active animation's frame timer. Should be called every frame.
     * @param delta - Time elapsed since the last frame in seconds.
     */
    update(delta: number): void {
        if (this.#current && this.#current instanceof AnimatedSprite2D) {
            this.#current.update(delta);
        }
    }

    /**
     * Delegates rendering to the currently active AnimatedSprite2D.
     * Called automatically by the RenderManager2D.
     * @param ctx - The canvas 2D rendering context.
     */
    render(ctx: CanvasRenderingContext2D): void {
        if (!this.visible || !this.#current) return;
        
        this.#current.flipX = this.flipX;
        this.#current.flipY = this.flipY;
        
        this.#current.render(ctx);
    }
}
