import { MVector } from '../Utilities/MVector.js';
import { MLine, MArc } from '../Utilities/MMath.js';
import { MDraw } from '../Utilities/MDraw.js';
import { MKeyEvent } from '../Utilities/MInput.js';
import { KEY_MAP } from '../Game/MControls.js';
import { MRailLineEdge, MRailCurveEdge } from '../Train/MTracks.js';
import { MSwitchNode } from '../Train/MNode.js';

/* AVNÄNDE DEN HÄR FÖR ATT AUTOCOMPLET:A TILL EN ANNAN nodeEnd
https://www.redblobgames.com/articles/curved-paths/#properties
BIARCS!
*/

/*

    1. Add State

        Mouse Move:
            Check collision with rail -> force to center of rail

        Mouse Click: 
            Check collision with node ends -> 1.1
            Check collision with rail -> 1.2
            No collision -> 1.3

        1.1 Initiate building from node end
            1.1.1 Buildstate(fromNode)

        1.2 Initiate building from rail (switch)
            1.2.1 Create a switch(onRail, atPosition)
            1.2.2 Buildstate(fromNode)

        1.3 Initiate building from mouse position
            1.3.1 Create a node(position)
            1.3.2 Buildstate(fromNode)

    2. Build State

        On Enter:
            Filter end-nodes that could possibly be connected
        
        Mouse Move:
            

    Route
        nodes
        rails

        CreateNode(position)
            new Node(position, default direction = (1, 0))
            add to nodes

        CreateSwitch(rail, position)
            tangent of rail
            new SwitchNode(position, tangent)
            add to nodes
            remove rail
            Create rail1 (rail.joint1, switch)
            Create rail2 (switch, rail.joint2)
            rail.joint1 replace (oldrail with rail1)
            rail.joint2 replace (oldrail with rail2)

        CreateRail(fromNode, toNode)
            isStraight? new RailLine(from, to) : new RailCurve(from, to)
            add to rails



*/

export class MRouteEditor {
    // Editor
    constructor(camera, Input, cursor, route) {
        this.camera = camera;
        this.cursor = cursor;
        this.points = [MVector.Create(), MVector.Create(), MVector.Create()];
        this.cursor = cursor;
        this.route = route;
        this.state;
        this.nextState = new EditState(this);

        this.cursor.RegisterObserver(this, this.OnEventNotify);
        Input.RegisterObserver(this, this.OnEventNotify);
    }

    Draw() {
        this.route.Draw();
        this.state.Draw();
    }

    Update() {
        if (this.nextState) {
            this.state?.OnExit();
            this.state = this.nextState;
            this.state.OnEnter();
            this.nextState = undefined;
        }
        this.nextState = this.state.Update();
    }

    OnEventNotify(event) {
        if (event.event == 'CURSOR_MOVED') {
            this.points[0] = event.position;
        }
        if (this.state) this.state.OnUserInput(event);
    }
}

export class MEditorState {
    constructor(name, editor) {
        DEBUG_SETTINGS.editor.enter && console.log(name);
        this.editor = editor;
        this.nextState;
    }

    OnEnter() {}
    OnExit() {}
    Draw() {}
    Update() {
        if (this.nextState) {
            return this.nextState;
        }
    }
}

class EditState extends MEditorState {
    constructor(editor) {
        super('Enter Edit State', editor);

        this.hoverRail;
        this.hoverNode;
    }

    OnUserInput(event) {
        if (event.event == 'CURSOR_MOVED') {
            if (this.hoverNode) {
                this.hoverNode.highlight = false;
            }
            if (this.hoverRail) {
                this.hoverRail.highlight = false;
            }

            this.hoverNode = this.editor.route.GetNodeAt(this.editor.points[0]);
            this.hoverRail = this.editor.route.GetTrackAt(this.editor.points[0]);
            if (this.hoverNode) {
                this.hoverNode.highlight = true;
                this.hoverRail = undefined;
            } else if (this.hoverRail) {
                this.hoverRail.highlight = true;
            }
        }

        if (event.event == 'MOUSE_DOWN' && event.button == 'left') {
            if (this.hoverNode && this.hoverNode instanceof MSwitchNode) {
                this.hoverNode.Switch();
            }
            if (this.hoverRail) {
                this.nextState = new ModifyState(this.editor, this.hoverRail);
            }
        }

        if (event instanceof MKeyEvent) {
            switch (event.key) {
                case KEY_MAP.K2:
                    this.nextState = new AddState(this.editor);
                    break;
            }
        }
    }

