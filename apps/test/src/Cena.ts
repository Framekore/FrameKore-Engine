import { Engine, Scene } from "@framekore/core"
import { RenderManager2D } from "@framekore/render2d"
import { Vector2 } from "@framekore/math"
import { Player } from "./Player"
import { Collision as Collision } from "./Collision"

export class Cena extends Scene {
    player!: Player
    walls: Collision[] = []
    render: RenderManager2D

    constructor(engine: Engine) {
        super()
        this.engine = engine
        this.render = RenderManager2D.get(engine)
    }

    onEnter(): void {
        this.player = new Player(this.engine)
        this.player.transform.position = new Vector2(100, 100)
        this.add(this.player)
        const topWall = new Collision(this.engine, {
            position: new Vector2(100, 150),
            width: 300,
            height: 32
        })
        const sideWall = new Collision(this.engine, {
            position: new Vector2(400, 200),
            width: 32,
            height: 200
        })

        this.walls.push(topWall, sideWall)
        this.add(topWall)
        this.add(sideWall)
    }

    update(delta: number): void {
        super.update(delta)
        this.render.draw(ctx => {
            ctx.fillStyle = '#00ff00'
            ctx.fillRect(
                this.player.transform.position.x,
                this.player.transform.position.y,
                this.player.collider.width,
                this.player.collider.height
            )

            ctx.fillStyle = '#ff0000'
            for (const wall of this.walls) {
                ctx.fillRect(
                    wall.transform.position.x,
                    wall.transform.position.y,
                    wall.collider.width,
                    wall.collider.height
                )
            }
        })
        
    }
}