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

export class MEvent {
    constructor(event) {
        this.event = event;
    }
}
