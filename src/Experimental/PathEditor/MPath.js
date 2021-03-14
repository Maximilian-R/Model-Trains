export class MPath {
    constructor(centre) {
        this.points = [
            p5.Vector.add(centre, createVector(-100, 0)),
            p5.Vector.add(centre, createVector(0, -100)),
            p5.Vector.add(centre, createVector(100, 100)),
            p5.Vector.add(centre, createVector(200, 0)),
        ];
        this.isClosed = false;
        this.evenlySpacedPoints = [];
        this.updateEvenlySpacedPoints = false;
    }

    Update() {
        if (this.updateEvenlySpacedPoints) {
            this.updateEvenlySpacedPoints = false;
            this.CalculateEvenlySpacedPoints(10, 1);
        }
    }

    Draw() {
        for (var i = 0; i < this.evenlySpacedPoints.length; i++) {
            noStroke();
            fill(0, 0, 255);
            ellipse(this.evenlySpacedPoints[i].x, this.evenlySpacedPoints[i].y, 5);
        }
    }

    get NumPoints() {
        return this.points.length;
    }

    get NumSegments() {
        return Math.floor(this.NumPoints / 3);
    }

    AddSegment(anchorPos) {
        this.points.push(
            this.points[this.NumPoints - 1]
                .copy()
                .mult(2)
                .sub(this.points[this.NumPoints - 2]),
        );
        this.points.push(this.points[this.NumPoints - 1].copy().add(anchorPos).mult(0.5));
        this.points.push(anchorPos);
        this.updateEvenlySpacedPoints = true;
    }

    SplitSegment(anchorPos, segmentIndex) {
        this.points.splice(segmentIndex * 3 + 2, 0, createVector(0, 0), anchorPos, createVector(0, 0));
        this.AutoSetAnchorControlPoints(segmentIndex * 3 + 3);
        this.updateEvenlySpacedPoints = true;
    }

    DeleteSegment(anchorIndex) {
        if (this.NumSegments > 2 || (!this.isClosed && this.NumSegments > 1)) {
            if (anchorIndex == 0) {
                if (this.isClosed) this.points[this.NumPoints - 1] = this.points[2];
                this.points.splice(0, 3);
            } else if (anchorIndex == this.NumPoints - 1 && !this.isClosed) {
                this.points.splice(anchorIndex - 2, 3);
            } else {
                this.points.splice(anchorIndex - 1, 3);
            }
        }
        this.updateEvenlySpacedPoints = true;
    }

    GetPointsInSegment(i) {
        return [this.points[i * 3], this.points[i * 3 + 1], this.points[i * 3 + 2], this.points[this.LoopIndex(i * 3 + 3)]];
    }

    MovePoint(i, newPos) {
        var deltaMove = newPos.copy().sub(this.points[i]);
        this.points[i] = newPos;

        if (i % 3 == 0) {
            //is anchor point
            if (i + 1 < this.NumPoints || this.isClosed) this.points[this.LoopIndex(i + 1)].add(deltaMove);
            if (i - 1 >= 0 || this.isClosed) this.points[this.LoopIndex(i - 1)].add(deltaMove);
        } else {
            //not anchor point
            var nextPointIsAnchor = (i + 1) % 3 == 0;
            var correspondingControlIndex = nextPointIsAnchor ? i + 2 : i - 2;
            var anchorIndex = nextPointIsAnchor ? i + 1 : i - 1;

            if ((correspondingControlIndex >= 0 && correspondingControlIndex < this.NumPoints) || this.isClosed) {
                var dst = this.points[this.LoopIndex(anchorIndex)].dist(this.points[this.LoopIndex(correspondingControlIndex)]);
                var dir = p5.Vector.sub(this.points[this.LoopIndex(anchorIndex)], newPos).normalize();
                this.points[this.LoopIndex(correspondingControlIndex)] = this.points[this.LoopIndex(anchorIndex)].copy().add(dir.mult(dst));
            }
        }
        // this.updateEvenlySpacedPoints = true;
    }

    ToggleClosed() {
        this.isClosed = !this.isClosed;

        if (this.isClosed) {
            this.points.push(
                this.points[this.NumPoints - 1]
                    .copy()
                    .mult(2)
                    .sub(this.points[this.NumPoints - 2]),
            );
            this.points.push(this.points[0].copy().mult(2).sub(this.points[1]));
        } else {
            this.points.splice(this.NumPoints - 2, 2);
        }
        this.updateEvenlySpacedPoints = true;
    }

    /*
  TODO:
    Calculate evenlyspaced points ONLY when a changed has been made to the
    curve. Store theese in a class variable.
  */

    CalculateEvenlySpacedPoints(spacing, resolution = 1) {
        var evenlySpacedPoints = [];
        var previousPoint = this.points[0].copy();
        evenlySpacedPoints.push(previousPoint);
        var dstSinceLastEvenPoint = 0;

        for (var segmentIndex = 0; segmentIndex < this.NumSegments; segmentIndex++) {
            var p = this.GetPointsInSegment(segmentIndex);
            var controlNetLength = p5.Vector.dist(p[0], p[1]) + p5.Vector.dist(p[1], p[2]) + p5.Vector.dist(p[2], p[3]);
            var estimatedCurveLength = p5.Vector.dist(p[0], p[3]) + controlNetLength / 2;
            var divisions = ceil(estimatedCurveLength * resolution * 10);
            var t = 0;
            while (t <= 1) {
                t += 1 / divisions;
                var x = MBezier.CubicCurve(p[0].x, p[1].x, p[2].x, p[3].x, t);
                var y = MBezier.CubicCurve(p[0].y, p[1].y, p[2].y, p[3].y, t);
                var pointOnCurve = createVector(x, y);
                dstSinceLastEvenPoint += p5.Vector.dist(previousPoint, pointOnCurve);
                while (dstSinceLastEvenPoint >= spacing) {
                    var overshootDst = dstSinceLastEvenPoint - spacing;
                    var newEvenlySpacedPoint = pointOnCurve
                        .copy()
                        .add(p5.Vector.sub(previousPoint, pointOnCurve).normalize().mult(overshootDst));
                    evenlySpacedPoints.push(newEvenlySpacedPoint);
                    dstSinceLastEvenPoint = overshootDst;
                    previousPoint = newEvenlySpacedPoint;
                }

                previousPoint = pointOnCurve;
            }
        }

        this.evenlySpacedPoints = evenlySpacedPoints;
        return evenlySpacedPoints;
    }

    AutoSetAllAffectedControlPoints(updatedAnchorIndex) {
        for (var i = updatedAnchorIndex; i <= updatedAnchorIndex + 3; i += 3) {
            if ((i >= 0 && i < this.NumPoints) || this.isClosed) {
                this.AutoSetAnchorControlPoints(this.LoopIndex(i));
            }
        }
        this.AutoSetStartAndEndControls();
        this.updateEvenlySpacedPoints = true;
    }

    AutoSetAllControlPoints() {
        for (var i = 0; i < this.NumPoints; i += 3) {
            this.AutoSetAnchorControlPoints(i);
        }

        this.AutoSetStartAndEndControls();
        this.updateEvenlySpacedPoints = true;
    }

    AutoSetAnchorControlPoints(anchorIndex) {
        var anchorPos = this.points[anchorIndex];
        var dir = createVector(0, 0);
        var neighbourDistances = [];

        if (anchorIndex - 3 >= 0 || this.isClosed) {
            var offset = this.points[this.LoopIndex(anchorIndex - 3)].copy().sub(anchorPos);
            dir.add(offset.copy().normalize());
            neighbourDistances[0] = offset.mag();
        }
        if (anchorIndex + 3 >= 0 || this.isClosed) {
            var offset = this.points[this.LoopIndex(anchorIndex + 3)].copy().sub(anchorPos);
            dir.sub(offset.copy().normalize());
            neighbourDistances[1] = -offset.mag();
        }

        dir.normalize();

        for (var i = 0; i < 2; i++) {
            var controlIndex = anchorIndex + i * 2 - 1;
            if ((controlIndex >= 0 && controlIndex < this.NumPoints) || this.isClosed) {
                this.points[this.LoopIndex(controlIndex)] = anchorPos.copy().add(dir.copy().mult(neighbourDistances[i] * 0.5));
            }
        }
        this.updateEvenlySpacedPoints = true;
    }

    AutoSetStartAndEndControls() {
        if (!this.isClosed) {
            this.points[1] = p5.Vector.add(this.points[0], this.points[2]).mult(0.5);
            this.points[this.NumPoints - 2] = p5.Vector.add(this.points[this.NumPoints - 1], this.points[this.NumPoints - 3]).mult(0.5);
        }
        this.updateEvenlySpacedPoints = true;
    }

    LoopIndex(i) {
        return (i + this.NumPoints) % this.NumPoints;
    }
}
export class MPathCreator {
    constructor(pos) {
        this.position = pos;
        this.path;

        this.anchorColor = sketch.color('#22223B');
        this.controlColor = sketch.color('#538083');
        this.segmentColor = sketch.color('#2A7F62');
        this.SelectedSegmentColor = sketch.color(0, 255, 255);
        this.anchorDiamater = 20;
        this.controlDiameter = 16;
        this.displayControlPoints = true;
    }

    CreatePath() {
        this.path = new MPath(this.position);
    }
}