    OnExit() {
        if (this.hoverRail) {
            this.hoverRail.highlight = false;
        }
        if (this.hoverNode) {
            this.hoverNode.highlight = false;
        }
    }
}

class ModifyState extends MEditorState {
    constructor(editor, rail) {
        super('Enter Modify State', editor);

        this.rail = rail;
    }

    OnEnter() {
        this.rail.highlight = true;
    }

    OnUserInput(event) {
        if (event instanceof MKeyEvent) {
            switch (event.key) {
                case KEY_MAP.D:
                    this.editor.route.DeleteRail(this.rail, true);
                    this.nextState = new EditState(this.editor);
                    break;
            }
        }
    }
}

class AddState extends MEditorState {
    constructor(editor) {
        super('Enter Add State', editor);

        this.hoverNodeJoint;
        this.hoverRail;
        this.emptyNodeJoints;
    }

    OnEnter() {
        this.emptyNodeJoints = this.editor.route.emptyNodeJoints;
    }

    Draw() {
        sketch.noFill();
        sketch.strokeWeight(3);
        this.emptyNodeJoints.forEach((joint) => {
            joint === this.hoverNodeJoint ? sketch.stroke(0, 80, 255, 255) : sketch.stroke(0, 200, 255, 200);
            MDraw.DrawTriangle(joint.position, joint.direction);
        });
    }

    Update() {
        if (!this.hoverNodeJoint) {
            this.editor.points[0] = window.Handles.FreeMoveHandle(0, this.editor.points[0], 15);
        }

        return super.Update();
    }

    OnUserInput(event) {
        if (event.event === 'MOUSE_DOWN' && event.button === 'left') {
            if (this.hoverNodeJoint) {
                this.nextState = new BuildState(this.editor, this.hoverNodeJoint);
            } else if (this.hoverRail) {
                const switchNode = this.editor.route.CreateSwitch(this.hoverRail, this.editor.points[0]);
                this.nextState = new BuildState(this.editor, switchNode.out);
            } else {
                const fromNode = this.editor.route.CreateNode(this.editor.points[0], MVector.Create(1, 0));
                this.nextState = new RotateNodeState(this.editor, fromNode);
            }
        }

        if (event.event === 'CURSOR_MOVED') {
            this.hoverNodeJoint = undefined;
            this.hoverRail = undefined;

            this.hoverNodeJoint = this.editor.route.GetEmptyNodeJointAt(this.editor.points[0]);
            if (!this.hoverNodeJoint) {
                this.hoverRail = this.editor.route.GetTrackAt(this.editor.points[0]);
                if (this.hoverRail) {
                    this.editor.points[0] = this.hoverRail.ClosestPositionOnTrack(this.editor.points[0], this.hoverRail);
                }
            }
        }

        if (event instanceof MKeyEvent) {
            switch (event.key) {
                case KEY_MAP.ESC:
                case KEY_MAP.K1:
                    this.nextState = new EditState(this.editor);
                    break;
            }
        }
    }
}

class BuildState extends MEditorState {
    constructor(editor, fromNodeJoint) {
        super('Enter Build State', editor);

        this.fromNodeJoint = fromNodeJoint;
        this.buildFromNode = fromNodeJoint.node;

        this.invert = false;
        this.availableNodeJoints = [];
        this.forceStraight = false;
    }

    OnEnter() {
        const rail = this.buildFromNode.GetAnyRail();
        const oppsite = undefined; //rail instanceof MRailLineEdge && rail.OppositeJoint(this.buildFromNode);
        this.availableNodeJoints = this.editor.route.emptyNodeJoints.filter(
            (joint) => joint.node !== oppsite && joint.node !== this.buildFromNode,
        );
    }

