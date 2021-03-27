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
        window.GameMain = GameMain;
        GameMain.Setup();
    };

    p.preload = () => {
        p.MSprites = {
            carts: [],
            locos: [],
            connectors: [],
        };

        [
            'Cart_Long_Containers_Battery_Battery.png',
            'Cart_Long_Containers_Desert_Red.png',
            'Cart_Long_Containers_Red_Battery.png',
            'Cart_Long_Packages.png',
            'Cart_Short_Container_Blue.png',
            'Cart_Short_Container_Red.png',
            'Cart_Short_Containers_Red_Green.png',
            'Cart_Short_Containers_Red_Red.png',
            'Cart_Short_Liquid_Blue_Yewllow.png',
            'Cart_Short_Liquid_White.png',
            'Cart_Short_Packages.png',
            'Cart_Short_Packages_Container.png',
            'Cart_Short_Packages_Liquid.png',
        ].forEach((filename) => p.MSprites.carts.push(p.loadImage('Trains/Small/Carts/' + filename)));

        ['Train_120x20_Green.png', 'Train_120x20_White.png', 'Train_130x20_Blue.png', 'Train_130x20_Desert.png'].forEach((filename) =>
            p.MSprites.locos.push(p.loadImage('Trains/Small/Trains/' + filename)),
        );

        ['Conectror_5.png'].forEach((filename) => p.MSprites.connectors.push(p.loadImage('Trains/Small/Conectors&Extras/' + filename)));
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
