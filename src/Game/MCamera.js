import { MVector } from '../Utilities/MVector.js';
import { MScrollEvent } from '../Utilities/MInput.js';
import { SCALE } from './MConstans.js';
import * as dat from 'dat.gui';

export class MCamera {
    constructor() {
        this.position = MVector.Create();

        this.scale = SCALE;
        const gui = new dat.GUI({ name: 'Camera' });
        gui.add(this, 'scale', 0.5, 2, 0.1);
    }

    PositionInWorld(position) {
        return MVector.Add(position.div(this.scale), this.position);
    }

    Teleport(position, center = true) {
        if (center) {
            position = MVector.Sub(position, MVector.Create(sketch.width / 2 / this.scale, sketch.height / 2 / this.scale));
        }
        this.position.x = position.x;
        this.position.y = position.y;
    }

    Scroll(delta) {
        this.Teleport(MVector.Add(this.position, delta), false);
    }

    Draw() {
        sketch.scale(this.scale);
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
