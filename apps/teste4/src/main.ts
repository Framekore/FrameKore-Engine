import { Engine, Scene, GameObject } from "@framekore/core";
import { render2d, RenderManager2D, Sprite2D } from "@framekore/render2d";
import { assetManager, AssetManager } from "@framekore/asset-manager";
import { Transform2D } from "@framekore/transform2d";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

const engine = new Engine()
  .use(assetManager())
  .use(render2d(canvas));



const assets = AssetManager.get(engine);
const playerImage = await assets.load("playerImg", "image", "./assets/player.png");

const renderMgr = RenderManager2D.get(engine);
const texture = renderMgr.createTexture(playerImage);

class MainScene extends Scene {
  onEnter() {
    const player = new GameObject();

    const transform = player.addComponent(new Transform2D());
    transform.position.x = 100;
    transform.position.y = 100;

      player.addComponent(new Sprite2D(texture));

    this.add(player);
  }
}
engine.setScene(new MainScene());
engine.start();
