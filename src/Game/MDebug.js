import * as dat from 'dat.gui';

export class MDebug {
    constructor() {
        this.on = true;
        this.settings = {
            node: {
                position: true,
                direction: true,
            },
            rail: {
                arc: true,
            },
            train: {
                wheelDistance: true,
                wheels: true,
            },
        };

        window.DEBUG_SETTINGS = this.settings;
        this.controllers = [];
        this.gui = new dat.GUI({ name: 'Debug' });
        this.gui
            .add(this, 'on')
            .onFinishChange((value) => {
                this.controllers.forEach((controller) => controller.setValue(value));
            })
            .name('ON');
        this.Folder(this.settings, this.gui);
    }

    Folder(object, gui) {
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                const element = object[key];
                if (typeof element === 'object') {
                    const childGui = gui.addFolder(key.toUpperCase());
                    this.Folder(element, childGui);
                } else {
                    const controller = gui.add(object, key);
                    controller.name(key.toUpperCase());
                    this.controllers.push(controller);
                }
            }
        }
    }
}
