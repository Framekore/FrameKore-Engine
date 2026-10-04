// OLD: has-based type narrowing interfaces (removed — agora usamos instanceof)
// import { GameObject } from "@framekore/core"
// import { AnimatedSprite2D } from "./animatedSprite2D"
// import { Sprite2D } from "./sprite2D"
// import { Camera2D } from "./camera2d"
//
// export function hasSprite2D(obj: GameObject): obj is GameObject & { sprite: Sprite2D } {
//     return "sprite" in obj && obj.sprite instanceof Sprite2D
// }
// export function hasCamera2D(obj: GameObject): obj is GameObject & { camera: Camera2D } {
//     return "camera" in obj && obj.camera instanceof Camera2D
// }

export * from "./animator2d"
export * from "./animatedSprite2D"
export * from "./renderable2D"
export * from "./renderManager2d"
export * from "./sprite2D"
export * from "./texture"
export * from "./camera2d"

export interface Renderable {
    render(ctx: CanvasRenderingContext2D): void
}