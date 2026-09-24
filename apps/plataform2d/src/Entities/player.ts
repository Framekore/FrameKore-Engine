import { AssetManager } from "@framekore/asset-manager"
import { GameObject, Engine } from "@framekore/core"
import { InputManager } from "@framekore/input-manager"
import { Vector2 } from "@framekore/math"
import { RIGID_BODY_2D, RigidBody2D, BoxCollide2D, CollisionLayer } from "@framekore/physics2d"
import { Texture, Sprite2D } from "@framekore/render2d"
import { Transform2D, TRANSFORM_2D } from "@framekore/transform2d"

export class Player extends GameObject {
    input: InputManager
    constrols: {
        up: boolean,
        left: boolean,
        down: boolean,
        right: boolean
    }
    SPEED = 400
    JUMP_FORCE = 400
    texture: Texture | null = null
    velocity: Vector2 = new Vector2()
    body?: RigidBody2D
    transformer?: Transform2D

    constructor(engine: Engine) {
        super();
        this.engine = engine;
        this.input = InputManager.get(engine)
        this.constrols = {
            up: false,
            left: false,
            down: false,
            right: false
        }

        const assets = AssetManager.get(engine)
        assets.load("player", "image", "/src/assets/kore.png").then((img) => {
            const texture = new Texture(img);
            texture.slice(23, 21);

            const sprite = new Sprite2D(texture);
            sprite.setFrame(0, 0);

            this.addComponent(sprite);
        });
        const transform = new Transform2D()
        transform.scale.x = 2
        transform.scale.y = 2
        this.addComponent(transform);
        this.addComponent(new RigidBody2D());
        this.addComponent(new BoxCollide2D(23, 21, {
            layer: CollisionLayer.Layer2,
            mask: CollisionLayer.Layer1
        }));
    }
    update(_delta: number): void {
        super.update(_delta)
        this.constrols = {
            up: this.input.isDown('KeyW'),
            left: this.input.isDown('KeyA'),
            down: this.input.isDown('KeyS'),
            right: this.input.isDown('KeyD')
        }
    }
    fixedUpdate(delta: number): void {
        super.fixedUpdate(delta)
        this.transformer = this.getComponent<Transform2D>(TRANSFORM_2D)
        this.body = this.getComponent<RigidBody2D>(RIGID_BODY_2D)
        const dir = new Vector2(
            (Number(this.constrols.right) - Number(this.constrols.left))
        )
        this.velocity = Vector2.mul(dir.normalize(), this.SPEED * delta)
        this.transformer?.position.add(this.velocity)
        if (this.body?.touching.bottom && this.constrols.up) {
            this.#jump()
        }
    }

    #jump() {
        if (!this.body) return
        if (!this.body.touching.bottom) return

        this.body.applyForce(0, -this.JUMP_FORCE)
    }

}