# FrameKore Engine

FrameKore é uma **engine 2D modular em desenvolvimento**, construída em **TypeScript**, com foco em arquitetura baseada em **componentes e plugins**.

O projeto foi criado principalmente para **estudo e experimentação de arquitetura de game engines**, implementando sistemas comuns encontrados em engines modernas.

---

## ✨ Principais Conceitos

- **GameObject + Component System**: Entidades flexíveis moldadas por seus componentes.
- **Scenes**: Gerenciamento de múltiplos estados/telas do jogo.
- **Game Loop (Ticker)**: Atualizações separadas para lógica (`update`), física (`fixedUpdate`) e gráficos (`render`).
- **Plugins Modulares**: Adicione apenas o que precisa à engine.
- **Gerenciamento de Assets**: Cache e carregamento simplificado de recursos.
- **Renderização 2D (Canvas)**: Desenho otimizado baseado em texturas e câmeras.
- **Sistema de Física Simples**: Colisões AABB e forças básicas.

---

## 🚀 Como usar o básico da Engine (Getting Started)

A FrameKore foi desenhada para ser construída bloco por bloco. Abaixo está um exemplo completo de como iniciar a engine, carregar uma imagem, e colocá-la na tela usando nosso sistema de Componentes.

```ts
import { Engine, Scene, GameObject } from "@framekore/core";
import { render2d, RenderManager2D, Sprite2D, SPRITE_2D } from "@framekore/render2d";
import { assetManager, AssetManager } from "@framekore/assetManager";
import { Transform2D, TRANSFORM_2D } from "@framekore/transform2d";

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
```

---

## 📦 Pacotes da Engine

A arquitetura da FrameKore é dividida em submódulos (`packages`) independentes para garantir a modularidade. Cada pacote possui seu próprio `README.md` com mais detalhes técnicos:

- 🧱 **[`@framekore/core`](./packages/core)**: O coração da engine (Engine, Scene, GameObject, Components).
- 🧮 **[`@framekore/math`](./packages/math)**: Utilitários matemáticos (como `Vector2`).
- 📐 **[`@framekore/transform2d`](./packages/transform2d)**: O componente base espacial `Transform2D`.
- 🎨 **[`@framekore/render2d`](./packages/render2d)**: Renderizador Canvas2D, Câmera, Texturas e Sprites.
- ⚙️ **[`@framekore/physics2d`](./packages/physics2d)**: Físicas básicas, RigidBody2D e Colisões (AABB).
- ⌨️ **[`@framekore/inputManager`](./packages/inputManager)**: Gerenciamento de entrada do jogador (teclado).
- 📦 **[`@framekore/assetManager`](./packages/assetManager)**: Gerenciamento assíncrono de cache e assets.
- 🐛 **[`@framekore/debugger2d`](./packages/debugger2d)**: Utilitários visuais de debug (WIP).

---

## 🚧 Estado do Projeto

FrameKore ainda está em **desenvolvimento** e serve como um projeto de **aprendizado e experimentação** para arquitetura de engines. Funcionalidades podem mudar a qualquer momento.
