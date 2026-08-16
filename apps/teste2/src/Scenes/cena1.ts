import { Scene, Engine } from "@framekore/core"
import { Player } from "../Entities/player"
import { AssetManager } from "@framekore/asset-manager"
import { Texture } from "@framekore/render2d"
import playerImage from "../assets/kore.png"

export class Cena1 extends Scene {
    constructor(engine: Engine) {
        super()
        this.engine = engine
        
        // Carrega o asset de imagem primeiro
        const assets = AssetManager.get(engine)
        assets.load('player', 'image', playerImage).then((img) => {
            // Cria a textura e faz o slice
            const texture = new Texture(img)
            texture.slice(23, 21)
            
            // Passa a textura pronta para o Player!
            const player = new Player(engine, texture)
            this.add(player)
        })

    }
    update(delta: number): void {
        super.update(delta)

    }
}