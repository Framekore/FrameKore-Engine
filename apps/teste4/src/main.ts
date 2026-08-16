import { Engine, Scene, GameObject } from "@framekore/core";
import { render2d, RenderManager2D, Sprite2D } from "@framekore/render2d";
import { assetManager, AssetManager } from "@framekore/asset-manager";
import { Transform2D } from "@framekore/transform2d";

// 1. Obtenha a referência do seu elemento canvas no HTML
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

// 2. Inicialize a Engine com os plugins desejados
const engine = new Engine()
  .use(assetManager())
  .use(render2d(canvas));

// Função principal assíncrona para lidar com o carregamento de assets
async function startGame() {
  // 3. Carregue seus recursos usando o AssetManager
  const assets = AssetManager.get(engine);
  const playerImage = await assets.load("playerImg", "image", "./assets/player.png");

  // 4. Transforme a imagem em uma Texture reconhecida pelo renderizador
  const renderMgr = RenderManager2D.get(engine);
  const texture = renderMgr.createTexture(playerImage);

  // 5. Crie sua Cena customizada
  class MainScene extends Scene {
    onEnter() {
      // Cria o GameObject do jogador
      const player = new GameObject();

      // Adiciona o Transform para controlar posição/escala
      const transform = player.addComponent(new Transform2D());
      transform.position.x = 100;
      transform.position.y = 100;

        // Adiciona o Sprite usando a textura carregada
        player.addComponent(new Sprite2D(texture));

      // Adiciona o objeto à cena
      this.add(player);
    }
  }

  // 6. Defina a cena na engine e inicie o loop principal!
  engine.setScene(new MainScene());
  engine.start();
}

startGame();