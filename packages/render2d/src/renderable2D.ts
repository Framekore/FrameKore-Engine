import { Component } from "@framekore/core";

export abstract class Renderable2D extends Component {
  public visible: boolean = true;
  public zIndex: number = 0;

  /**
   * Método abstrato executado pelo pipeline de renderização do Render2D.
   */
  abstract render(ctx: CanvasRenderingContext2D): void;
}