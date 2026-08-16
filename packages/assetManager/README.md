# @framekore/assetManager

Este pacote trata do carregamento assíncrono e do cache persistente de recursos externos necessários para renderização, aúdio, ou arquivos de configuração do jogo.

## Responsabilidades Principais

*   **Plugin `assetManager`**: Injeta a funcionalidade global do gerenciador de assets no `Engine`.
*   **AssetManager**: Fornece um mecanismo Promise-based (`load`) para resgatar imagens (HTMLImageElement), Áudios (HTMLAudioElement) e JSON, fazendo com que múltiplas chamadas à mesma URL não repitam requisições redundantes de rede, operando a partir do cache (`get`).

## Exemplo Básico de Configuração

```ts
import { Engine } from "@framekore/core";
import { assetManager } from "@framekore/assetManager";

const engine = new Engine()
  .use(assetManager());
```

## Carregando e Resgatando Assets

```ts
import { AssetManager } from "@framekore/assetManager";

// 1. Carregando (Geralmente feito na inicialização ou antes de uma Cena começar)
async function preload(engine: Engine) {
    const assets = AssetManager.get(engine);
    
    // Suporta 'image', 'audio' ou 'json'
    await assets.load("bg_music", "audio", "./sounds/music.mp3");
    await assets.load("player_sprite", "image", "./images/player.png");
}

// 2. Usando de Forma Síncrona (Durante a lógica do jogo ou cena)
function onGameStart(engine: Engine) {
    const assets = AssetManager.get(engine);
    
    // Obtém direto do cache garantindo tipagem
    const music = assets.get<HTMLAudioElement>("bg_music");
    music.play();
    
    const spriteImg = assets.get<HTMLImageElement>("player_sprite");
    // Agora você pode passá-lo ao RenderManager para ser fatiado, etc.
}
```
