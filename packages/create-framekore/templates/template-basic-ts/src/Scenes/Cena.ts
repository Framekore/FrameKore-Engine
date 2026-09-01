import { Engine, Scene } from "@framekore/core";
import { Player } from "../Objects/Player";
import { Vector2 } from "@framekore/math";
import { Collision } from "../Objects/Collision";
import { RenderManager2D } from "@framekore/render2d";
import { InputManager } from "@framekore/input-manager";

export class Cena extends Scene {
    player: Player
    collision: Collision
    render: RenderManager2D
    input: InputManager
    count = 0

    constructor(engine: Engine) {
        super()
        this.player = new Player(engine, {
            position: new Vector2(400, 350),
            width: 46,
            height: 42
        })
        this.collision = new Collision(engine, {
            position: new Vector2(250, 400),
            width: 300,
            height: 32
        })
        //Define a origem para o canto superior esquerdo
        this.collision.collision.setOrigin(0, 0)

        this.input = InputManager.get(engine)
        this.render = RenderManager2D.get(engine)
    }

    onEnter(): void {
        this.add(this.player)
        this.add(this.collision)
    }

    fixedUpdate(_delta: number): void {
        super.fixedUpdate(_delta)

        //Se estiver no chão e precionar espaço
        if (this.player.body.touching.bottom && this.input.isDown('Space')) {
            this.#handleJump()
        }
    }

    update(delta: number): void {
        super.update(delta)
        this.render.draw(ctx => {
            ctx.fillStyle = '#5151fd'
            ctx.fillRect(
                this.collision.transform.position.x,
                this.collision.transform.position.y,
                this.collision.collision.width,
                this.collision.collision.height
            )
            ctx.fillStyle = 'white'
            ctx.font = '16px arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(
                String(this.count),
                this.collision.transform.position.x + (this.collision.collision.width / 2),
                this.collision.transform.position.y + (this.collision.collision.height / 2)
            )

            ctx.fillStyle = 'black'
            ctx.fillText(
                "Press Space to Jump",
                this.collision.transform.position.x + (this.collision.collision.width / 2),
                this.collision.transform.position.y + (this.collision.collision.height * 2)
            )
        })
    }

    #handleJump() {
        this.player.body.applyForce(new Vector2(0, -500))
        this.count++;
    }
}