import { GameObject } from "@framekore/core";

export class Component {
    gameObject: GameObject
    constructor(object: GameObject) {
        this.gameObject = object
    }
}