import { CollisionLayer, RigidBody2D } from "@framekore/physics2d";
import { Collision, type CollisionOptions } from "./Collision";
import { Engine } from "@framekore/core";
import { AssetManager } from '@framekore/asset-manager'
import player from "../assets/pants.png"
import { AnimatedSprite2D, Animator2D, Renderable, Sprite2D, Texture } from "@framekore/render2d";
import { InputManager } from "@framekore/input-manager";

export class Player extends Collision implements Renderable {
    rigidBody2d: RigidBody2D
    assets: AssetManager
    keys: InputManager
    animator: Animator2D;

    SPEED = 200
    JUMP_FORCE = 450

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
        this.rigidBody2d = new RigidBody2D(this)

        this.keys = InputManager.get(engine)
        this.assets = AssetManager.get(engine)
        this.animator = new Animator2D(engine)

        this.assets.load("player", "image", player).then((img) => {

            const texture = new Texture(img)
            texture.slice(37, 27)

            const playerRun = new AnimatedSprite2D(engine, texture);
            playerRun.target = this

            playerRun.addFrame(0, 0)
            playerRun.addFrame(1, 0)
            playerRun.addFrame(0, 1)
            playerRun.addFrame(1, 1)
            playerRun.setAnchor(.5, .5)

            const playerIdle = new Sprite2D(engine, texture);
            playerIdle.target = this
            playerIdle.setFrame(1, 0)
            playerIdle.setAnchor(.5, .5)

            playerRun.fps = 6
            this.animator.add('run', playerRun)
            this.animator.add('idle', playerIdle)
            this.animator.play('idle')
        })
        this.addComponent(this.animator)

        this.transform2d.scale.x = 1
        this.transform2d.scale.y = 1

        this.boxCollide2D.setOrigin(.5, .5)
        this.boxCollide2D.layer = CollisionLayer.Layer2
        this.boxCollide2D.mask = CollisionLayer.Layer1 | CollisionLayer.Layer2
        // this.body.useGravity = false
    }
    render(ctx: CanvasRenderingContext2D): void {
        this.animator.render(ctx)
    }

    update(delta: number): void {
        this.key.up = Number(this.keys.isJustDown(this.controls.up))
        this.key.left = Number(this.keys.isDown(this.controls.left))
        this.key.down = Number(this.keys.isDown(this.controls.down))
        this.key.right = Number(this.keys.isDown(this.controls.right))
    }

    fixedUpdate(delta: number): void {
        const hspd = (this.key.right - this.key.left) * this.SPEED
        if (hspd !== 0) {
            this.animator.play('run')
            this.boxCollide2D.width = 37;
            this.animator.flipX = Math.sign(hspd) > 0 ? false : true
        } else {
            this.animator.play('idle')
            this.boxCollide2D.width = 25;
        }

        this.rigidBody2d.velocity.x = hspd
        if (this.key.up && this.rigidBody2d.touching.bottom) {
            this.#handleJump()
            this.key.jump = 0;
        }
    }

    #handleJump() {
        this.rigidBody2d.applyForce(0, -this.JUMP_FORCE)
    }

}