    Draw() {
        this.created.canBuild ? sketch.stroke(0, 255, 0) : sketch.stroke(255, 0, 0);
        sketch.strokeWeight(4);
        sketch.noFill();
        const rail = this.created.rail;
        if (rail instanceof MRailLineEdge) {
            MDraw.Line(rail.joint1.position, rail.joint2.position);
        } else {
            if (rail.sign_n) {
                MDraw.Arc(rail.origin, rail.radius * 2, rail.a1, rail.a2);
            } else {
                MDraw.Arc(rail.origin, rail.radius * 2, rail.a2, rail.a1);
            }
        }

        sketch.stroke(0, 200, 255, 200);
        sketch.noFill();
        sketch.strokeWeight(2);
        this.availableNodeJoints.forEach((node) => {
            MDraw.DrawTriangle(node.position, node.direction);
        });
    }

    Update() {
        this.editor.points[0] = window.Handles.FreeMoveHandle(0, this.editor.points[0], 15);

        this.created = this.editor.route.PlanRail(this.fromNodeJoint, this.editor.points[0], this.forceStraight);

        return super.Update();
    }

    OnUserInput(event) {
        if (event.event == 'MOUSE_DOWN' && event.button == 'left' && this.created.canBuild) {
            // Autobuild from selected node

            // TODO: COnnect nodes will again create a rail with another function... (than PlanRail)
            // Not good if the logic dont act the same in both.
            // One function should CREATE a rail dependent on direction etc...
            // One function should BUILD (adding it to the route)
            this.editor.route.AddNode(this.created.endNode);
            this.editor.route.AddRail(this.created.rail);
            this.editor.route.ConnectNodes(this.fromNodeJoint, this.created.endNode.in, this.created.rail);

            this.nextState = new BuildState(this.editor, this.created.endNode.out);
            this.editor.camera.Teleport(this.created.endNode.position);
        }

        if (event.event == 'CURSOR_MOVED') {
            //Detect hover on nodeEnd

            // TODO: Create function in som vector class?
            if (this.forceStraight) {
                this.editor.points[0] = MVector.ConstrainToLine(
                    this.buildFromNode.position,
                    this.fromNodeJoint.direction,
                    this.editor.points[0],
                );
            }

            this.availableNodeJoints.some((joint) => {
                if (this.editor.points[0].dist(joint.position) < 20) {
                    this.editor.points[2] = MLine.MidPoint(this.fromNodeJoint.position, joint.position);
                    this.nextState = new ConnectState(this.editor, this.fromNodeJoint, joint);
                    return true;
                }
                return false;
            });
        }

        if (event.event == 'KEY_PRESS' && event.key == KEY_MAP.ESC) {
            this.nextState = new AddState(this.editor);
        }

        if (event.event == 'KEY_PRESS' && event.key == KEY_MAP.SHIFT) {
            this.forceStraight = !this.forceStraight;
            if (this.forceStraight) {
                this.editor.points[0] = MVector.ConstrainToLine(
                    this.buildFromNode.position,
                    this.fromNodeJoint.direction,
                    this.editor.points[0],
                );
            }
        }

        if (event.event == 'KEY_PRESS' && event.key == KEY_MAP.I) {
            if (this.buildFromNode instanceof MSwitchNode) {
                this.buildFromNode.Invert();
            }
        }

        if (event.event == 'KEY_PRESS' && event.key == KEY_MAP.CTRL) {
            if (this.buildFromNode instanceof MSwitchNode) {
                // hold ctrl to create a switch as end?
            }
        }
    }
}

class ConnectState extends MEditorState {
    constructor(editor, fromJoint, toJoint) {
        super('Enter Connect State', editor);

        this.fromJoint = fromJoint;
        this.toJoint = toJoint;
        //this.buildFromNode = buildFrom;
        //this.buildToNode = buildTo;
        this.minRadius = 100;
        this.radiusLimit = 10000;
        this.biarcCircle;
        this.rail1;
        this.rail2;

        this.canBuild1 = false;
        this.canBuild2 = false;
    }

