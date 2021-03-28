import { MVector } from '../Utilities/MVector.js';
import { MLine, MArc } from '../Utilities/MMath.js';
import { MDraw } from '../Utilities/MDraw.js';

const RAIL_WIDTH = 12;
const RAIL_STROKE_WIDTH = 2;
const RAIL_MIDDLE_STROKE_WEIGHT = 6;
const RAIL_STROKE_COLOR = '#63615f';
const RAIL_STROKE_COLOR_LIT = '#42f4ee';
const CENTER_RAIL_STROKE_COLOR = '#7c674e';

export class MRailEdge {
    constructor(joint1, joint2) {
        this.joint1 = joint1;
        this.joint2 = joint2;
        this.highlight = false;
    }

    OppositeJoint(joint) {
        if (joint === this.joint1) {
            return this.joint2;
        } else if (joint === this.joint2) {
            return this.joint1;
        } else {
            console.error('Joint does not have an opposite joint');
        }
    }

    PointAlongRail(t, from, to) {}

    TangentAtPoint(position) {}

    ClosestPositionOnTrack(position) {}
}

export class MRailLineEdge extends MRailEdge {
    constructor(joint1, joint2) {
        super(joint1, joint2);

        this.splits = [];
        this.CreateSplits();
    }

    /* 
        Create points along the rail line with a distance of the railwidth.
        This can be used in collision detection to detect line + a distance of the width.
    */
    CreateSplits() {
        const points = Math.floor(this.Distance() / RAIL_WIDTH);
        for (let i = 0; i < points; i++) {
            const t = (i * points) / (points * points);
            const p = this.PointAlongRail(t, this.joint1.position, this.joint2.position);
            this.splits.push(p);
        }
    }

    Draw() {
        const from = this.joint1.position;
        const to = this.joint2.position;

        /* TWO RAILS: Simply visual */
        sketch.noFill();
        sketch.strokeWeight(RAIL_STROKE_WIDTH);
        this.highlight ? sketch.stroke(RAIL_STROKE_COLOR_LIT) : sketch.stroke(RAIL_STROKE_COLOR);
        const d = MLine.Direction(from, to);
        const offset = RAIL_WIDTH / 2;
        sketch.line(from.x - offset * d.y, from.y + offset * d.x, to.x - offset * d.y, to.y + offset * d.x);
        sketch.line(from.x + offset * d.y, from.y - offset * d.x, to.x + offset * d.y, to.y - offset * d.x);

        /* ONE RAIL: The one that trains will follow */
        sketch.strokeWeight(RAIL_MIDDLE_STROKE_WEIGHT);
        sketch.stroke(CENTER_RAIL_STROKE_COLOR);
        MDraw.Line(from, to);

        if (DEBUG_SETTINGS.rail.arc) {
            sketch.stroke(252, 179, 83);
            sketch.strokeWeight(2);
            if (this.joint1 && this.joint2) {
                MDraw.Line(this.joint1.position, this.joint2.position);
            }
        }
    }

    Distance() {
        return this.joint1.position.dist(this.joint2.position);
    }

    Collision(point) {
        return this.splits.some((p) => sketch.dist(p.x, p.y, point.x, point.y) < RAIL_WIDTH);
    }

    PointAlongRail(t, from, to) {
        return MLine.PointAlongLine(from, to, t);
    }

    TangentAtPoint(position) {
        return this.joint1.direction;
    }

    ClosestPositionOnTrack(position) {
        const distance = MVector.Dist(this.joint1.position, position);
        const direction = MVector.Sub(this.joint2.position, this.joint1.position).normalize();
        return MVector.Add(this.joint1.position, MVector.Mult(direction, distance));
    }

    // If fromNode.position + from.tangent-line * distance to toNode.position, it's a line.
    static IsStraight(from, to) {
        const target1 = MVector.Add(from.position, MVector.Mult(from.direction, MVector.Dist(from.position, to)));
        const target2 = MVector.Add(from.position, MVector.Mult(MVector.Invert(from.direction), MVector.Dist(from.position, to)));
        // Ignore small differences, positions should be limited to int.
        return MVector.AlmostEquals(target1, to, 0.5) || MVector.AlmostEquals(target2, to, 0.5);
    }

    Validate() {
        return true;
    }
}

export class MRailCurveEdge extends MRailEdge {
    constructor(joint1, joint2) {
        super(joint1, joint2);
        this.minRadius = 100;
        this.radiusLimit = 10000;

        this.v = MVector.Sub(this.joint2.position, this.joint1.position);
        this.n1 = MVector.RotateLeft(this.joint1.direction);

        //Unused
        this.midpoint = MVector.Add(this.joint1.position, MVector.Mult(this.v, 0.5));

        this.curvature = (2 * MVector.Dot(this.v, this.n1)) / this.v.magSq();
        this.radius = 1 / this.curvature;
        this.origin = MVector.Add(this.joint1.position, MVector.Mult(this.n1, this.radius));
        //sign_t means that the angular span exceeds 180 deg.
        this.sign_t = p5.Vector.dot(this.v, this.joint1.direction) < 0;
        //sign_n means that the angular span goes to the right side of the tangent
        this.sign_n = p5.Vector.dot(this.v, this.n1) < 0;
        this.n2 = MVector.Sub(this.origin, this.joint2.position)
            .normalize()
            .mult(this.sign_n ? 1 : -1);
        this.a1 = MArc.ToAngle(this.joint1.position, this.origin);
        this.a2 = MArc.ToAngle(this.joint2.position, this.origin);
    }

