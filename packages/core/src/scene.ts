import { GameObject } from "./gameObject"

export abstract class Scene extends GameObject {
    protected objects: GameObject[] = []

    onEnter?(): void
    onExit?(): SecurityPolicyViolationEventDisposition

    add(obj: GameObject): void {
        const engine = this.engine
        if (engine) {
            obj.engine = engine
        }
        for (const component of obj.getComponents()) {
            if (engine) {
                component.engine = engine
            }
            this.objects.push(component)
        }
        this.objects.push(obj)
    }
    
    update(delta: number): void {
        for (const obj of this.objects) {
            obj.update?.(delta)
        }
    }
    
    fixedUpdate(delta: number): void {
        for (const obj of this.objects) {
            obj.fixedUpdate?.(delta)
        }
    }

    getObjects(): GameObject[] {
        return this.objects
    }
}