    Update() {
        this.canBuild1 = false;
        this.canBuild2 = false;

        if (this.biarcCircle) {
            const dir = MVector.Sub(this.editor.points[2], this.biarcCircle.center).normalize();
            this.editor.points[2] = MVector.Add(this.biarcCircle.center, dir.mult(this.biarcCircle.radius));
        }

        this.editor.points[2] = window.Handles.FreeMoveHandle(0, this.editor.points[2], 15);

        // TODO: Instead of creating a new each update, update values and handle every update in the RailCurve?
        const direction = MRailCurveEdge.CurveDirection(this.fromJoint, this.editor.points[2]);
        this.controlNode = this.editor.route.CreateNode(this.editor.points[2], direction, false);
        this.rail1 = new MRailCurveEdge(this.fromJoint, this.controlNode.in);
        this.rail2 = new MRailCurveEdge(this.toJoint, this.controlNode.out);

        this.biarcCircle = MArc.BiarcValidControlCircle(
            this.fromJoint.position,
            this.fromJoint.direction,
            this.toJoint.position,
            this.toJoint.direction,
        );

        if (this.controlNode.position.dist(this.rail1.origin) >= this.minRadius) {
            this.canBuild1 = true;
        }
        if (this.controlNode.position.dist(this.rail2.origin) >= this.minRadius) {
            this.canBuild2 = true;
        }

        return super.Update();
    }

    Draw() {
        const rail1 = this.rail1;
        const rail2 = this.rail2;
        sketch.strokeWeight(4);
        sketch.noFill();
        sketch.stroke(0, 0, 255);

        this.canBuild1 ? sketch.stroke(0, 255, 0) : sketch.stroke(255, 0, 0);
        if (rail1.sign_n) {
            MDraw.Arc(rail1.origin, rail1.radius * 2, rail1.a1, rail1.a2);
        } else {
            MDraw.Arc(rail1.origin, rail1.radius * 2, rail1.a2, rail1.a1);
        }
        this.canBuild2 ? sketch.stroke(0, 255, 0) : sketch.stroke(255, 0, 0);
        if (rail2.sign_n) {
            MDraw.Arc(rail2.origin, rail2.radius * 2, rail2.a1, rail2.a2);
        } else {
            MDraw.Arc(rail2.origin, rail2.radius * 2, rail2.a2, rail2.a1);
        }

        sketch.stroke(0, 0, 255, 100);

        sketch.ellipse(this.biarcCircle.center.x, this.biarcCircle.center.y, this.biarcCircle.radius * 2);
    }

    OnUserInput(event) {
        if (event.event == 'MOUSE_DOWN' && event.button == 'left' && this.canBuild1 && this.canBuild2) {
            this.editor.route.AddNode(this.controlNode);
            this.editor.route.ConnectNodes(this.fromJoint, this.controlNode.in);
            this.editor.route.ConnectNodes(this.controlNode.out, this.toJoint);
            this.nextState = new AddState(this.editor);
        }

        if (event.event == 'CURSOR_MOVED') {
            this.editor.points[2] = this.editor.points[0];
        }

        if (event.event == 'KEY_PRESS' && event.key == KEY_MAP.ESC) {
            this.nextState = new BuildState(this.editor, this.fromJoint);
        }
    }
}

class RotateNodeState extends MEditorState {
    constructor(editor, node) {
        super('Enter Rotate Node State', editor);

        this.node = node;
    }

    Update() {
        this.editor.points[0] = window.Handles.FreeMoveHandle(0, this.editor.points[0], 15);
        return super.Update();
    }

    Draw() {
        sketch.stroke(0, 200, 255, 200);
        sketch.noFill();
        sketch.strokeWeight(2);
        MDraw.DrawTriangle(this.node.position, this.node.direction);
    }

    OnUserInput(event) {
        if (event.event == 'MOUSE_DOWN' && event.button == 'left') {
            this.nextState = new BuildState(this.editor, this.node.out);
        }

        if (event.event == 'CURSOR_MOVED') {
            this.node.direction = MVector.Sub(this.editor.points[0], this.node.position);
        }

        if (event instanceof MKeyEvent) {
            switch (event.key) {
                case KEY_MAP.ESC:
                    this.editor.route.DeleteNode(this.node);
                    this.nextState = new AddState(this.editor);
                    break;
            }
        }
    }
}
