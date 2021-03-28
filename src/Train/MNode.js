import { MDraw } from '../Utilities/MDraw.js';
import { MVector } from '../Utilities/MVector.js';

const NODE_COLLISION_RADIUS = 30;
let NODE_ID = 0;

export class MNodeJoint {
    constructor(node, id) {
        this.id = id;
        this.node = node;
        this.rail;
    }

    get direction() {
        return this === this.node.in ? MVector.Invert(this.node.direction) : this.node.direction;
    }

    get position() {
        return this.node.position;
    }

    get isEmpty() {
        return this.rail === undefined;
    }

    Connect(rail) {
        this.rail = rail;
    }

    Remove(rail) {
        this.rail = undefined;
    }

    Collision(position) {
        const trigger = MVector.Add(this.position, MVector.Mult(this.direction, 10));
        return MVector.Dist(trigger, position) < NODE_COLLISION_RADIUS;
    }
}

export class MSwitchNodeJoint {
    constructor(node, id) {
        this.id = id;
        this.node = node;
        this.rails = [];
    }

    get direction() {
        return this === this.node.in ? MVector.Invert(this.node.direction) : this.node.direction;
    }

    get position() {
        return this.node.position;
    }

    get isEmpty() {
        return this.rails.length === 0;
    }

    Connect(rail) {
        this.rails.push(rail);
    }

    Remove(rail) {
        this.rails.splice(this.rails.indexOf(rail), 1);
    }

    Collision(position) {
        const trigger = MVector.Add(this.position, MVector.Mult(this.direction, 10));
        return MVector.Dist(trigger, position) < NODE_COLLISION_RADIUS;
    }
}

export class MNode {
    constructor(position, direction = MVector.Create()) {
        this.in = new MNodeJoint(this, 'in'); // red
        this.out = new MNodeJoint(this, 'out'); // green
        this.id = NODE_ID++;

        this.position = position;
        this.direction = direction;
        this.highlight = false;
    }

    set direction(_direction) {
        this._direction = _direction.normalize();
    }

    get direction() {
        return this._direction;
    }

    get emptyDirection() {
        return this.out.isEmpty ? this.direction : MVector.Invert(this.direction);
    }

    get isEmpty() {
        return this.in.isEmpty && this.out.isEmpty;
    }

    OppositeRail(rail) {
        if (rail === this.in.rail) {
            return this.out.rail;
        } else if (rail === this.out.rail) {
            return this.in.rail;
        } else {
            console.error('Node does not have an opposite rail');
        }
    }

    OppositeJoint(joint) {
        if (joint === this.in) {
            return this.out;
        } else if (joint === this.out) {
            return this.in;
        } else {
            console.error('Joint does not have an opposite joint');
        }
    }

    // SetEmptyRail(rail) {
    //     if (this.in.isEmpty) {
    //         this.in.rail = rail;
    //     } else if (this.out.isEmpty) {
    //         this.out.rail = rail;
    //     } else {
    //         console.error('Node has already two connected rails');
    //     }
    // }

    GetAnyRail() {
        if (!this.in.isEmpty) {
            return this.in.rail;
        } else if (!this.out.isEmpty) {
            return this.out.rail;
        } else {
            return undefined;
            console.error('Node has no rail');
        }
    }

    // ReplaceRail(removeRail, replaceRail) {
    //     if (this.in.rail === removeRail) {
    //         this.in.rail = replaceRail;
    //     } else if (this.out.rail === removeRail) {
    //         this.out.rail = replaceRail;
    //     } else {
    //         console.error('The rail to replace does not belong to this node');
    //     }
    // }

    // RemoveRail(rail) {
    //     if (this.in.rail === rail) {
    //         this.in.rail = undefined;
    //     } else if (this.out.rail === rail) {
    //         this.out.rail = undefined;
    //     } else {
    //         console.error('The rail to remove does not belong to this node');
    //     }
    // }

    Collision(position) {
        return MVector.Dist(this.position, position) < NODE_COLLISION_RADIUS;
    }

