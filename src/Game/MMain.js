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

import { MInput } from '../Utilities/MInput.js';
import { MCursor } from '../Utilities/MCursor.js';
import { MHandles } from '../Utilities/MHandles.js';
import { MRoute } from '../Train/MRoute.js';
import { MRouteEditor } from '../Train/MRouteEditor.js';
import { MTrain } from '../Train/MTrain.js';
import { MCamera, MCameraController } from './MCamera.js';
import { MDebug } from './MDebug.js';
import SCENE_2 from './Scenes/SCENE_2.json';
import { MVector } from '../Utilities/MVector.js';

export class MMain {
    constructor() {}

    LoadScene() {
        const route = new MRoute();
        route.Import(SCENE_2);
        return route;
    }

    Setup() {
        this.Debug = new MDebug();
        this.InputHandler = new MInput();
        this.Handles = new MHandles(this.InputHandler);
        window.Handles = this.Handles;

        this.GameCamera = new MCamera();
        this.GameCameraController = new MCameraController(this.InputHandler, this.GameCamera);
        this.Cursor = new MCursor(this.GameCamera);

        const route = this.LoadScene();
        this.TrackEditor = new MRouteEditor(this.GameCamera, this.InputHandler, this.Cursor, route);
        this.Train = new MTrain(this.InputHandler, this.GameCamera, route.rails);
    }

    Tick() {
        this.GameCameraController.Update();
        this.Cursor.Update();
        this.Handles.Update();
        this.TrackEditor.Update();
        this.Train && this.Train.Update();

        this.GameCamera.Draw();
        this.TrackEditor.Draw();
        this.Train && this.Train.Draw();
        this.Handles.Draw();
    }
}
