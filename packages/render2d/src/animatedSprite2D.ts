import { Sprite2D } from "./sprite2D";
import type { Frame } from "./texture";

/**
 * Component for rendering animated sprites from a spritesheet.
 * Extends Sprite2D to manage time-based frame swapping.
 */
export class AnimatedSprite2D extends Sprite2D {
    /** @internal List of frames making up the current animation sequence. */
    #frames: Frame[] = [];
    /** @internal Index of the currently displayed frame in the sequence. */
    #currentFrame = 0;
    /** @internal Accumulated time since the last frame swap. */
    #elapsed = 0;
    

    /** 
     * Animation playback speed in Frames Per Second. 
     * Default is 10.
     * @example
     * animatedSprite.fps = 24; // Smooth animation
     */
    fps = 10;

    /** 
     * Determines whether the animation is currently progressing.
     * If false, the animation stays on the current frame.
     */
    #playing = false;

    /** Determines whether the animation loops when reaching the last frame. */
    loop = true

    /**
     * Appends a new frame to the animation sequence based on texture grid coordinates.
     * The texture must have been previously sliced into a grid.
     * @param x - The column index (0-based) on the texture grid.
     * @param y - The row index (0-based) on the texture grid.
     * @example
     * animatedSprite.addFrame(0, 0);
     * animatedSprite.addFrame(1, 0);
     * animatedSprite.addFrame(2, 0);
     */
    addFrame(x: number, y: number): void {
        const frame = this.texture.getFrame(x, y);
        if (frame) {
            this.#frames.push(frame);
            // Set the first added frame as the current visual frame
            if (this.#frames.length === 1) 
                this.frame = frame;
        }
    }

    reset(): void {
        this.#currentFrame = 0;
        this.#elapsed = 0;
        if (this.#frames.length > 0) {
            this.frame = this.#frames[0];
        }
    }

    
    /**
     * Starts or resumes the animation playback.
     * @example animatedSprite.play();
    */
    play(): void {
       this.#playing = true;
    }

    /**
     * Pauses the animation on its current frame.
     * @example animatedSprite.stop();
    */
    stop(): void {
       this.#playing = false;
    }

    /**
     * Manually forces the animation to display a specific frame from its internal sequence list.
     * Resets the elapsed time timer to ensure full frame duration.
     * @param index - The index of the frame within the `#frames` array (not the texture grid).
     * @example
     * // Jump to the third frame added to the animation sequence
     * animatedSprite.setFrame(2);
    */
    setFrame(index: number): void {
        if (index >= 0 && index < this.#frames.length) {
            this.#currentFrame = index;
            this.frame = this.#frames[index];
            this.#elapsed = 0;
        }
    }
    /**
     * Updates the internal timer accumulator and advances frames according to delta time.
     * @param delta - Time elapsed since the last frame in seconds.
     */
    update(delta: number): void {
        if (!this.#playing || this.#frames.length <= 1) return;

        this.#elapsed += delta;
        const frameDuration = 1 / this.fps;

        while (this.#elapsed >= frameDuration) {
            this.#elapsed -= frameDuration;

            if (this.#currentFrame < this.#frames.length - 1) {
                this.#currentFrame++;
            } else if (this.loop) {
                this.#currentFrame = 0;
            } else {
                this.#playing = false;
                break;
            }
        }

        this.frame = this.#frames[this.#currentFrame];
    }
}