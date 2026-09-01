import { Engine, GameObject } from "@framekore/core";
import { BoxCollide2D, CollisionLayer } from "@framekore/physics2d";
import { Transform2D } from '@framekore/transform2d'
import { Vector2 } from '@framekore/math'

/**
 * @typedef {Object} CollisionOptions
 * @property {number} [width=32] - Largura opcional do retalho de colisão.
 * @property {number} [height=32] - Altura opcional do retalho de colisão.
 * @property {Vector2} position - Posição inicial no espaço 2D.
 */
export class Collision extends GameObject {

    /**
     * @param {Engine} engine
     * @param {CollisionOptions} options
     */
    constructor(engine, options) {
        super()
        this.engine = engine

        const width = options.width ?? 32
        const height = options.height ?? 32

        this.transform = new Transform2D()
        this.addComponent(this.transform)
        this.transform.position = options.position

        this.collision = new BoxCollide2D(width, height, {
            layer: CollisionLayer.Layer1,
            mask: CollisionLayer.Layer2
        })
        this.addComponent(this.collision)

    }
}