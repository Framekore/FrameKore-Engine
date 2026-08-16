# @framekore/math

Este pacote contém as primitivas matemáticas e funções utilitárias base necessárias para manipulação espacial na engine.

## Responsabilidades Principais

*   **Vector2**: Representa coordenadas bidimensionais ou vetores matemáticos (como força ou velocidade). Fornece operações matemáticas eficientes otimizadas para jogos (soma, subtração, normalização, produto escalar, interpolação, etc).

## Exemplo Básico

```ts
import { Vector2 } from "@framekore/math";

// Criando vetores
const start = new Vector2(0, 0);
const dest = new Vector2(100, 50);

// Operações estáticas que retornam um NOVO vetor
const sum = Vector2.add(start, dest);
const distance = Vector2.distanceTo(start, dest);

// Operações mutáveis na própria instância (otimização de performance para evitar GC)
start.add(new Vector2(10, 0)); // 'start' agora é (10, 0)
start.lerp(dest, 0.5); // Move 'start' 50% em direção a 'dest'

// Outras funções
const normalized = dest.normalize(); // Mantém direção, length 1
const mag = dest.magnitude();
```
