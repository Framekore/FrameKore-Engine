# @framekore/physics2d

Este pacote adiciona um sistema de simulação de física baseada em componentes para GameObjects 2D. Ele lida com aplicação de força, gravidade e resolução rígida de colisões separando os eixos X e Y.

## Responsabilidades Principais

*   **Plugin `physics2d`**: O módulo inicializador que integra as atualizações da física durante a fase `fixedUpdate` do ticker, garantindo estabilidade framerate-independente.
*   **PhysicsManager2D**: Acessível como resource da Engine, fornece métodos para checagem pontual de intersecções, resolução de overlaps manuais, e flags de camada (Collision Layers).
*   **RigidBody2D**: Componente que fornece "peso" e velocidade à entidade. Gerencia flags de toque (`touching.top`, `.bottom`, etc) cruciais para lógicas como `isGrounded` num jogo de plataforma.
*   **BoxCollide2D**: Componente de fronteira Axis-Aligned Bounding Box (AABB). Responsável por detectar sobreposições e pode operar no modo 'isTrigger' para atuar apenas como sensor.

## Configuração Básica

```ts
import { Engine } from "@framekore/core";
import { physics2d } from "@framekore/physics2d";

const engine = new Engine()
  .use(physics2d());
```

## Criando um Objeto Físico (ex: Player)

```ts
import { GameObject } from "@framekore/core";
import { Transform2D } from "@framekore/transform2d";
import { RigidBody2D, BoxCollide2D, CollisionLayer } from "@framekore/physics2d";
import { Vector2 } from "@framekore/math";

const player = new GameObject();
player.addComponent(new Transform2D());

// 1. Dando um corpo e aplicando gravidade
const rb = player.addComponent(new RigidBody2D());
rb.mass = 2; // Modifica peso nas aplicações de força
// Para pular, você pode usar rb.applyForce(new Vector2(0, -2000))

// 2. Definindo os limites de impacto (32x32)
// O collider ficará na camada 1 e será repelido por paredes na camada 2
const col = player.addComponent(new BoxCollide2D(32, 32, {
    layer: CollisionLayer.Layer1,
    mask: CollisionLayer.Layer2 
}));

// (Em um piso/parede você adicionaria apenas o BoxCollide2D sem o RigidBody2D)
```
