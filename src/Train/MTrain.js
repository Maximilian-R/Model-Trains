import { KEY_MAP } from '../Game/MControls.js';
import { MVector } from '../Utilities/MVector.js';
import { MKeyEvent } from '../Utilities/MInput.js';
import * as dat from 'dat.gui';

const TRAIN_WAGON_WHEEL_INSET = 10;
const TRAIN_WAGON_GAP = 8;
const RAIL_FRICTION = 0.02;
const SPEED_FRICTION = 0.005;
const TRAIN_MAX_SPEED = 10.0;
const TRAIN_ACCELERATION_FACTOR = 0.08;

class MTrainGUI {
    constructor(train) {
        this.train = train;
        this.speedValue = 0;
        this.setup();
    }

    update() {
        this.speed.setValue(this.train.speed);
    }

    setup() {
        const gui = new dat.GUI({ name: 'Train' });
        this.power = gui.add(this.train, 'power', 0, 1.0, 0.1);
        this.follow = gui.add(this.train, 'follow');
        this.speed = gui.add(this, 'speedValue', 0, TRAIN_MAX_SPEED, 0.1);

        const trainset = gui.addFolder('Trainset');
        trainset.add(this.train.trainset, 'locomotives', 0, sketch.MSprites.locos.length, 1).onFinishChange(() => this.train.Reset());
        trainset.add(this.train.trainset, 'wagons', 0, sketch.MSprites.carts.length, 1).onFinishChange(() => this.train.Reset());
    }
}

export class MTrain {
    constructor(InputHandler, GameCamera, route) {
        this.route = route;
        this.wagons = [];

        this.speed = 0.0;
        this.acc = 0.0;
        this.power = 0.0;
        this.follow = false;

        this.trainset = {
            locomotives: sketch.MSprites.locos.length,
            wagons: sketch.MSprites.carts.length,
        };

        this.GameCamera = GameCamera;
        InputHandler.RegisterObserver(this, this.OnEventNotify);

        this.Reset();
        this.gui = new MTrainGUI(this);
    }

    Reset() {
        this.wagons = [];
        let offset = 100;
        for (var i = 0; i < this.trainset.wagons; i++) {
            this.wagons.push(new MTrainWagon(this, offset, sketch.MSprites.carts[i]));
            offset += this.wagons[this.wagons.length - 1].length + TRAIN_WAGON_GAP;
        }
        for (var i = 0; i < this.trainset.locomotives; i++) {
            this.wagons.push(new MTrainWagon(this, offset, sketch.MSprites.locos[i]));
            offset += this.wagons[this.wagons.length - 1].length + TRAIN_WAGON_GAP;
        }
    }

    OnEventNotify(event) {
        if (event instanceof MKeyEvent) {
            if (event.key === KEY_MAP.CTRL) {
                this.ChangeDirection();
            }
        }
    }

    Follow() {
        const loco = this.wagons[this.wagons.length - 1];
        if (loco.wheel2.position) {
            this.GameCamera.Teleport(loco.wheel1.position);
        }
    }

    Update() {
        this.acc = this.power * TRAIN_ACCELERATION_FACTOR;
        this.speed -= RAIL_FRICTION;
        this.speed += this.acc;
        this.speed -= this.speed * SPEED_FRICTION;
        if (this.speed >= TRAIN_MAX_SPEED) {
            this.speed = TRAIN_MAX_SPEED;
        }
        if (this.speed < 0) {
            this.speed = 0;
        }

        for (var i = 0; i < this.wagons.length; i++) {
            this.wagons[i].Update(this.speed);
        }

        this.gui.update();
        if (this.follow) this.Follow();
    }

    Draw() {
        for (var i = 0; i < this.wagons.length; i++) {
            this.wagons[i].Draw();
        }
    }

    ChangeDirection() {
        for (var i = 0; i < this.wagons.length; i++) {
            this.wagons[i].ChangeDirection();
        }
    }
}

