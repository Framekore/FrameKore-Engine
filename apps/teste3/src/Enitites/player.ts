import { CollisionLayer, RigidBody2D } from "@framekore/physics2d";
import { Collision, type CollisionOptions } from "./Collision";
import { Engine } from "@framekore/core";
import { AssetManager } from '@framekore/asset-manager'
import player from "../assets/pants.png"
import { AnimatedSprite2D, Texture } from "@framekore/render2d";
import { InputManager } from "@framekore/input-manager";
import { Animator2D } from "./Animator2D";

export class Player extends Collision {
    body: RigidBody2D
    assets: AssetManager
    animator: Animator2D
    keys: InputManager

    SPEED = 200
    JUMP_FORCE = 400

    controls = {
        up: "KeyW",
        left: "KeyA",
        down: "KeyS",
        right: "KeyD",
        confirm: "Enter",
        jump: "Space"
    }
    key = {
        up: 0,
        left: 0,
        down: 0,
        right: 0,
        confirm: 0,
        jump: 0
    }

    constructor(engine: Engine, options: CollisionOptions) {
        super(engine, options)
        this.body = new RigidBody2D()
        this.addComponent(this.body)


        this.keys = InputManager.get(engine)
        this.assets = AssetManager.get(engine)
        this.animator = new Animator2D()
        
        this.assets.load("player", "image", player).then((img) => {
            
            const texture = new Texture(img)
            texture.slice(37, 27)
            
            const playerRun = new AnimatedSprite2D(texture);
            playerRun.gameObject = this

            playerRun.addFrame(0, 0)
            playerRun.addFrame(1, 0)
            playerRun.addFrame(0, 1)
            playerRun.addFrame(1, 1)
            playerRun.setAnchor(.5, .5)

            playerRun.fps = 10
            playerRun.flipX=true
            this.addComponent(playerRun)  
            playerRun.play()
        })
        
        
        this.transform.scale.x = 1
        this.transform.scale.y = 1


        this.collision.setOrigin(.5, .5)
        this.collision.layer = CollisionLayer.Layer2
        this.collision.mask = CollisionLayer.Layer1 | CollisionLayer.Layer2
        // this.body.useGravity = false
    }

    update(delta: number): void {
        super.update(delta)
        this.key.up = Number(this.keys.isJustDown(this.controls.up))
        this.key.left = Number(this.keys.isDown(this.controls.left))
        this.key.down = Number(this.keys.isDown(this.controls.down))
        this.key.right = Number(this.keys.isDown(this.controls.right))
    }

    fixedUpdate(delta: number): void {
        super.fixedUpdate(delta)
        const hspd = (this.key.right - this.key.left) * this.SPEED
        
        this.body.velocity.x = hspd
        if (this.key.up && this.body.touching.bottom) {
            this.#handleJump()
            this.key.jump = 0;
        }
    }

    #handleJump() {
        this.body.applyForce(0, -this.JUMP_FORCE)
    }

}