export class MSubject {
    constructor() {
        this.observerCollection = [];
    }

    RegisterObserver(obs, obsFunc) {
        this.observerCollection.push({ obj: obs, func: obsFunc });
    }

    UnregisterObserver(obs) {
        const index = this.observerCollection.findIndex((obj) => obj === obs);
        if (index >= 0) this.observerCollection.splice(index, 1);
    }

    NotifyObservers(event) {
        for (var obs of this.observerCollection) {
            // call on the given function, with the given object as 'this'
            // function.call(this, params);
            obs.func.call(obs.obj, event);
        }
    }
}

export class MInput extends MSubject {
    constructor() {
        super();
        this.events = ['MOUSE_DOWN', 'MOUSE_UP', 'MOUSE_DRAG', 'MOUSE_MOVE', 'KEY_PRESS', 'MOUSE_SCROLL'];
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
}

export class MEvent {
    constructor(event) {
        this.event = event;
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
