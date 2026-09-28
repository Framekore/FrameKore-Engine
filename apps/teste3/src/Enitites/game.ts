import { GameObject } from "@framekore/core";
import { AnimatedSprite2D, Corno } from "@framekore/render2d";

export class Espinho extends GameObject implements Corno {
    
}

declare const qqlnome: GameObject 
function ehCorno(value: GameObject): value is GameObject & Corno {
    return (value instanceof GameObject && "animation" in value && value.animation instanceof AnimatedSprite2D)
}

if (ehCorno(qqlnome)) {
    qqlnome.animation.
}