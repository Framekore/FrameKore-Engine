import { GameObject } from "@framekore/core";

/**
 * Abstract base class for all 2D objects that can be drawn to the canvas.
 *
 * Extend this class to create custom renderable components. Any subclass
 * is automatically collected by the {@link RenderManager2D} each frame and
 * drawn in ascending `zIndex` order (lower = behind, higher = in front).
 *
 * A concrete subclass must implement the {@link render} method, which
 * receives the `CanvasRenderingContext2D` and is responsible for issuing
 * all draw calls for that object.
 *
 * @example
 * class MyShape extends Renderable2D {
 *   render(ctx: CanvasRenderingContext2D): void {
 *     ctx.fillStyle = "red";
 *     ctx.fillRect(0, 0, 32, 32);
 *   }
 * }
 *
 * const shape = new MyShape(engine);
 * shape.zIndex = 5; // drawn in front of objects with lower zIndex
 * scene.add(shape);
 */
export abstract class Renderable2D extends GameObject {
  /**
   * Controls whether this object participates in the render pass.
   * When `false`, the `RenderManager2D` skips this object entirely —
   * its {@link render} method is never called.
   *
   * @default true
   */
  public visible: boolean = true;

  /**
   * Depth ordering value used to sort draw calls each frame.
   *
   * Objects with a **lower** `zIndex` are drawn first (appear behind).
   * Objects with a **higher** `zIndex` are drawn last (appear in front).
   * Use negative values to place this object behind all default-layer sprites.
   *
   * @default 0
   * @example
   * background.zIndex = -10; // behind everything
   * player.zIndex = 0;       // default layer
   * hud.zIndex = 100;        // in front of everything
   */
  public zIndex: number = 0;

  /**
   * Draw this object onto the canvas.
   *
   * Called by the {@link RenderManager2D} render pipeline every frame,
   * **only** when {@link visible} is `true`. The canvas transform is
   * already set to world space (camera applied), so all draw operations
   * happen in world coordinates.
   *
   * @param ctx - The canvas 2D rendering context to draw into.
   */
  abstract render(ctx: CanvasRenderingContext2D): void;
}