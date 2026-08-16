import { Engine, GameObject } from "@framekore/core"
import { InputManager } from "@framekore/input-manager"
import { BoxCollide2D, RigidBody2D, RIGID_BODY_2D } from "@framekore/physics2d"
import { Sprite2D, RenderManager2D, Texture } from "@framekore/render2d"
import { Transform2D, TRANSFORM_2D } from "@framekore/transform2d"


export class Player extends GameObject {
    input: InputManager
    render: RenderManager2D
    speed = 200;

    constructor(engine: Engine, texture: Texture) {
        super()
        this.render = RenderManager2D.get(engine)
        this.input = InputManager.get(engine)

        const sprite = new Sprite2D(texture)
        sprite.setFrame(0, 0)
        this.addComponent(sprite)

        // 2. Configura a posição e escala
        const transform = new Transform2D()
        transform.position.x = 10
        transform.position.y = 10
        transform.scale.x = 2
        transform.scale.y = 2
        this.addComponent(transform)

        // 3. Configura Física e Colisão
        this.addComponent(new BoxCollide2D(23, 21))
        
        const rb = new RigidBody2D()
        rb.useGravity = false; // Como é um jogo top-down/movimento em 4 direções, desligamos a gravidade.
        this.addComponent(rb)
    }

    update(_delta: number): void {
        super.update(_delta)
        
        // Pega o transform de forma segura através do sistema de componentes
        const transform = this.getComponent<Transform2D>(TRANSFORM_2D);
        if (transform && transform.position.y > this.render.canvas.height) {
            transform.position.y = 0
        }
    }

    fixedUpdate(_delta: number): void {
        super.fixedUpdate(_delta)
        
        // Recuperamos a física do jogador
        const rb = this.getComponent<RigidBody2D>(RIGID_BODY_2D);
        if (!rb) return;

        // Resetamos a velocidade a cada ciclo para que ele pare quando soltar a tecla
        rb.velocity.x = 0;
        rb.velocity.y = 0;

        // Controlamos o personagem definindo a velocidade do RigidBody2D,
        // O PhysicsManager cuidará de atualizar o transform de forma segura e prever as colisões.
        if (this.input.isDown("KeyD")) {
            rb.velocity.x = this.speed;
        }
        if (this.input.isDown("KeyA")) {
            rb.velocity.x = -this.speed;
        }
        if (this.input.isDown("KeyS")) {
            rb.velocity.y = this.speed;
        }
        if (this.input.isDown("KeyW")) {
            rb.velocity.y = -this.speed;
        }
    }
}