export * from "./RigidBody2D"
export * from "./boxCollide2D"
export * from "./physicsManager2D"

// export interface WithBoxCollider {
//     boxCollide2D: BoxCollide2D
// }
// 
// export function hasBoxCollider(value: unknown): value is WithBoxCollider {
//     return ( typeof value === 'object'
//         && value !== null
//         && value instanceof GameObject 
//         && "boxCollide2D" in value 
//         && value.boxCollide2D instanceof BoxCollide2D)
// } 
// 
// export interface WithRigidBody {
//     rigidBody2d: RigidBody2D
// }
// 
// export function hasRigidBody(value: unknown): value is WithRigidBody {
//     return ( typeof value === 'object'
//         && value !== null
//         && value instanceof GameObject 
//         && "rigidBody2d" in value 
//         && value.rigidBody2d instanceof RigidBody2D)
// } 

// export interface Player extends WithBoxCollider, WithRigidBody, WithTransform2D {

// }