import { KEY_MAP } from '../Game/MControls.js';
import { MVector } from '../Utilities/MVector.js';
import { MKeyEvent } from '../Utilities/MEvent.js';
import { SCALE } from '../Game/MConstans';

const TRAIN_WAGON_LENGTH = 120 * SCALE;
const TRAIN_WAGON_WIDTH = 20 * SCALE;
const TRAIN_WAGON_WHEEL_INSET = 10 * SCALE;
const TRAIN_WAGON_GAP = 8 * SCALE;

const TRAIN_FRICTION = 0.02;
const TRAIN_MAX_SPEED = 10.0;
const TRAIN_ACCELERATION_FACTOR = 0.04;

export class MTrain {
    constructor(InputHandler, route) {
        this.route = route;
        this.wagons = [];

        this.speed = 0.0;
        this.acc = 0.0;
        this.power = 0.0;

        InputHandler.RegisterObserver(this, this.OnEventNotify);

        this.Reset();
    }

    Reset() {
        this.wagons = [];
        let offset = 0;
        const wagons = 6;
        for (var i = 0; i <= wagons; i++) {
            this.wagons.push(
                new MTrainWagon(
                    this,
                    offset + TRAIN_WAGON_WHEEL_INSET,
                    offset + TRAIN_WAGON_LENGTH - TRAIN_WAGON_WHEEL_INSET,
                    i === wagons ? sketch.MSprites[1] : sketch.MSprites[0],
                ),
            );
            offset += TRAIN_WAGON_LENGTH + TRAIN_WAGON_GAP;
        }
    }

    OnEventNotify(event) {
        if (event instanceof MKeyEvent) {
            if (event.key === KEY_MAP.CTRL) {
                this.ChangeDirection();
            }
        }
    }

    Update() {
        this.power = sketch.keyIsDown(KEY_MAP.SPACE) ? 1.0 : 0.0;
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
    constructor(train, c1, c2, sprite) {
        this.train = train;
        this.sprite = sprite;

        this.wheel1 = new MTrainWheelPair(this, c1, this.train.route[0]);
        this.wheel2 = new MTrainWheelPair(this, c2, this.train.route[0]);
        this.wheel2.front = true;
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
        //sketch.rect(0, 0, TRAIN_WAGON_LENGTH, TRAIN_WAGON_WIDTH);

        sketch.imageMode(sketch.CENTER);
        sketch.image(this.sprite, 0, 0, TRAIN_WAGON_LENGTH, TRAIN_WAGON_WIDTH);
        sketch.image(sketch.MSprites[2], TRAIN_WAGON_LENGTH / 2 + 2 * SCALE, 0, 5 * SCALE, 16 * SCALE);
        sketch.rotate(sketch.PI);
        sketch.image(sketch.MSprites[2], TRAIN_WAGON_LENGTH / 2 + 2 * SCALE, 0, 5 * SCALE, 16 * SCALE);

        sketch.pop();

        this.wheel1.Draw();
        this.wheel2.Draw();
    }
}

export class MTrainWheelPair {
    constructor(wagon, current, onRail) {
        this.wagon = wagon;
        this.current = current;
        this.position;
        this.onRail = onRail;
        this.from = this.onRail.node1;
        this.to = this.onRail.node2;
        this.front = false;
    }

    ChangeDirection() {
        const temp = this.from;
        this.from = this.to;
        this.to = temp;
        this.current = this.onRail.Distance() - this.current;
    }

    Update(speed) {
        var dstToNextTrack = this.onRail.Distance();

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

        var t = this.current / dstToNextTrack;
        this.position = this.onRail.PointAlongRail(t, this.from.position, this.to.position);
    }

    Draw() {
        if (DEBUG_MODE) {
            sketch.push();
            this.front ? sketch.fill(150, 255, 150) : sketch.fill(255, 150, 150);
            sketch.ellipse(this.position.x, this.position.y, 10);
            sketch.pop();
        }
    }
}
