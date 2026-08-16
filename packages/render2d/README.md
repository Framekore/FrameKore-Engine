# @framekore/render2d

Este é o subsistema gráfico da engine. Ele gerencia o desenho de Sprites no Canvas do HTML utilizando os métodos acelerados por hardware do `CanvasRenderingContext2D`.

## Responsabilidades Principais

*   **Plugin `render2d`**: Plugin principal para a Engine, que instala o `RenderManager2D` e automatiza as chamadas de render no Game Loop.
*   **Camera2D**: Componente que atua como os "olhos" do jogador. Possui opções avançadas de follow, limites de mundo (world bounds) e interpolação para transições suaves.
*   **Sprite2D / AnimatedSprite2D**: Componentes visuais acoplados ao `GameObject`. Determinam *o que* desenhar. O gerenciador procura por esses componentes mais o `Transform2D`.
*   **Texture**: Abstração de imagem base que pode recortar pedaços menores (frames) para gerar spritesheets de maneira simplificada.

## Exemplo Básico de Configuração

```ts
import { Engine } from "@framekore/core";
import { render2d } from "@framekore/render2d";

const canvas = document.getElementById("gameView") as HTMLCanvasElement;

// Adiciona o plugin na inicialização
const engine = new Engine()
  .use(render2d(canvas));
```

## Renderizando uma Imagem

```ts
import { GameObject } from "@framekore/core";
import { Transform2D } from "@framekore/transform2d";
import { Sprite2D, RenderManager2D } from "@framekore/render2d";

// Presumindo que você carregou uma imagem HTMLImageElement (ex: pelo assetManager)
const renderMgr = RenderManager2D.get(engine);
const texture = renderMgr.createTexture(htmlImage);
// Opcional: fatiar a textura para spritesheets
// texture.slice(32, 32); 
// sprite.setFrame(0, 0);

const player = new GameObject();
player.addComponent(new Transform2D()); // Requisito para visibilidade
player.addComponent(new Sprite2D(texture));

scene.add(player);
```
