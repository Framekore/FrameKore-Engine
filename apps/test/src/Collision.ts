import { Engine, GameObject } from "@framekore/core"
import { Transform2D } from "@framekore/transform2d"
import { BoxCollide2D, CollisionLayer } from "@framekore/physics2d"
import { Vector2 } from "@framekore/math"

export interface CollisionOptions {
    position?: Vector2
    width?: number
    height?: number
    isTrigger?: boolean
}

export class Collision extends GameObject {
    transform: Transform2D
    collider: BoxCollide2D

    constructor(engine: Engine, options: CollisionOptions = {}) {
        super()
        this.engine = engine

        const width = options.width ?? 30
        const height = options.height ?? 30

        this.transform = new Transform2D()

        if (options.position) {
            this.transform.position = options.position
        }
        this.addComponent(this.transform)

        this.collider = new BoxCollide2D(width, height, {
            layer: CollisionLayer.Layer2,
            mask: CollisionLayer.Layer1
        })
        this.collider.setOrigin(0, 0)

        if (options.isTrigger !== undefined) {
            this.collider.isTrigger = options.isTrigger
        }
        this.addComponent(this.collider)
    }
}