    // TODO: Replace somewhere. Direction of the toPosition like if the curve would continue
    static CurveDirection(from, toPosition) {
        const t1 = from.direction.copy();
        const v = MVector.Sub(toPosition, from.position);
        const n1 = MVector.RotateLeft(t1);
        const curvature = (2 * MVector.Dot(v, n1)) / v.magSq();
        const radius = 1 / curvature;
        const origin = MVector.Add(from.position, MVector.Mult(n1, radius));
        //sign_t means that the angular span exceeds 180 deg.
        const sign_t = MVector.Dot(v, t1) < 0;
        //sign_n means that the angular span goes to the right side of the tangent
        const sign_n = MVector.Dot(v, n1) < 0;
        const n2 = MVector.Sub(origin, toPosition)
            .normalize()
            .mult(sign_n ? 1 : -1);
        const t2 = MVector.RotateRight(n2);
        return MVector.Invert(t2);
    }

    Draw() {
        sketch.noFill();

        /* TWO RAILS, for drawing */
        sketch.strokeWeight(RAIL_STROKE_WIDTH);
        this.highlight ? sketch.stroke(RAIL_STROKE_COLOR_LIT) : sketch.stroke(RAIL_STROKE_COLOR);
        if (this.sign_n) {
            MDraw.Arc(this.origin, this.radius * 2 + RAIL_WIDTH, this.a1, this.a2);
            MDraw.Arc(this.origin, this.radius * 2 - RAIL_WIDTH, this.a1, this.a2);
        } else {
            MDraw.Arc(this.origin, this.radius * 2 + RAIL_WIDTH, this.a2, this.a1);
            MDraw.Arc(this.origin, this.radius * 2 - RAIL_WIDTH, this.a2, this.a1);
        }

        /* ONE RAIL, the one that trains will follow */
        sketch.strokeWeight(RAIL_WIDTH / 2);
        sketch.stroke(CENTER_RAIL_STROKE_COLOR);
        if (this.sign_n) {
            MDraw.Arc(this.origin, this.radius * 2, this.a1, this.a2);
        } else {
            MDraw.Arc(this.origin, this.radius * 2, this.a2, this.a1);
        }

        if (DEBUG_SETTINGS.rail.arc) {
            if (this.joint1 && this.joint2) {
                sketch.stroke(252, 179, 83);
                sketch.strokeWeight(2);
                MDraw.Line(this.joint1.position, this.origin);
                MDraw.Line(this.origin, this.joint2.position);

                sketch.strokeWeight(10);
                MDraw.Point(this.origin);
            }
        }
    }

    PointAlongRail(t, from, to) {
        const totalArcLength = this.Distance() / sketch.abs(this.radius);
        let atAngle = totalArcLength * t;
        let startAngle;

        if (MVector.Equals(from, this.joint1.position)) {
            startAngle = this.a1;
        } else {
            startAngle = this.a2;
            atAngle *= -1;
        }

        if (this.sign_n) {
            atAngle = startAngle + atAngle;
        } else {
            atAngle = startAngle - atAngle;
        }

        if (atAngle > sketch.PI) {
            atAngle -= sketch.TWO_PI;
        }
        if (atAngle < -sketch.PI) {
            atAngle += sketch.TWO_PI;
        }

        return sketch.createVector(
            this.origin.x + sketch.abs(this.radius) * sketch.cos(atAngle),
            this.origin.y + sketch.abs(this.radius) * sketch.sin(atAngle),
        );
    }

    TangentAtPoint(position) {
        if (this.sign_n) {
            return MVector.RotateRight(MVector.Sub(position, this.origin).normalize());
        } else {
            return MVector.RotateLeft(MVector.Sub(position, this.origin).normalize());
        }
    }

    ClosestPositionOnTrack(position) {
        const direction = MVector.Sub(position, this.origin).normalize();
        const distance = MVector.Dist(this.origin, this.joint2.position);
        return MVector.Add(this.origin, MVector.Mult(direction, distance));
    }

    Distance() {
        var da = sketch.abs(this.a2 - this.a1);
        if (!this.sign_t == da > sketch.PI) {
            da = 2 * sketch.PI - da;
        }
        return sketch.abs(da * this.radius);
    }

    Collision(point) {
        const distFromOrigin = this.origin.dist(point);
        if (distFromOrigin > sketch.abs(this.radius) - RAIL_WIDTH && distFromOrigin < sketch.abs(this.radius) + RAIL_WIDTH) {
            const angle = MArc.ToAngle(point, this.origin);

            /* https://math.stackexchange.com/questions/1044905/simple-angle-between-two-angles-of-circle */
            if (this.sign_n) {
                const end = this.a2 - this.a1 < 0 ? this.a2 - this.a1 + sketch.TWO_PI : this.a2 - this.a1;
                const mid = angle - this.a1 < 0 ? angle - this.a1 + sketch.TWO_PI : angle - this.a1;
                return mid < end;
            } else {
                const end = this.a1 - this.a2 < 0 ? this.a1 - this.a2 + sketch.TWO_PI : this.a1 - this.a2;
                const mid = angle - this.a2 < 0 ? angle - this.a2 + sketch.TWO_PI : angle - this.a2;
                return mid < end;
            }
        }
        return false;
    }

    Validate() {
        return this.joint2.position.dist(this.origin) >= this.minRadius;
    }
}
