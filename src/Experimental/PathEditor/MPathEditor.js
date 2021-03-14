export class MPathEditor {
    constructor(pos) {
        this.position = pos;
        this.creator;

        this.segmentSelectDistanceThreshold = 10;
        this.selectedSegmentIndex = -1;

        InputHandler.RegisterObserver(this, this.OnEventNotify);

        print('Instructions:');
        print('Shift + LMB to add a new Anchor Point');
        print('Shift + LMB on a curve to insert a new Anchor Point in between');
        print('Ctrl + LMB on a Anchor Point to delete it');
        print('');
        print('Actions:');
        print('Editor.Path.ToggleClosed()');
        print('Editor.Path.AutoSetAllControlPoints()');
        print('Editor.creator.displayControlPoints = boolean');
    }

    get Path() {
        return this.creator.path;
    }

    Update() {}

    Draw() {
        if (this.creator == null) return;

        // check if handle moved, set position
        for (var i = 0; i < this.Path.NumPoints; i++) {
            if (i % 3 == 0 || this.creator.displayControlPoints) {
                Handles.color = i % 3 == 0 ? this.creator.anchorColor : this.creator.controlColor;
                var handleSize = i % 3 == 0 ? this.creator.anchorDiamater : this.creator.controlDiameter;
                var newPos = Handles.FreeMoveHandle(i, this.Path.points[i], handleSize);
                if (this.Path.points[i] != newPos) {
                    this.Path.MovePoint(i, newPos);
                }
            }
        }

        strokeWeight(2);
        noFill();

        for (var i = 0; i < this.Path.NumSegments; i++) {
            var pos = this.Path.points[i];
            var points = this.Path.GetPointsInSegment(i);

            if (this.creator.displayControlPoints) {
                stroke('#DFD9E2');
                line(points[1].x, points[1].y, points[0].x, points[0].y);
                line(points[2].x, points[2].y, points[3].x, points[3].y);
            }

            this.selectedSegmentIndex == i ? stroke(this.creator.SelectedSegmentColor) : stroke(this.creator.segmentColor);
            bezier(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
        }
    }

    OnEventNotify(event) {
        // Add Segment
        if (event.event == 'MOUSE_DOWN' && event.button == 'left' && keyIsDown(16)) {
            if (this.selectedSegmentIndex != -1) {
                this.Path.SplitSegment(event.position, this.selectedSegmentIndex);
            } else if (!this.Path.isClosed) {
                this.Path.AddSegment(event.position);
            }
        }

        // Delete Segment
        if (event.event == 'MOUSE_DOWN' && event.button == 'left' && keyIsDown(17)) {
            var minDstToAnchor = this.creator.anchorDiamater * 0.5;
            var closestAnchorIndex = -1;
            for (var i = 0; i < this.Path.NumPoints; i += 3) {
                var dst = event.position.dist(this.Path.points[i]);
                if (dst < 20) {
                    minDstToAnchor = dst;
                    closestAnchorIndex = i;
                }
            }
            if (closestAnchorIndex != -1) {
                this.Path.DeleteSegment(closestAnchorIndex);
            }
        }

        // Detect hover on curve
        if (event.event == 'MOUSE_MOVE') {
            var minDstToSegment = this.segmentSelectDistanceThreshold;
            var newSelectedSegmentIndex = -1;
            for (var i = 0; i < this.Path.NumSegments; i++) {
                var points = this.Path.GetPointsInSegment(i);
                var dst = MBezier.DistancePointBezier(event.position, points[0], points[3], points[1], points[2]);
                if (dst < minDstToSegment) {
                    minDstToSegment = dst;
                    newSelectedSegmentIndex = i;
                }
            }

            if (newSelectedSegmentIndex != this.selectedSegmentIndex) {
                this.selectedSegmentIndex = newSelectedSegmentIndex;
            }
        }
    }

    OnEnable(creator) {
        this.creator = creator;
        if (this.creator.Path == null) {
            this.creator.CreatePath();
        }
    }
}
