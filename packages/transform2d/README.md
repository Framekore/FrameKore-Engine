# @framekore/transform2d

Este pacote contém um componente simples, porém essencial: o `Transform2D`. 
Praticamente qualquer entidade visível ou física dependerá das informações definidas aqui.

## Responsabilidades Principais

*   **Transform2D**: Um `Component` usado em GameObjects para fornecer dados posicionais no espaço 2D, incluindo Posição (x, y), Escala (width, height) e Rotação (radianos).

Outros plugins, como `render2d` e `physics2d`, dependem fortemente deste componente para determinar onde renderizar a imagem e calcular os limites de colisão físicos.

## Exemplo Básico

```ts
import { GameObject } from "@framekore/core";
import { Transform2D, TRANSFORM_2D } from "@framekore/transform2d";
import { Vector2 } from "@framekore/math";

const myEntity = new GameObject();
const transform = myEntity.addComponent(new Transform2D());

// Alterando a posição
transform.position.x = 500;
transform.position.y = 300;

// Ou via método auxiliar do Vector2
transform.position.add(new Vector2(10, 10));

// Rotação é medida em radianos
transform.rotation = Math.PI / 2; // Gira 90 graus

// Escala duplica o tamanho de renderização
transform.scale.set(2, 2); 
```
