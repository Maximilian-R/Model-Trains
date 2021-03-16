import { MDraw } from '../Utilities/MDraw.js';
import { MVector } from '../Utilities/MVector.js';

const NODE_COLLISION_RADIUS = 30;
let NODE_ID = 0;

export class MNode {
    constructor(position, direction = MVector.Create()) {
        this.rail1;
        this.rail2;
        this.id = NODE_ID++;

        this.position = position;
        this.direction = direction;
        this.highlight = false;
    }

    set direction(_direction) {
        this._direction = _direction.normalize();
    }

    // Always adjust direction to go towards the empty rail, if there is only one.
    get direction() {
        if (this.rail1 === undefined && this.rail2 === undefined) {
            return this._direction;
        }
        if (this.rail1 && this.rail2) {
            return this._direction;
        }
        return this.GetAnyRail().node1 === this ? MVector.Invert(this._direction) : this._direction;
    }

    OppositeRail(rail) {
        if (rail === this.rail1) {
            return this.rail2;
        } else if (rail === this.rail2) {
            return this.rail1;
        } else {
            console.error('Node does not have an opposite rail');
        }
    }

    SetEmptyRail(rail) {
        if (this.rail1 === undefined) {
            this.rail1 = rail;
        } else if (this.rail2 === undefined) {
            this.rail2 = rail;
        } else {
            console.error('Node has already two connected rails');
        }
    }

    GetAnyRail() {
        if (this.rail1) {
            return this.rail1;
        } else if (this.rail2) {
            return this.rail2;
        } else {
            return undefined;
            console.error('Node has no rail');
        }
    }

    ReplaceRail(removeRail, replaceRail) {
        if (this.rail1 === removeRail) {
            this.rail1 = replaceRail;
        } else if (this.rail2 === removeRail) {
            this.rail2 = replaceRail;
        } else {
            console.error('The rail to replace does not belong to this node');
        }
    }

    RemoveRail(rail) {
        if (this.rail1 === rail) {
            this.rail1 = undefined;
        } else if (this.rail2 === rail) {
            this.rail2 = undefined;
        } else {
            console.error('The rail to remove does not belong to this node');
        }
    }

    Collision(position) {
        return MVector.Dist(this.position, position) < NODE_COLLISION_RADIUS;
    }

    Draw() {
        sketch.push();
        sketch.strokeWeight(10);
        sketch.stroke(150, 150, 150);
        MDraw.Point(this.position);

        if (DEBUG_MODE) {
            // Tangent line
            const p1 = MVector.Add(this.position, MVector.Mult(this.direction, 40));
            const p2 = MVector.Add(this.position, MVector.Mult(this.direction, -40));

            sketch.strokeWeight(2);
            sketch.stroke(150, 150, 150);
            MDraw.Line(p1, p2);

            sketch.strokeWeight(10);
            sketch.stroke(150, 255, 150);
            MDraw.Point(p1);
            sketch.stroke(255, 150, 150);
            MDraw.Point(p2);
        }
        sketch.pop();
    }
}

export class MSwitchNode extends MNode {
    constructor(position, direction) {
        super(position, direction);
        this.rail2 = [];
        this.switch = 0;
    }

    set direction(_direction) {
        this._direction = _direction.normalize();
    }

    // Always adjust direction to go towards the empty rail, if there is only one.
    get direction() {
        if (this.rail1 === undefined && this.rail2.length == 0) {
            return this._direction;
        }
        if (this.rail1 && this.rail2.length > 0) {
            return this._direction;
        }
        return this.GetAnyRail().node2 === this ? MVector.Invert(this._direction) : this._direction;
    }

    OppositeRail(rail) {
        if (rail === this.rail1) {
            return this.rail2[this.switch];
        } else {
            return this.rail1;
        }
    }

    Switch() {
        this.switch++;
        if (this.switch > this.rail2.length - 1) {
            this.switch = 0;
        }
    }

    ReplaceRail(removeRail, replaceRail) {
        if (this.rail1 === removeRail) {
            this.rail1 = replaceRail;
        } else if (this.rail2.indexOf(removeRail) >= 0) {
            this.rail2[this.rail2.indexOf(removeRail)] = replaceRail;
        } else {
            console.error('The rail to replace does not belong to this node');
        }
    }

    SetEmptyRail(rail) {
        if (this.rail1 === undefined) {
            this.rail1 = rail;
        } else if (this.rail2.length < 2) {
            this.rail2.push(rail);
        } else {
            console.error('Node has already two connected rails');
        }
    }

    GetAnyRail() {
        if (this.rail1) {
            return this.rail1;
        } else if (this.rail2.length > 0) {
            return this.rail2[0];
        } else {
            console.error('Node has no rail');
        }
    }

    RemoveRail(rail) {
        if (this.rail1 === rail) {
            this.rail1 = undefined;
        } else if (this.rail2.indexOf(rail) >= 0) {
            this.rail2.splice(this.rail2.indexOf(rail), 1);
        } else {
            console.error('The rail to remove does not belong to this node');
        }
    }

    /* 
        Invert direction and therfore also rail 1 with rail 2
        Should Route be doing responsible for doing this?
    */
    Invert() {
        if (this.rail2.length > 1) {
            console.error('This switch cannot be inverted, it has' + this.rail2.length + ' possibilites');
        } else {
            const temp = this.rail1;
            this.rail1 = this.rail2[0];
            this.rail2 = [temp];
            this.direction = MVector.Invert(this.direction);
        }
    }

    Collision(position) {
        return MVector.Dist(this.position, position) < NODE_COLLISION_RADIUS / 2;
    }

    Draw() {
        sketch.push();
        super.Draw();
        sketch.translate(this.position.x, this.position.y);
        sketch.noStroke();
        this.rail2.forEach((_, i) => {
            this.switch == i ? sketch.fill(0) : sketch.fill(255, 0, 0);
            sketch.ellipse(0 + i * 12, 0 - 16, 10, 10);
        });
        this.highlight ? sketch.fill(0, 200, 200, 200) : sketch.fill(0, 0, 150, 100);
        sketch.ellipse(0, 0, NODE_COLLISION_RADIUS, NODE_COLLISION_RADIUS);
        sketch.pop();
    }
}
