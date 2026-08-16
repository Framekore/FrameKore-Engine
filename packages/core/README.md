# @framekore/core

O pacote `core` é o coração da FrameKore Engine. Ele contém a lógica fundamental de fluxo de jogo, estruturação de entidades e gerenciamento de loop. 

## Responsabilidades Principais

*   **Engine**: Classe principal que gerencia o estado global, recursos (resources), cenas e executa os plugins registrados.
*   **Ticker**: O Game Loop interno. Divide o tempo de processamento em `update` (variação por frame), `fixedUpdate` (intervalo fixo, ideal para física) e `render`.
*   **Scene**: Contêiner de estado de jogo. Uma Cena gerencia um grupo de `GameObjects` e orquestra suas atualizações.
*   **GameObject & Component**: O padrão arquitetural primário da engine (Entity-Component System simplificado). O `GameObject` atua como um contêiner puro, enquanto a lógica e os dados vivem dentro dos `Components` anexados a ele.

## Exemplo Básico

```ts
import { Engine, Scene, GameObject, Component } from "@framekore/core";

// Criando a Engine
const engine = new Engine();

// Definindo um Componente Customizado
class RotatorComponent extends Component {
    static key = Symbol("rotator"); // Exigido para identificar o componente

    // Método chamado a cada frame
    update(delta: number) {
        // Lógica de rotação...
    }
}

// Criando uma Cena
class MyScene extends Scene {
    onEnter() {
        const obj = new GameObject();
        obj.addComponent(new RotatorComponent());
        
        this.add(obj); // Adiciona na cena para ser atualizado
    }
}

// Configurando e Rodando
engine.setScene(new MyScene());
engine.start();
```

## Como estender (Plugins)

A engine suporta `EnginePlugin`s para estender seu comportamento global sem inchar o Core. Use a função `definePlugin` para criar um.

```ts
import { definePlugin } from "@framekore/core";

export const myCustomPlugin = definePlugin(() => {
    return {
        name: "my_plugin",
        setup(engine) {
            console.log("Plugin instalado!");
        },
        update(engine, delta) {
            // Executado a cada frame
        }
    }
});

// Uso: engine.use(myCustomPlugin())
```
