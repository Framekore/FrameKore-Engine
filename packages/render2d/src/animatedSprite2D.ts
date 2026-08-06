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
    playing = true;

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
            if (this.#frames.length === 1) this.frame = frame;
        }
    }

    /**
     * Updates the animation state based on elapsed time.
     * Typically called internally by the engine's update loop or by a custom component.
     * @param delta - Time elapsed since the last frame update (in seconds).
     */
    update(delta: number): void {
        if (!this.playing || this.#frames.length === 0) return;

        this.#elapsed += delta;
        const frameDuration = 1 / this.fps;

        // Loop to handle cases where delta is larger than frame duration (catch-up)
        while (this.#elapsed >= frameDuration) {
            this.#elapsed -= frameDuration;
            this.#currentFrame = (this.#currentFrame + 1) % this.#frames.length;
            this.frame = this.#frames[this.#currentFrame];
        }
    }

    /**
     * Starts or resumes the animation playback.
     * @example animatedSprite.play();
     */
    play(): void {
        this.playing = true;
    }

    /**
     * Pauses the animation on its current frame.
     * @example animatedSprite.stop();
     */
    stop(): void {
        this.playing = false;
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
}