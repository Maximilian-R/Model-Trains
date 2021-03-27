import { MSubject, MEvent } from './MEvent.js';
import { MVector } from './MVector.js';

export class MCursor extends MSubject {
    constructor(camera) {
        super();
        this.camera = camera;
        this.position = MVector.Create();
        this.lastPosition = MVector.Create();
    }

    Update() {
        this.lastPosition = this.position;
        const mouse = MVector.Create(sketch.mouseX, sketch.mouseY);
        this.position = this.camera.PositionInWorld(mouse);
        if (!MVector.Equals(this.lastPosition, this.position)) {
            this.NotifyObservers(new MCursorEvent(this.position));
        }
    }
}

export class MCursorEvent extends MEvent {
    constructor(position) {
        super('CURSOR_MOVED');
        this.position = position;
    }
}
