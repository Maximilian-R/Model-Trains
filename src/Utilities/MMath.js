import { MVector } from '../Utilities/MVector.js';

export class MArc {
    static ToAngle(p, origin) {
        return Math.atan2(p.y - origin.y, p.x - origin.x);
    }

    static BiarcValidControlCircle(p1, t1, p2, t2) {
        var v1 = p5.Vector.sub(p2, p1);
        var v2 = p5.Vector.add(p2, p5.Vector.mult(t2, -100)).sub(p5.Vector.add(p1, p5.Vector.mult(t1, 100)));
        var m1 = p5.Vector.add(p1, p5.Vector.mult(v1, 0.5));
        var m2 = p5.Vector.add(p1, p5.Vector.mult(t1, 100)).add(p5.Vector.mult(v2, 0.5));
        var p = MLine.IntersectLines(m1, p5.Vector.add(m1, MVector.RotateLeft(v1)), m2, p5.Vector.add(m2, MVector.RotateLeft(v2)));
        var r = 0;
        if (p == null) {
            p = sketch.createVector(-100, -100);
        } else {
            var temp = p1.copy().sub(p);
            r = sketch.sqrt(temp.x * temp.x + temp.y * temp.y);
        }
        return { center: p, radius: r };
    }
}

export class MCirlce {
    /*
        Return the distance around a circle with given radius
    */
    static Circumference(radius) {
        return 2 * sketch.PI * radius;
    }

    /*
        Calculates the radian angle between two vectors.
        Returns a value between -2PI and 2PI
    */
    static RadianAngleBetweenPoints(v0, v1) {
        return Math.atan2(v1.y - v0.y, v1.x - v0.x) * 2;
    }

    static RadianAngleBetweenPoints(v0, v1, origin) {
        var startAngle = Math.atan2(v0.y - origin.y, v0.x - origin.x);
        var endAngle = Math.atan2(v1.y - origin.y, v1.x - origin.x);
        var angle = endAngle - startAngle;
        if (angle < 0) {
            angle += sketch.TWO_PI;
        }
        return angle;
    }
}

export class MLine {
    static PointAlongLine(p1, p2, t) {
        var v = p5.Vector.sub(p2, p1);
        var u = v.normalize();
        var d = p5.Vector.dist(p1, p2) * t;
        return p1.copy().add(u.mult(d));
    }

    /*
    Find a point (distance away from startpoint) along the perpendicular line,
    from a given startpoint and direction.
  */
    static PointPerpendicularToDirection(v0, direction, distance) {
        var v = sketch.createVector(0, 0);
        v.x = v0.x - distance * direction.y;
        v.y = v0.y + distance * direction.x;
        return v;
    }

    static MidPoint(v0, v1) {
        return sketch.createVector((v0.x + v1.x) / 2, (v0.y + v1.y) / 2);
    }

    static Slope(v0, v1) {
        return (v1.y - v0.y) / (v1.x - v0.x);
    }

    /*
    Perpendicular Bisector C D of a line segment A B is a line segment
    perpendicular to A B and passing through the midpoint of A B.
    Return: The slope of the Perpendicular Bisector line segment
  */
    static PerpendicularBisector(v0, v1) {
        return -((v1.x - v0.x) / (v1.y - v0.y));
    }

    static Direction(v0, v1) {
        return v0.copy().sub(v1).normalize();
    }

    // Return the intersection of a line p1-p2 and line p3-p4, or null if parallel
    static IntersectLines(p1, p2, p3, p4) {
        // Intersect two lines, http://paulbourke.net/geometry/pointlineplane/
        var d = 1 / ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
        var ua = d * ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x));
        var ub = d * ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x));
        if (sketch.abs(d) < 1e-9) {
            return null;
        } else {
            return p1.copy().add(p2.copy().sub(p1).mult(ua));
        }
    }
}

export class MBezier {
    static QuadraticCurve(a, b, c, t) {
        var p0 = lerp(a, b, t);
        var p1 = lerp(b, c, t);
        return lerp(p0, p1, t);
    }

    static CubicCurve(a, b, c, d, t) {
        var p0 = MBezier.QuadraticCurve(a, b, c, t);
        var p1 = MBezier.QuadraticCurve(b, c, d, t);
        return lerp(p0, p1, t);
    }

    // Returns the shortest distance from a point in the bezier
    static DistancePointBezier(position, start, end, startTangent, endTangent) {
        var iterations = 4; // FIND GOOD VALUES? Dependent of the length of bexier?
        var slices = 4; // FIND GOOD VALUES?
        var t = MBezier.GetClosestPointToCubicBezier(
            iterations,
            position,
            0,
            1,
            slices,
            start.x,
            start.y,
            startTangent.x,
            startTangent.y,
            endTangent.x,
            endTangent.y,
            end.x,
            end.y,
        );
        var x = MBezier.CubicCurve(start.x, startTangent.x, endTangent.x, end.x, t);
        var y = MBezier.CubicCurve(start.y, startTangent.y, endTangent.y, end.y, t);

        return sketch.createVector(x, y).dist(position);
    }

    // Iteration = times to call the function with start and end values
    // Tick = check to do within each start -> end
    //private
    static GetClosestPointToCubicBezier(iterations, position, start, end, slices, x0, y0, x1, y1, x2, y2, x3, y3) {
        if (iterations <= 0) return (start + end) / 2;
        var tick = (end - start) / slices;
        var x, y, dx, dy;
        var best = 0;
        var bestDistance = 10000; // godtyckligt för stort värde.
        var currentDistance;
        var t = start;
        while (t <= end) {
            //B(t) = (1-t)**3 p0 + 3(1 - t)**2 t P1 + 3(1-t)t**2 P2 + t**3 P3
            x = (1 - t) * (1 - t) * (1 - t) * x0 + 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t * x3;
            y = (1 - t) * (1 - t) * (1 - t) * y0 + 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t * y3;

            dx = x - position.x;
            dy = y - position.y;
            dx *= dx;
            dy *= dy;
            currentDistance = dx + dy;
            if (currentDistance < bestDistance) {
                bestDistance = currentDistance;
                best = t;
            }
            t += tick;
        }
        return MBezier.GetClosestPointToCubicBezier(
            iterations - 1,
            position,
            Math.max(best - tick, 0),
            Math.min(best + tick, 1),
            slices,
            x0,
            y0,
            x1,
            y1,
            x2,
            y2,
            x3,
            y3,
        );
    }
}
