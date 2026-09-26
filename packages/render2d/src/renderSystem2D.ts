import { Engine, definePlugin } from "@framekore/core";
import { Renderable2D } from "./renderable2D";

/**
 * Options required to initialize the RenderSystem2D plugin.
 */
export interface RenderSystem2DOptions {
    /** The HTML canvas element used for 2D rendering. */
    canvas: HTMLCanvasElement;
    /** Enables or disables image smoothing (anti-aliasing). Set to `false` for pixel art. Default is `false`. */
    pixelArt?: boolean;
    /** Background color used when clearing the viewport. If omitted, the canvas is cleared to transparent. */
    backgroundColor?: string;
}

/**
 * Subsystem responsible for managing canvas context state and orchestrating 
 * frame-by-frame rendering for all `Renderable2D` components attached to active GameObjects.
 */
export class RenderSystem2D {
    /** Unique static symbol key identifying this resource within the engine core. */
    static readonly key = Symbol.for("@framekore/render2d/RenderSystem2D");

    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;

    /** Background color for viewport clearing (e.g., "#000000"). */
    public backgroundColor?: string;

    private renderables = new Set<Renderable2D>();

    /**
     * Creates a new RenderSystem2D instance.
     * @param options - Configuration options for canvas context and rendering style.
     * @throws Error if the 2D rendering context cannot be retrieved from the canvas.
     */
    constructor(options: RenderSystem2DOptions) {
        this.canvas = options.canvas;

        const ctx = this.canvas.getContext("2d");
        if (!ctx) {
            throw new Error("RenderSystem2D: Failed to obtain 2D rendering context from canvas.");
        }

        this.ctx = ctx;
        this.backgroundColor = options.backgroundColor;

        const disableSmoothing = options.pixelArt ?? true;
        if (disableSmoothing) {
            this.ctx.imageSmoothingEnabled = false;
        }
    }

    /**
     * Registers a renderable component to be processed during the render loop.
     * @param renderable - Component instance inheriting from Renderable2D.
     */
    register(renderable: Renderable2D): void {
        this.renderables.add(renderable);
    }

    /**
     * Unregisters a renderable component from the render loop.
     * @param renderable - Component instance to remove.
     */
    unregister(renderable: Renderable2D): void {
        this.renderables.delete(renderable);
    }

    /**
     * Clears the viewport and renders all registered components ordered by `zIndex`.
     */
    render(): void {
        // 1. Clear the canvas
        if (this.backgroundColor) {
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // 2. Filter out destroyed or non-visible components and sort by zIndex
        const queue = Array.from(this.renderables)
            .filter((r) => r.visible && r.gameObject && !r.gameObject.destroyed)
            .sort((a, b) => a.zIndex - b.zIndex);

        // 3. Dispatch render to each component in order
        for (const renderable of queue) {
            renderable.render(this.ctx);
        }
    }
}

/**
 * Creates a RenderSystem2D plugin for the Engine.
 * Registers event listeners for automatic component tracking and attaches the render loop phase.
 * @param options - Configuration settings for the render system.
 * @returns An EnginePlugin definition to pass to `engine.use()`.
 * @example
 * engine.use(render2D({ canvas: document.querySelector('canvas')! }));
 */
export const render2D = (options: RenderSystem2DOptions) =>
    definePlugin(() => ({
        name: "render2d",
        setup(engine: Engine) {
            const system = new RenderSystem2D(options);
            engine.setResource(RenderSystem2D, system);

            // Listen for component lifecycle hooks emitted by Engine
            engine.onComponentAdded((component) => {
                if (component instanceof Renderable2D) {
                    system.register(component);
                }
            });

            engine.onComponentRemoved((component) => {
                if (component instanceof Renderable2D) {
                    system.unregister(component);
                }
            });

            // Hook render execution into engine's render step
            engine.onRender(() => {
                system.render();
            });
        },
    }));