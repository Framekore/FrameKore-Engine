import { Engine, GameObject, Scene } from "@framekore/core";
import { Player } from "../Entities/player";
import { Collision } from "../Entities/collision";
import { NPC } from "../Entities/npc";
import { Vector2 } from "@framekore/math";
import { RenderManager2D, SPRITE_2D } from "@framekore/render2d";
import { Transform2D, TRANSFORM_2D } from "@framekore/transform2d";
import { BOX_COLLIDE_2D, type BoxCollide2D } from "@framekore/physics2d";

export class Cena extends Scene {
    engine: Engine
    render: RenderManager2D
    constructor(engine: Engine) {
        super()
        this.engine = engine
        this.render = RenderManager2D.get(this.engine)
    }
    onEnter(): void {
        const player = new Player(this.engine)
        const cameraObj = new GameObject()
        cameraObj.engine = this.engine
        const camera = new Camera2D()
        camera.deadZoneWidth = 400
        camera.deadZoneHeight = 400
        camera.target = player
        camera.followSpeed = 8
        camera.worldBounds = {
            x: 0,
            y: 0,
            width: 2000,
            height: 2000
        }
        cameraObj.addComponent(camera)
        cameraObj.addComponent(new Transform2D())
        const npc = new NPC(this.engine)
        const paredeLeft = new Collision({
            engine: this.engine,
            width: 32,
            height: 800,
            position: new Vector2(0, 0)
        })
        const paredeUp = new Collision({
            engine: this.engine,
            width: 800,
            height: 32,
            position: new Vector2(0, 0)
        })
        const paredeRight = new Collision({
            engine: this.engine,
            width: 32,
            height: 800,
            position: new Vector2(this.render.canvas.width - 32, 0)
        })
        this.add(paredeLeft)
        this.add(paredeUp)
        this.add(paredeRight)
        this.add(npc)
        this.add(player)
        this.add(cameraObj)
    }
    update(delta: number): void {
        super.update(delta)
        const objs = this.getObjects()

        for (const obj of objs) {
            const transformer = obj.getComponent<Transform2D>(TRANSFORM_2D)
            const box = obj.getComponent<BoxCollide2D>(BOX_COLLIDE_2D)
            const sprite = obj.hasComponent(SPRITE_2D)
            if (!transformer || !box || sprite)
                return
            this.render.draw((ctx) => {
                ctx.fillStyle = 'black'
                ctx.fillRect(
                    transformer.position.x,
                    transformer.position.y,
                    box.width * transformer.scale.x,
                    box.height * transformer.scale.y
                )
            })
            this.render.drawScreen((ctx) => {
                ctx.fillStyle = 'black'
                ctx.fillText("barra de vida", 100,100)
            })
        }
    }
}