    Draw() {
        sketch.push();

        if (DEBUG_SETTINGS.node.position) {
            sketch.strokeWeight(10);
            sketch.stroke(150, 150, 150);
            MDraw.Point(this.position);
        }

        if (DEBUG_SETTINGS.node.direction) {
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

    Export() {
        const position = { x: this.position.x, y: this.position.y };
        const direction = { x: this.direction.x, y: this.direction.y };
        const type = this instanceof MSwitchNode ? 1 : 0;
        return { position: position, direction: direction, type };
    }
}

export class MSwitchNode extends MNode {
    constructor(position, direction) {
        super(position, direction);
        this.in = new MNodeJoint(this, 'in'); // red
        this.out = new MSwitchNodeJoint(this, 'out'); // green
        this.switch = 0;
    }

    // HasEmptyRail() {
    //     return this.in === undefined || this.out.length <= 1;
    // }

    OppositeRail(rail) {
        if (rail === this.in.rail) {
            return this.out.rails[this.switch];
        } else {
            return this.in.rail;
        }
    }

    Switch() {
        this.switch++;
        if (this.switch > this.out.rails.length - 1) {
            this.switch = 0;
        }
    }

    // ReplaceRail(removeRail, replaceRail) {
    //     if (this.in === removeRail) {
    //         this.in = replaceRail;
    //     } else if (this.out.indexOf(removeRail) >= 0) {
    //         this.out[this.out.indexOf(removeRail)] = replaceRail;
    //     } else {
    //         console.error('The rail to replace does not belong to this node');
    //     }
    // }

    // SetEmptyRail(rail) {
    //     if (this.in === undefined) {
    //         this.in = rail;
    //     } else if (this.out.length <= 1) {
    //         this.out.push(rail);
    //     } else {
    //         console.error('Node has already two connected rails');
    //     }
    // }

    GetAnyRail() {
        if (this.in.isEmpty) {
            return this.in.rail;
        } else if (this.out.length > 0) {
            return this.out.rails[0];
        } else {
            return undefined;
            console.error('Node has no rail');
        }
    }

    // RemoveRail(rail) {
    //     if (this.in === rail) {
    //         this.in = undefined;
    //     } else if (this.out.indexOf(rail) >= 0) {
    //         this.out.splice(this.out.indexOf(rail), 1);
    //     } else {
    //         console.error('The rail to remove does not belong to this node');
    //     }
    // }

    /* 
        Invert direction and therfore also rail 1 with rail 2
        Should Route be doing responsible for doing this?
    */
    Invert() {
        if (this.out.rails.length > 1) {
            console.error('This switch cannot be inverted, it has' + this.out.rails.length + ' possibilites');
        } else {
            const update = (rail, current, target) => {
                if (rail.joint1 === current) {
                    rail.joint1 = target;
                } else if (rail.joint2 === current) {
                    rail.joint2 = target;
                }
            };
            update(this.in.rail, this.in, this.out);
            update(this.out.rails[0], this.out, this.in);

            const temp = this.in.rail;
            this.in.rail = this.out.rails[0];
            this.out.rails = [temp];

            this.direction = MVector.Invert(this.direction);
        }
    }

    Collision(position) {
        return MVector.Dist(this.position, position) < NODE_COLLISION_RADIUS / 2;
    }

    Draw() {
        super.Draw();
        sketch.push();
        sketch.translate(this.position.x, this.position.y);
        sketch.noStroke();
        this.out.rails.forEach((_, i) => {
            this.switch == i ? sketch.fill(0) : sketch.fill(255, 0, 0);
            sketch.ellipse(0 + i * 12, 0 - 16, 10, 10);
        });
        this.highlight ? sketch.fill(0, 200, 200, 200) : sketch.fill(0, 0, 150, 100);
        sketch.ellipse(0, 0, NODE_COLLISION_RADIUS, NODE_COLLISION_RADIUS);

        if (DEBUG_SETTINGS.node.switchSplit) {
            const render = (joint, rail, output) => {
                const t = 100 / rail.Distance();

                const point = rail.PointAlongRail(t, joint.position, rail.OppositeJoint(joint).position).sub(this.position);
                sketch.strokeWeight(2);
                output ? sketch.stroke(175, 50, 255) : sketch.stroke(255, 255, 50);
                MDraw.Line(MVector.Create(), point);
            };

            !this.in.isEmpty && render(this.in, this.in.rail, false);
            this.out.rails.forEach((rail) => render(this.out, rail, true));
        }
        sketch.pop();
    }
}
