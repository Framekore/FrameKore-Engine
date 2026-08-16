# @framekore/inputManager

O InputManager fornece um hub centralizado na engine para rastreamento de eventos globais de hardware, focando primariamente no teclado (`KeyboardEvent`).

## Responsabilidades Principais

*   **Plugin `inputPlugin`**: Conecta automaticamente o listener global `keydown` e `keyup` na inicialização e o destrói ao parar a Engine.
*   **InputManager**: Disponível em qualquer lugar pelo registro da engine. Armazena um mapa eficiente em memória indicando se uma tecla específica está pressionada naquele milissegundo de execução.

## Exemplo Básico de Configuração

```ts
import { Engine } from "@framekore/core";
import { inputPlugin } from "@framekore/inputManager";

const engine = new Engine()
  .use(inputPlugin());
```

## Como Ler Inputs

Geralmente, você lerá a entrada do usuário dentro do `update` de um Componente ou Scene, garantindo fluidez e reatividade.

```ts
import { Component, Engine } from "@framekore/core";
import { InputManager } from "@framekore/inputManager";

class PlayerController extends Component {
    static key = Symbol("PlayerController");

    update(delta: number) {
        // Recupera o InputManager global atrelado à engine
        const input = InputManager.get(this.gameObject.engine);

        // Verifica estado da tecla por código (code) do evento HTML
        if (input.isDown("KeyW") || input.isDown("ArrowUp")) {
            console.log("Movendo para cima!");
        }
        
        if (input.isDown("Space")) {
            console.log("Pulo!");
        }
    }
}
```
