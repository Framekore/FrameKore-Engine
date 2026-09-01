import { Engine, GameObject } from "@framekore/core";
import { BoxCollide2D, CollisionLayer, RigidBody2D } from "@framekore/physics2d";
import { Sprite2D, Texture } from "@framekore/render2d";
import { Transform2D } from "@framekore/transform2d";
import { Vector2 } from "@framekore/math";
import { InputManager } from "@framekore/input-manager";

export class Player extends GameObject {
    transform: Transform2D;
    collider: BoxCollide2D;
    body: RigidBody2D;
    sprite?: Sprite2D;

    SPEED: number = 200;

    constructor(engine: Engine, texture?: Texture) {
        super();
        this.engine = engine;

        this.transform = new Transform2D();
        this.addComponent(this.transform);
        
        this.body = new RigidBody2D();
        this.body.useGravity = false
        this.addComponent(this.body);
        
        this.collider = new BoxCollide2D(30, 30, {
            layer: CollisionLayer.Layer1,
            mask: CollisionLayer.Layer2
        });
        this.collider.setOrigin(0,0)
        this.addComponent(this.collider);

        if (texture) {
            this.sprite = new Sprite2D(texture);
            this.addComponent(this.sprite);
        }
    }

    update(_delta: number): void {
        super.update(_delta);

        if (!this.engine) return;

        const input = InputManager.get(this.engine);
        const direction = new Vector2(0, 0);

        if (input.isDown('KeyW')) direction.y -= 1;
        if (input.isDown('KeyS')) direction.y += 1;
        if (input.isDown('KeyA')) direction.x -= 1;
        if (input.isDown('KeyD')) direction.x += 1;

        if (direction.x !== 0 || direction.y !== 0) {
            const normalized = direction.normalize();
            this.body.velocity.x = normalized.x * this.SPEED;
            this.body.velocity.y = normalized.y * this.SPEED;
        } else {
            this.body.velocity.x = 0;
            this.body.velocity.y = 0;
        }
    }
}