import { CollisionLayer, RigidBody2D } from "@framekore/physics2d";
import { Collision } from "./Collision";
import { Engine } from "@framekore/core";
import { AssetManager } from '@framekore/asset-manager'
import mascote from "../assets/mascote.png"
import { Sprite2D, Texture } from "@framekore/render2d";

/**
 * @typedef {Object} PlayerOptions
 * @property {number} [width=32] - Largura opcional do retalho de colisão.
 * @property {number} [height=32] - Altura opcional do retalho de colisão.
 * @property {Vector2} position - Posição inicial no espaço 2D.
 */
export class Player extends Collision {

    /**
     * @param {Engine} engine
     * @param {PlayerOptions} options
     */
    constructor(engine, options) {
        super(engine, options)
        this.body = new RigidBody2D()
        this.addComponent(this.body)

        this.assets = AssetManager.get(engine)

        this.assets.load("player", "image", mascote).then((img) => {
            const texture = new Texture(img)
            texture.slice(46, 42)
            const sprite = new Sprite2D(texture)
            sprite.setFrame(0, 0)
            this.addComponent(sprite)
        })
        this.transform.scale.x = 1
        this.transform.scale.y = 1
        // this.body.useGravity = false

        //Local onde está o Objeto
        this.collision.layer = CollisionLayer.Layer2
        //Local onde o Objeto colide
        this.collision.mask = CollisionLayer.Layer1
    }

    
}