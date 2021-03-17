import { MVector } from '../Utilities/MVector.js';
import { MLine, MArc } from '../Utilities/MMath.js';
import { MDraw } from '../Utilities/MDraw.js';
import { MKeyEvent } from '../Utilities/MEvent.js';
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
            Create rail1 (rail.node1, switch)
            Create rail2 (switch, rail.node2)
            rail.node1 replace (oldrail with rail1)
            rail.node2 replace (oldrail with rail2)

        CreateRail(fromNode, toNode)
            isStraight? new RailLine(from, to) : new RailCurve(from, to)
            add to rails



*/

export class MRouteEditor {
    // Editor
    constructor(GameCamera, InputHandler, route) {
        this.GameCamera = GameCamera;
        this.points = [MVector.Create(), MVector.Create(), MVector.Create()];
        this.route = route;
        this.state;
        this.nextState = new AddState(this);

        InputHandler.RegisterObserver(this, this.OnEventNotify);
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
        if (event.event == 'MOUSE_MOVE' || event.event == 'MOUSE_SCROLL') {
            this.points[0] = this.GameCamera.PositionInWorld(event.position);
        }
        if (this.state) this.state.OnUserInput(event);
    }
}

export class MEditorState {
    constructor(editor) {
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
        window.DEBUG_MODE && console.log('Enter Edit State');
        super(editor);

        this.hoverRail;
        this.hoverNode;
    }

    OnUserInput(event) {
        if (event.event == 'MOUSE_MOVE') {
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

class AddState extends MEditorState {
    constructor(editor) {
        window.DEBUG_MODE && console.log('Enter Add State');
        super(editor);

        this.hoverNodeEnd;
        this.hoverRail;
        this.railEnds;
    }

    OnEnter() {
        this.railEnds = this.editor.route.railEnds;
    }

    Draw() {
        sketch.noFill();
        sketch.strokeWeight(3);
        this.railEnds.forEach((node) => {
            node === this.hoverNodeEnd ? sketch.stroke(0, 80, 255, 255) : sketch.stroke(0, 200, 255, 200);
            MDraw.DrawTriangle(node.position, node.direction);
        });
    }

    Update() {
        if (!this.hoverNodeEnd) {
            this.editor.points[0] = window.Handles.FreeMoveHandle(0, this.editor.points[0], 15);
        }

        return super.Update();
    }

    OnUserInput(event) {
        if (event.event === 'MOUSE_DOWN' && event.button === 'left') {
            if (this.hoverNodeEnd) {
                this.nextState = new BuildState(this.editor, this.hoverNodeEnd);
            } else if (this.hoverRail) {
                const switchNode = this.editor.route.CreateSwitch(this.hoverRail, this.editor.points[0]);
                this.nextState = new BuildState(this.editor, switchNode);
            } else {
                const fromNode = this.editor.route.CreateNode(this.editor.points[0], MVector.Create(1, 0));
                this.nextState = new RotateNodeState(this.editor, fromNode);
            }
        }

        if (event.event === 'MOUSE_MOVE') {
            this.hoverNodeEnd = undefined;
            this.hoverRail = this.editor.route.GetTrackAt(this.editor.points[0]);
            if (this.hoverRail) {
                this.editor.points[0] = this.hoverRail.ClosestPositionOnTrack(this.editor.points[0], this.hoverRail);
            } else {
                this.hoverNodeEnd = this.editor.route.GetNodeEndAt(this.editor.points[0]);
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
    constructor(editor, buildFromNode) {
        window.DEBUG_MODE && console.log('Enter Build State');
        super(editor);

        this.buildFromNode = buildFromNode;

        this.invert = false;
        this.availableNodeEnds = [];
        this.forceStraight = false;
    }

    OnEnter() {
        const rail = this.buildFromNode.GetAnyRail();
        const oppsite = rail instanceof MRailLineEdge && rail.OppositeNode(this.buildFromNode);
        this.availableNodeEnds = this.editor.route.railEnds.filter((node) => node !== oppsite && node !== this.buildFromNode);
    }

    Draw() {
        this.created.canBuild ? sketch.stroke(0, 255, 0) : sketch.stroke(255, 0, 0);
        sketch.strokeWeight(4);
        sketch.noFill();
        const rail = this.created.rail;
        if (rail instanceof MRailLineEdge) {
            MDraw.Line(rail.node1.position, rail.node2.position);
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
        this.availableNodeEnds.forEach((node) => {
            MDraw.DrawTriangle(node.position, node.direction);
        });
    }

    Update() {
        this.editor.points[0] = window.Handles.FreeMoveHandle(0, this.editor.points[0], 15);

        this.created = this.editor.route.PlanRail(this.buildFromNode, this.editor.points[0], this.forceStraight);

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
            this.editor.route.ConnectNodes(this.buildFromNode, this.created.endNode, this.created.rail);

            this.nextState = new BuildState(this.editor, this.created.endNode);
        }

        if (event.event == 'MOUSE_MOVE') {
            //Detect hover on nodeEnd

            // TODO: Create function in som vector class?
            if (this.forceStraight) {
                this.editor.points[0] = MVector.ConstrainToLine(
                    this.buildFromNode.position,
                    this.buildFromNode.direction,
                    this.editor.points[0],
                );
            }

            this.availableNodeEnds.some((node) => {
                if (this.editor.points[0].dist(node.position) < 20) {
                    this.editor.points[2] = MLine.MidPoint(this.buildFromNode.position, node.position);
                    this.nextState = new ConnectState(this.editor, this.buildFromNode, node);
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
                    this.buildFromNode.direction,
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
    constructor(editor, buildFrom, buildTo) {
        window.DEBUG_MODE && console.log('Enter Connect State');
        super(editor);

        this.buildFromNode = buildFrom;
        this.buildToNode = buildTo;
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
        const direction = MRailCurveEdge.CurveDirection(this.buildFromNode, this.editor.points[2]);
        this.controlNode = this.editor.route.CreateNode(this.editor.points[2], direction, false);
        this.rail1 = new MRailCurveEdge(this.buildFromNode, this.controlNode);
        this.rail2 = new MRailCurveEdge(this.buildToNode, this.controlNode);

        this.biarcCircle = MArc.BiarcValidControlCircle(
            this.buildFromNode.position,
            this.buildFromNode.direction,
            this.buildToNode.position,
            this.buildToNode.direction,
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
            this.editor.route.ConnectNodes(this.buildFromNode, this.controlNode);
            this.editor.route.ConnectNodes(this.controlNode, this.buildToNode);
            this.nextState = new AddState(this.editor);
        }

        if (event.event == 'MOUSE_MOVE') {
            this.editor.points[2] = this.editor.points[0];
        }

        if (event.event == 'KEY_PRESS' && event.key == KEY_MAP.ESC) {
            this.nextState = new BuildState(this.editor, this.buildFromNode);
        }
    }
}

class RotateNodeState extends MEditorState {
    constructor(editor, node) {
        window.DEBUG_MODE && console.log('Enter Rotate Node State');
        super(editor);

        this.node = node;
    }

    Update() {
        this.editor.points[0] = window.Handles.FreeMoveHandle(0, this.editor.points[0], 15);
        return super.Update();
    }

    Draw() {}

    OnUserInput(event) {
        if (event.event == 'MOUSE_DOWN' && event.button == 'left') {
            this.nextState = new BuildState(this.editor, this.node);
        }

        if (event.event == 'MOUSE_MOVE') {
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
