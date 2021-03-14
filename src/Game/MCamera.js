import { MVector } from '../Utilities/MVector.js';
import { MScrollEvent } from '../Utilities/MEvent.js';

export class MCamera {
    constructor() {
        this.position = MVector.Create();
    }

    PositionInWorld(position) {
        return MVector.Add(position, this.position);
    }

    Teleport(position) {
        this.position = position;
    }

    Scroll(delta) {
        this.position = MVector.Add(this.position, delta);
    }

    Draw() {
        sketch.translate(-this.position.x, -this.position.y);
    }
}

export class MCameraController {
    constructor(InputHandler, camera) {
        this.camera = camera;
        this.speed = 10;
        InputHandler.RegisterObserver(this, this.OnEventNotify);
    }

    OnEventNotify(event) {
        if (event instanceof MScrollEvent) {
            this.camera.Scroll(event.delta);
        }
    }

    Update() {
        if (sketch.keyIsPressed) {
            const delta = MVector.Create();
            if (sketch.keyIsDown(sketch.UP_ARROW) || sketch.keyIsDown(87)) {
                delta.y += -this.speed;
            }
            if (sketch.keyIsDown(sketch.DOWN_ARROW) || sketch.keyIsDown(83)) {
                delta.y += this.speed;
            }
            if (sketch.keyIsDown(sketch.LEFT_ARROW) || sketch.keyIsDown(65)) {
                delta.x += -this.speed;
            }
            if (sketch.keyIsDown(sketch.RIGHT_ARROW) || sketch.keyIsDown(68)) {
                delta.x += this.speed;
            }
            this.camera.Scroll(delta);
        }
    }
}
