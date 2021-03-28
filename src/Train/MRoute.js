import { MNode, MSwitchNode } from './MNode.js';
import { MRailLineEdge, MRailCurveEdge } from './MTracks.js';
import { MVector } from '../Utilities/MVector.js';

export class MRoute {
    constructor() {
        this.nodes = [];
        this.rails = [];

        // Cached nodes that have a missing connection
        this.railEnds = [];
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
        this.UpdateRailEnds();
    }

    DeleteNode(node) {
        this.nodes.splice(this.nodes.indexOf(node), 1);
        this.UpdateRailEnds();
    }

    CreateSwitch(rail, position) {
        const tangent = rail.TangentAtPoint(position);

        // Create switch
        const nodeSwitch = new MSwitchNode(position, tangent);
        this.AddNode(nodeSwitch);

        // Remove existing rail
        this.DeleteRail(rail);

        // Create split
        const rail1 = this.CreateRail(rail.node1, nodeSwitch);
        const rail2 = this.CreateRail(nodeSwitch, rail.node2);

        // Connect with switch
        nodeSwitch.rail1 = rail1;
        nodeSwitch.rail2.push(rail2);

        // Connect with outer rails
        rail.node1.SetEmptyRail(rail1);
        rail.node2.SetEmptyRail(rail2);

        this.UpdateRailEnds();

        return nodeSwitch;
    }

    // Refactor?
    ConnectNodes(fromNode, toNode, rail) {
        if (!rail) {
            rail = this.CreateRail(fromNode, toNode);
        }

        toNode.SetEmptyRail(rail);
        fromNode.SetEmptyRail(rail);

        this.UpdateRailEnds();
        return rail;
    }

    CreateRail(fromNode, toNode) {
        let rail;
        if (MRailLineEdge.IsStraight(fromNode, toNode.position)) {
            rail = new MRailLineEdge(fromNode, toNode);
        } else {
            rail = new MRailCurveEdge(fromNode, toNode);
        }
        this.AddRail(rail);
        return rail;
    }

    // Refactor?
    // Used in editing when building from a certain existing node.
    PlanRail(fromNode, toPosition, forceLine) {
        let endNode;
        let rail;
        let canBuild = false;

        if (MRailLineEdge.IsStraight(fromNode, toPosition) || forceLine) {
            endNode = this.CreateNode(toPosition, fromNode.direction, false);
            rail = new MRailLineEdge(fromNode, endNode);
        } else {
            const direction = MRailCurveEdge.CurveDirection(fromNode, toPosition);
            endNode = this.CreateNode(toPosition, direction, false);
            rail = new MRailCurveEdge(fromNode, endNode);
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
        this.UpdateRailEnds();
    }

    DeleteRail(rail, deleteEmptyNodes = false) {
        this.rails.splice(this.rails.indexOf(rail), 1);
        rail.node1.RemoveRail(rail);
        rail.node2.RemoveRail(rail);
        if (deleteEmptyNodes) {
            if (rail.node1.GetAnyRail() === undefined) {
                this.DeleteNode(rail.node1);
            }
            if (rail.node2.GetAnyRail() === undefined) {
                this.DeleteNode(rail.node2);
            }
        }
        this.UpdateRailEnds();
    }

    GetTrackAt(position) {
        return this.rails.find((rail) => rail.Collision(position));
    }

    GetNodeAt(position) {
        return this.nodes.find((node) => node.Collision(position));
    }

    GetNodeEndAt(position) {
        return this.railEnds.find((node) => node.Collision(position));
    }

    UpdateRailEnds() {
        this.railEnds = this.nodes.filter((node) => node.HasEmptyRail());
    }

    Export() {
        const save = {
            nodes: this.nodes.map((node) => node.Export()),
            rails: this.rails.map((rail) => ({ node1: this.nodes.indexOf(rail.node1), node2: this.nodes.indexOf(rail.node2) })),
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
            this.ConnectNodes(this.nodes[rail.node1], this.nodes[rail.node2]);
        });
    }
}
