import { GameObject } from "@framekore/core"
import { Transform2D } from "./transform2D"

export * from "./transform2D"
export * from "./contract"

// export interface WithTransform2D {
//     transform2d: Transform2D
// }
// 
// export function hasTransform2D(value: unknown): value is WithTransform2D {
//     return ( typeof value === 'object'
//         && value !== null
//         && value instanceof GameObject 
//         && "transform2d" in value 
//         && value.transform2d instanceof Transform2D)
// } 