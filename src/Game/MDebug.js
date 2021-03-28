import * as dat from 'dat.gui';

export class MDebug {
    constructor() {
        this.on = true;
        this.settings = {
            node: {
                position: false,
                direction: true,
                switchSplit: false,
            },
            rail: {
                arc: false,
            },
            train: {
                wheelDistance: false,
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
            .name('Toggle All');
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
