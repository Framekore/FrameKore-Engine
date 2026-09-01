import { Engine } from "@framekore/core";
import { inputPlugin } from "@framekore/input-manager";
import { physics2d } from "@framekore/physics2d";
import { render2d } from "@framekore/render2d";
import { Cena } from "./Cena";

const canvas = document.createElement('canvas') as HTMLCanvasElement
canvas.width = 500
canvas.height = 500
document.body.append(canvas)

const engine = new Engine()
  .use(inputPlugin())
  .use(render2d(canvas))
  .use(physics2d())

engine.setScene(new Cena(engine))

engine.start()