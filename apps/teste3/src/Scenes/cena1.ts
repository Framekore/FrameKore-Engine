import { Engine, Scene } from "@framekore/core";
import { Player } from "../Enitites/player";
import { Vector2 } from "@framekore/math";
import { RenderManager2D } from "@framekore/render2d";
import { Collision } from "../Enitites/Collision";

export class Cena extends Scene {

    player: Player
    collisions: Collision[] = []
    render: RenderManager2D

    constructor(engine: Engine) {
        super(engine)
        this.engine = engine
        this.player = new Player(engine, {
            position: new Vector2(300, 300),
            width: 37,
            height: 27
        })
        this.add(this.player)

        const col1 = new Collision(engine, {
            position: new Vector2(400, 400),
            width: 400,
            height: 32
        })
        const col2 = new Collision(engine, {
            position: new Vector2(300, 400-32),
            width: 32,
            height: 32
        })
        const col3 = new Collision(engine, {
            position: new Vector2(400, 400-(64+20)),
            width: 32,
            height: 32
        })
        this.collisions.push(col1, col2, col3, this.player)
        this.add(col1)
        this.add(col2)
        this.add(col3)
        this.render = RenderManager2D.get(engine)
    }

    fixedUpdate(_delta: number): void {
        super.fixedUpdate(_delta)
        this.render.draw((ctx) => {
            ctx.fillStyle = '#000'
            for(const col of this.collisions) {
                ctx.strokeRect(
                    col.transform.position.x - (col.collision.width)/2,
                    col.transform.position.y - (col.collision.height)/2,
                    col.collision.width,
                    col.collision.height
                )
            }
        })

    }
    
}