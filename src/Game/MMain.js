/*
    Game
        Manager
            Setup
            Keep a reference to main objects
            Call Update/Draw

            State (Route Editing / Train Editing / Play Mode)

        Camera
            Control the camera movement

    Input Manager
        Map mouse and key events, delegate to subsribers
        KEY_MAP

    Editor
        RouteEditor (Manage input)
            Manage different states in the building 
                - Start building from an end arrow/ current switch or create a switch in current track
                - Select an end spot, either free space or create/join a curennt switch. Validate curve radius etc...
                - Connect (biarc). When building and selecting another endpoint

        TrackEditor (Manage logic)
            Manage editing of tracks
                - Create Nodes/switches
                - Create Rail Line/Curve
                - Delete Rails
                - Add/Remove connection of node/rail
                - Validate creation

        Route 
            

        Track
            Classes for every node/rail type
                Settings
                Helper functions, Collision etc...
                Draw


        TrainEditor
            Place train on tracks
*/

// https://gamedev.stackexchange.com/questions/139595/train-like-movement-in-a-2d-game

import { MInput } from '../Utilities/MEvent.js';
import { MHandles } from '../Utilities/MHandles.js';
import { MRoute } from '../Train/MRoute.js';
import { MVector } from '../Utilities/MVector.js';
import { MRouteEditor } from '../Train/MRouteEditor.js';
import { MTrain } from '../Train/MTrain.js';
import { MCamera, MCameraController } from './MCamera.js';

window.DEBUG_MODE = true;

// function setup() {
//     createCanvas(window.innerWidth, window.innerHeight);
//     GameMain = new MMain();
//     GameMain.Setup();
// }

// function draw() {
//     //background("#89909F");
//     background(220);
//     GameMain.Tick();
// }

export class MMain {
    constructor() {}

    Scene1() {
        const route = new MRoute();
        const offsetX = 100;
        const offsetY = sketch.height / 2;
        const node1 = route.CreateNode(MVector.Create(offsetX + 0, offsetY + 0), MVector.Create(1, 0));
        const node2 = route.CreateNode(MVector.Create(offsetX + 1000, offsetY + 0), MVector.Create(1, 0));
        const node3 = route.CreateNode(MVector.Create(offsetX + 1000, offsetY + 400), MVector.Create(-1, 0));
        const node4 = route.CreateNode(MVector.Create(offsetX + 0, offsetY + 400), MVector.Create(-1, 0));

        route.ConnectNodes(node1, node2);
        route.ConnectNodes(node2, node3);
        route.ConnectNodes(node3, node4);
        route.ConnectNodes(node4, node1);

        return route;
    }

    Setup() {
        this.InputHandler = new MInput();
        this.Handles = new MHandles(this.InputHandler);
        window.Handles = this.Handles;

        this.GameCamera = new MCamera();
        this.GameCameraController = new MCameraController(this.InputHandler, this.GameCamera);

        const route = this.Scene1();
        this.TrackEditor = new MRouteEditor(this.GameCamera, this.InputHandler, route);
        this.Train = new MTrain(this.InputHandler, this.GameCamera, route.rails);
    }

    Tick() {
        this.GameCameraController.Update();
        this.Handles.Update();
        this.TrackEditor.Update();
        this.Train.Update();

        this.GameCamera.Draw();
        this.TrackEditor.Draw();
        this.Train.Draw();
        this.Handles.Draw();
    }
}
