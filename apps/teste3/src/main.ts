
import { Engine } from "@framekore/core";
import { Cena } from "./Scenes/cena1";
import { inputPlugin } from "@framekore/input-manager";
import { render2d } from "@framekore/render2d";
import { physics2d } from "@framekore/physics2d";
import { assetManager } from "@framekore/asset-manager";

const canvas = document.createElement('canvas') as HTMLCanvasElement
document.body.append(canvas)
canvas.width = 800
canvas.height = 800

const engine = new Engine()
    .use(inputPlugin())
    .use(render2d(canvas))
    .use(physics2d())
    .use(assetManager())

engine.setScene(new Cena(engine))
engine.start()