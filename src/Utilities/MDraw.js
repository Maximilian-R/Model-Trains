const ARROW_SIZE = 15;

export class MDraw {
    static DrawTriangle(position, direction, size = ARROW_SIZE) {
        sketch.push();
        sketch.translate(position.x, position.y);
        sketch.rotate(direction.heading());
        sketch.triangle(0, size / 2, 0, -size / 2, size * 1.5, 0);
        sketch.pop();
    }

    static Arc(origin, radius, a1, a2) {
        sketch.arc(origin.x, origin.y, radius, radius, a1, a2);
    }

    static Line(p1, p2) {
        sketch.line(p1.x, p1.y, p2.x, p2.y);
    }

    static Point(p1) {
        sketch.point(p1.x, p1.y);
    }
}
