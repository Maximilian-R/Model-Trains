import { MNode, MSwitchNode } from './MNode.js';
import { MRailLineEdge, MRailCurveEdge } from './MTracks.js';
import { MVector } from '../Utilities/MVector.js';

export class MRoute {
    constructor() {
        this.nodes = [];
        this.rails = [];

        // Cached nodes that have a missing connection
        this.emptyNodeJoints = [];
    }

    Draw() {
        this.rails.forEach((rail) => rail.Draw());
        this.nodes.forEach((node) => node.Draw());
    }

    CreateNode(position, direction, add = true, type = 0) {
        const nodeClass = type === 0 ? MNode : MSwitchNode;
        const node = new nodeClass(position, direction);
        if (add) this.AddNode(node);
        return node;
    }

    AddNode(node) {
        this.nodes.push(node);
        this.UpdateNodeJoints();
    }

    DeleteNode(node) {
        this.nodes.splice(this.nodes.indexOf(node), 1);
        this.UpdateNodeJoints();
    }

    CreateSwitch(rail, position) {
        const tangent = rail.TangentAtPoint(position);

        // Create switch
        const nodeSwitch = new MSwitchNode(position, tangent);
        this.AddNode(nodeSwitch);

        // Remove existing rail
        this.DeleteRail(rail);

        // Create split
        const rail1 = this.CreateRail(rail.joint1, nodeSwitch.in);
        const rail2 = this.CreateRail(nodeSwitch.out, rail.joint2);

        // Connect with switch
        nodeSwitch.in.Connect(rail1);
        nodeSwitch.out.Connect(rail2);

        // Connect with outer rails
        rail.joint1.Connect(rail1);
        rail.joint2.Connect(rail2);

        this.UpdateNodeJoints();

        return nodeSwitch;
    }

    // Refactor?
    ConnectNodes(fromJoint, toJoint, rail) {
        if (!rail) {
            rail = this.CreateRail(fromJoint, toJoint);
        }

        toJoint.Connect(rail);
        fromJoint.Connect(rail);

        this.UpdateNodeJoints();
        return rail;
    }

    CreateRail(fromJoint, toJoint) {
        let rail;
        if (MRailLineEdge.IsStraight(fromJoint, toJoint.position)) {
            rail = new MRailLineEdge(fromJoint, toJoint);
        } else {
            rail = new MRailCurveEdge(fromJoint, toJoint);
        }
        this.AddRail(rail);
        return rail;
    }

    // Refactor?
    // Used in editing when building from a certain existing node.
    PlanRail(fromNodeJoint, toPosition, forceLine) {
        let endNode;
        let rail;
        let canBuild = false;

        if (MRailLineEdge.IsStraight(fromNodeJoint, toPosition) || forceLine) {
            endNode = this.CreateNode(toPosition, fromNodeJoint.direction, false);
            rail = new MRailLineEdge(fromNodeJoint, endNode.in);
        } else {
            const direction = MRailCurveEdge.CurveDirection(fromNodeJoint, toPosition);
            endNode = this.CreateNode(toPosition, direction, false);
            rail = new MRailCurveEdge(fromNodeJoint, endNode.in);
        }

        const existingRail = this.GetTrackAt(toPosition);
        canBuild = !existingRail && rail.Validate();

        return {
            rail: rail,
            endNode: endNode,
            canBuild: canBuild,
        };
    }

    AddRail(rail) {
        this.rails.push(rail);
        this.UpdateNodeJoints();
    }

    DeleteRail(rail, deleteEmptyNodes = false) {
        this.rails.splice(this.rails.indexOf(rail), 1);
        rail.joint1.Remove(rail);
        rail.joint2.Remove(rail);
        if (deleteEmptyNodes) {
            if (rail.joint1.node.isEmpty) {
                this.DeleteNode(rail.joint1.node);
            }
            if (rail.joint2.node.isEmpty) {
                this.DeleteNode(rail.joint2.node);
            }
        }
        this.UpdateNodeJoints();
    }

    GetTrackAt(position) {
        return this.rails.find((rail) => rail.Collision(position));
    }

    GetNodeAt(position) {
        return this.nodes.find((node) => node.Collision(position));
    }

    GetEmptyNodeJointAt(position) {
        return this.emptyNodeJoints.find((joint) => joint.Collision(position));
    }

    UpdateNodeJoints() {
        this.emptyNodeJoints = this.nodes
            .map((node) => [node.in, node.out])
            .flat()
            .filter((joint) => joint.isEmpty);
    }

    Export() {
        const save = {
            nodes: this.nodes.map((node) => node.Export()),
            rails: this.rails.map((rail) => {
                return {
                    from: {
                        node: this.nodes.indexOf(rail.joint1.node),
                        joint: rail.joint1.id,
                    },
                    to: {
                        node: this.nodes.indexOf(rail.joint2.node),
                        joint: rail.joint2.id,
                    },
                };
            }),
        };
        return JSON.stringify(save);
    }

    Import(save) {
        save.nodes.forEach((node) =>
            this.CreateNode(
                MVector.Create(node.position.x, node.position.y),
                MVector.Create(node.direction.x, node.direction.y),
                true,
                node.type,
            ),
        );
        save.rails.forEach((rail) => {
            const node1 = this.nodes[rail.from.node];
            const node2 = this.nodes[rail.to.node];
            const joint1 = node1[rail.from.joint];
            const joint2 = node2[rail.to.joint];
            this.ConnectNodes(joint1, joint2);
        });
    }
}
