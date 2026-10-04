import { Engine, GameObject } from "@framekore/core";
import { BoxCollide2D, CollisionLayer } from "@framekore/physics2d";
import { Transform2D } from '@framekore/transform2d'
import { Vector2 } from '@framekore/math'

export interface CollisionOptions {
    width?: number
    height?: number
    position: Vector2
}

export class Collision extends GameObject {
    boxCollide2D: BoxCollide2D;
    transform2d: Transform2D;

    constructor(engine: Engine, options: CollisionOptions) {
        super(engine)
        this.engine = engine

        const width = options.width ?? 32
        const height = options.height ?? 32

        this.transform2d = new Transform2D()
        
        this.transform2d.position = options.position

        this.boxCollide2D = new BoxCollide2D(this, width, height, {
            layer: CollisionLayer.Layer1,
            mask: CollisionLayer.Layer2 | CollisionLayer.Layer1
        })
        this.boxCollide2D.setOrigin(.5, .5)
    }
}