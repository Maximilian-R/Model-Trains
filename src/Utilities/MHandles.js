import { MVector } from './MVector';

export class MHandles {
    constructor(InputHandler) {
        this.freeMoveHandlers = [];
        this.dragIndex;
        this.color = sketch.color(255);
        this.selectedHandleColor = sketch.color(0, 255, 255);
        InputHandler.RegisterObserver(this, this.OnEventNotify);

        /* Tick keeps track of how many handlers we are trying to access each loop.
            If tick is >= to length of handlers, a new handler must be created. */
        this.tick = 0;
    }

    OnEventNotify(event) {
        if (event.button == 'left' && !sketch.keyIsDown(16) && !sketch.keyIsDown(17)) {
            // && !keyIsPressed not working atm.
            switch (event.event) {
                case 'MOUSE_DOWN':
                    for (var i = 0; i < this.freeMoveHandlers.length; i++) {
                        if (event.position.dist(this.freeMoveHandlers[i].position) <= this.freeMoveHandlers[i].size * 0.5) {
                            this.dragIndex = i;
                            break;
                        }
                    }
                    break;
                case 'MOUSE_DRAG':
                    if (this.dragIndex != null) this.freeMoveHandlers[this.dragIndex].position = event.position;
                    break;
                case 'MOUSE_UP':
                    this.dragIndex = null;
                    break;
            }
        }
    }

    Update() {
        this.tick = 0;
        // remove any handlers that was not used last frame.
        for (var i = this.freeMoveHandlers.length - 1; i >= 0; i--) {
            if (this.freeMoveHandlers[i].lastUsed < sketch.frameCount - 1) {
                this.freeMoveHandlers.splice(i, 1);
            }
        }
    }

    Draw() {
        sketch.strokeWeight(3);
        sketch.noStroke();
        for (var i = 0; i < this.freeMoveHandlers.length; i++) {
            i == this.dragIndex ? sketch.stroke(this.selectedHandleColor) : sketch.noStroke();
            sketch.fill(this.freeMoveHandlers[i].color);
            var pos = this.freeMoveHandlers[i].position;
            sketch.ellipse(pos.x, pos.y, this.freeMoveHandlers[i].size);
        }
    }

    FreeMoveHandle(handleId, position, diameter) {
        if (this.tick == this.freeMoveHandlers.length) this.freeMoveHandlers.push(new MFreeMoveHandle(handleId, position, diameter));

        if (this.tick != this.dragIndex) this.freeMoveHandlers[this.tick].position = position;

        this.freeMoveHandlers[this.tick].size = diameter;
        this.freeMoveHandlers[this.tick].color = this.color;
        this.freeMoveHandlers[this.tick].lastUsed = sketch.frameCount;

        return this.freeMoveHandlers[this.tick++].position;
    }
}

export class MFreeMoveHandle {
    constructor(id, pos) {
        this.id = id;
        this.position = pos;
        this.size;
        this.color;
        this.lastUsed = 0;
    }
}
