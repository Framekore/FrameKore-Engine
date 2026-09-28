/**
 * Represents a rectangular region within a Texture, typically used for spritesheets.
 */
export type Frame = { 
    /** X coordinate in pixels from the top-left of the image. */
    x: number, 
    /** Y coordinate in pixels from the top-left of the image. */
    y: number, 
    /** Width of the frame in pixels. */
    width: number, 
    /** Height of the frame in pixels. */
    height: number
}

/**
 * Wrapper class around an HTML image or canvas element.
 * It provides utilities to slice a spritesheet into frames.
 */
export class Texture {
    /** 
     * The raw image or canvas source data. 
     */
    readonly image: HTMLCanvasElement | HTMLImageElement

    #frames: Map<string, Frame> = new Map()
    #namedFrames: Map<string, Frame> = new Map()

    /**
     * Creates a new Texture instance.
     * @param source - The HTMLImageElement or HTMLCanvasElement to wrap.
     */
    constructor(source: HTMLImageElement | HTMLCanvasElement) {
        this.image = source
    }
    
    /**
     * Slices the image (spritesheet) into a grid of uniform frames.
     * This allows you to retrieve specific frames using grid coordinates via `getFrame(col, row)`.
     * @param frameW - The width of each individual frame in pixels.
     * @param frameH - The height of each individual frame in pixels.
     * @example
     * const texture = new Texture(spritesheetImage);
     * texture.slice(32, 32); // Slices the image into 32x32 tiles
     */
    slice(frameW: number, frameH: number): void {
        const cols = Math.floor(this.image.width / frameW)
        const rows = Math.floor(this.image.height / frameH)

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                this.#frames.set(`${j}-${i}`,
                    {
                        x: j * frameW,
                        y: i * frameH,
                        width: frameW,
                        height: frameH
                    }
                )
            }
        }
    }

    get width(): number {
        return this.image.width
    }

    get height(): number {
        return this.image.height
    }
    
    /**
     * Retrieves a frame by its grid coordinates (column, row).
     * The texture must be sliced using `slice()` beforehand.
     * @param x - The column index (0-based).
     * @param y - The row index (0-based).
     * @returns The corresponding Frame object, or undefined if it doesn't exist.
     * @example
     * const frame = texture.getFrame(1, 0); // gets the second frame on the top row
     */
    getFrame(x: number, y: number): Frame | undefined {
        return this.#frames.get(`${x}-${y}`)
    }

    /**
     * Assigns a custom string alias to a specific grid coordinate frame.
     * Makes it easier to retrieve frames using descriptive names.
     * @param name - The custom alias to assign.
     * @param x - The column index (0-based) on the grid.
     * @param y - The row index (0-based) on the grid.
     * @example
     * texture.define("player_run_1", 0, 1);
     */
    define(name: string, x: number, y: number): void {
        const frame = this.getFrame(x, y)
        if (!frame) return
        this.#namedFrames.set(name, frame)
    }
    
    /**
     * Retrieves a frame by its defined alias name.
     * The frame must have been aliased using `define()` beforehand.
     * @param name - The custom alnão consegue deletar a propria ias name.
     * @returns The Frame object, or undefined if not found.
     * @example
     * const runFrame = texture.getFrameByName("player_run_1");
     */
    getFrameByName(name: string): Frame | undefined {
        return this.#namedFrames.get(name)
    }
}
