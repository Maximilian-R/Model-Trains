import p5 from '../../libraries/p5.js';
import { MMain } from './MMain.js';
import { MVector } from '../Utilities/MVector.js';

// setup, draw
const sketch = (p) => {
    window.sketch = p;
    window.p5 = p5;

    let GameMain;

    p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.frameRate(60);

        GameMain = new MMain();
        GameMain.Setup();
    };

    p.draw = () => {
        p.background(220);
        GameMain.Tick();
    };

    p.mousePressed = function () {
        GameMain.InputHandler.OnMouseDown(p.createVector(p.mouseX, p.mouseY));
    };
    p.mouseDragged = function () {
        GameMain.InputHandler.OnMouseDrag(p.createVector(p.mouseX, p.mouseY));
    };
    p.mouseReleased = function () {
        GameMain.InputHandler.OnMouseUp(p.createVector(p.mouseX, p.mouseY));
    };
    p.mouseMoved = function () {
        GameMain.InputHandler.OnMouseMove(p.createVector(p.mouseX, p.mouseY));
    };
    p.keyPressed = function () {
        GameMain.InputHandler.OnKeyPress(p.keyCode);
    };
    p.mouseWheel = function (event) {
        GameMain.InputHandler.OnMouseScroll(MVector.Create(p.mouseX, p.mouseY), MVector.Create(event.deltaX, event.deltaY));
    };
};

new p5(sketch);
