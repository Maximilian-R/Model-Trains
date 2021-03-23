import { KEY_MAP } from '../Game/MControls.js';
import { MVector } from '../Utilities/MVector.js';
import { MKeyEvent } from '../Utilities/MEvent.js';
import { SCALE } from '../Game/MConstans';
import { MDraw } from '../Utilities/MDraw.js';
import { MRailCurveEdge } from './MTracks.js';
import * as dat from 'dat.gui';

//const TRAIN_WAGON_LENGTH = 120 * SCALE;
//const TRAIN_WAGON_WIDTH = 20 * SCALE;
const TRAIN_WAGON_WHEEL_INSET = 10 * SCALE;
const TRAIN_WAGON_GAP = 8 * SCALE;

const TRAIN_FRICTION = 0.02;
const TRAIN_MAX_SPEED = 10.0;
const TRAIN_ACCELERATION_FACTOR = 0.04;

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

        this.GameCamera = GameCamera;
        InputHandler.RegisterObserver(this, this.OnEventNotify);

        this.Reset();
        this.gui = new MTrainGUI(this);
    }

    Reset() {
        this.wagons = [];
        let offset = 100;
        const wagons = 6;
        for (var i = 0; i < wagons; i++) {
            this.wagons.push(new MTrainWagon(this, offset, i === wagons - 1 ? sketch.MSprites[1] : sketch.MSprites[0]));
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
            this.GameCamera.Teleport(MVector.Sub(loco.wheel2.position, MVector.Create(sketch.width / 2, sketch.height / 2)));
        }
    }

    Update() {
        this.acc = this.power * TRAIN_ACCELERATION_FACTOR;
        this.speed -= TRAIN_FRICTION;
        this.speed += this.acc;
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
        return this.sprite.width * SCALE;
    }

    get width() {
        return this.sprite.height * SCALE;
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
        sketch.image(sketch.MSprites[2], this.length / 2 + 2 * SCALE, 0, 5 * SCALE, 16 * SCALE);
        sketch.rotate(sketch.PI);
        sketch.image(sketch.MSprites[2], this.length / 2 + 2 * SCALE, 0, 5 * SCALE, 16 * SCALE);

        sketch.pop();

        this.wheel1.Draw();
        this.wheel2.Draw();

        if (DEBUG_MODE) {
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
        // do this calc again when setting next rail=
        const dstToNextTrack = this.onRail.Distance();

        this.current += speed;
        while (this.current >= dstToNextTrack) {
            this.current -= dstToNextTrack;

            const lastRail = this.onRail;
            this.onRail = this.to.OppositeRail(lastRail);
            if (this.onRail != null) {
                this.from = this.to;
                this.to = this.onRail.OppositeNode(this.from);
            } else {
                // TODO: Derail, no more rail!
                this.onRail = lastRail;
                //break;
            }
        }

        const t = this.current / dstToNextTrack;
        this.position = this.onRail.PointAlongRail(t, this.from.position, this.to.position);
    }

    Draw() {
        if (DEBUG_MODE) {
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