export class MTrainWagon {
    constructor(train, current, sprite) {
        this.train = train;
        this.sprite = sprite;
        this.wheel1 = new MTrainWheelPair(this, current + this.length - TRAIN_WAGON_WHEEL_INSET, this.train.route[0], true);
        this.wheel2 = new MTrainWheelPair(this, current + TRAIN_WAGON_WHEEL_INSET, this.train.route[0]);
    }

    get length() {
        return this.sprite.width;
    }

    get width() {
        return this.sprite.height;
    }

    Update(speed) {
        if (this.train.route.length == 0) return;
        this.wheel1.Update(speed);
        this.wheel2.Update(speed);
    }

    ChangeDirection() {
        this.wheel1.ChangeDirection();
        this.wheel2.ChangeDirection();
    }

    Draw() {
        sketch.noStroke();
        sketch.fill(0);

        const mid = MVector.Div(MVector.Add(this.wheel1.position, this.wheel2.position), 2);
        const inverseTan = sketch.atan2(this.wheel2.position.y - this.wheel1.position.y, this.wheel2.position.x - this.wheel1.position.x);

        sketch.push();
        sketch.translate(mid.x, mid.y);
        sketch.rotate(inverseTan);

        //sketch.fill(255);
        //sketch.rectMode(sketch.CENTER);
        //sketch.rect(0, 0, this.length, this.width);

        sketch.imageMode(sketch.CENTER);
        sketch.image(this.sprite, 0, 0, this.length, this.width);
        sketch.image(sketch.MSprites.connectors[0], this.length / 2 + 2, 0, 5, 16);
        sketch.rotate(sketch.PI);
        sketch.image(sketch.MSprites.connectors[0], this.length / 2 + 2, 0, 5, 16);

        sketch.pop();

        this.wheel1.Draw();
        this.wheel2.Draw();

        if (DEBUG_SETTINGS.train.wheelDistance) {
            if (this.wheel1.position && this.wheel2.position) {
                //sketch.stroke(50, 50, 255);
                //sketch.strokeWeight(2);
                //MDraw.Line(this.wheel1.position, this.wheel2.position);

                sketch.push();
                sketch.translate(mid.x, mid.y);
                sketch.textSize(14);
                sketch.noStroke();
                sketch.text(MVector.Dist(this.wheel1.position, this.wheel2.position).toFixed(0), 0, 0);
                sketch.pop();
            }
        }
    }
}

export class MTrainWheelPair {
    constructor(wagon, current, onRail, front = false) {
        this.wagon = wagon;
        this.current = current;
        this.position;
        this.onRail = onRail;
        this.from = this.onRail.node1;
        this.to = this.onRail.node2;
        this.front = front;
    }

    ChangeDirection() {
        const temp = this.from;
        this.from = this.to;
        this.to = temp;
        this.current = this.onRail.Distance() - this.current;
    }

    Update(speed) {
        let dstToNextTrack = this.onRail.Distance();
        this.current += speed;
        while (this.current >= dstToNextTrack) {
            this.current -= dstToNextTrack;

            const lastRail = this.onRail;
            this.onRail = this.to.OppositeRail(lastRail);
            if (this.onRail != null) {
                dstToNextTrack = this.onRail.Distance();
                this.from = this.to;
                this.to = this.onRail.OppositeNode(this.from);
            } else {
                // TODO: Derail, no more rail!
                this.onRail = lastRail;
                console.error('Derail');
                //break;
            }
        }

        const t = this.current / dstToNextTrack;
        this.position = this.onRail.PointAlongRail(t, this.from.position, this.to.position);
    }

    Draw() {
        if (DEBUG_SETTINGS.train.wheels) {
            sketch.push();
            this.front ? sketch.fill(150, 255, 150) : sketch.fill(255, 150, 150);
            sketch.ellipse(this.position.x, this.position.y, 10);
            sketch.pop();

            /* 
            sketch.push();
            sketch.translate(this.position.x, this.position.y);
            sketch.textSize(14);
            sketch.noStroke();
            sketch.text(this.current.toFixed(0), 0, 0);
            sketch.pop();
            */
        }
    }
}
