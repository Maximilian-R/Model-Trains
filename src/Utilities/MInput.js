import { MSubject, MEvent } from './MEvent.js';
import { MVector } from './MVector.js';

export class MInput extends MSubject {
    constructor() {
        super();
        this.events = ['MOUSE_DOWN', 'MOUSE_UP', 'MOUSE_DRAG', 'MOUSE_MOVE', 'KEY_PRESS', 'MOUSE_SCROLL'];

        sketch.mousePressed = (event) => {
            if (event.target.id === 'defaultCanvas0') {
                this.OnMouseDown(this.mouse);
            }
        };
        sketch.mouseDragged = () => {
            this.OnMouseDrag(this.mouse);
        };
        sketch.mouseReleased = () => {
            this.OnMouseUp(this.mouse);
        };
        sketch.mouseMoved = () => {
            this.OnMouseMove(this.mouse);
        };
        sketch.keyPressed = () => {
            this.OnKeyPress(sketch.keyCode);
        };
        sketch.mouseWheel = (event) => {
            this.OnMouseScroll(this.mouse, MVector.Create(event.deltaX, event.deltaY));
        };
    }

    OnMouseDown(position) {
        var event = new MMouseEvent(this.events[0], position, sketch.mouseButton);
        this.NotifyObservers(event);
    }

    OnMouseUp(position) {
        var event = new MMouseEvent(this.events[1], position, sketch.mouseButton);
        this.NotifyObservers(event);
    }

    OnMouseDrag(position) {
        var event = new MMouseEvent(this.events[2], position, sketch.mouseButton);
        this.NotifyObservers(event);
    }

    OnMouseMove(position) {
        var event = new MMouseEvent(this.events[3], position, sketch.mouseButton);
        this.NotifyObservers(event);
    }

    OnKeyPress(key) {
        var event = new MKeyEvent(this.events[4], key);
        this.NotifyObservers(event);
    }

    OnMouseScroll(position, delta) {
        var event = new MScrollEvent(this.events[5], position, sketch.mouseButton, delta);
        this.NotifyObservers(event);
    }

    get mouse() {
        return MVector.Create(sketch.mouseX, sketch.mouseY);
    }
}

export class MMouseEvent extends MEvent {
    constructor(event, position, button) {
        super(event);
        this.position = position;
        this.button = button;
    }
}

export class MKeyEvent extends MEvent {
    constructor(event, key) {
        super(event);
        this.key = key;
    }
}

export class MScrollEvent extends MMouseEvent {
    constructor(event, position, button, delta) {
        super(event, position, button);
        this.delta = delta;
    }
}
