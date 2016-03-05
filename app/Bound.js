var L = require("vect").L;


function Bound(a, b, viewport) {
    L.call(this, a, b);

    this.viewport = viewport;
    this.width = 1;
    this.style = "rgb(0, 0, 0)";
};
Bound.prototype = Object.create(L.prototype);

Bound.prototype.collisionPossible = function (x, y, size) {
    // Set horizontal and vertical lines of the box.
    var w_x = x;
    var n_y = y;
    var e_x = x + size;
    var s_y = y + size;

    // Test if either point is in the box.
    if ((w_x <= this.a.x && this.a.x <= e_x &&
         n_y <= this.a.y && this.a.y <= s_y) ||
        (w_x <= this.b.x && this.b.x <= e_x &&
         n_y <= this.b.y && this.b.y <= s_y)) {
        return true;
    }

    // Find magnitude of direction vector necessary to intersect each line of 
    // the box...
    var w_p = (w_x - this.a.x) / this.direction.x;
    var n_p = (n_y - this.a.y) / this.direction.y;
    var e_p = (e_x - this.a.x) / this.direction.x;
    var s_p = (s_y - this.a.y) / this.direction.y;
    // ... and the resultant coordinate.
    var w_y = this.a.y + (this.direction.y * w_p);
    var n_x = this.a.x + (this.direction.x * n_p);
    var e_y = this.a.y + (this.direction.y * e_p);
    var s_x = this.a.x + (this.direction.x * s_p);
    
    // Bounds passes through the box if a projection less than max magnitude 
    // lies between the bounds defined by the perpendicular lines.
    if ((n_y <= w_y && w_y <= s_y && 0 < w_p && w_p < 1) ||
        (w_x <= n_x && n_x <= e_x && 0 < n_p && n_p < 1) ||
        (n_y <= e_y && e_y <= s_y && 0 < e_p && e_p < 1) ||
        (w_x <= s_x && s_x <= e_x && 0 < s_p && s_p < 1)) {
        return true;
    }

    return false;
};

Bound.prototype.collisionHandler = function (ball) {
    var v = ball.position.sub(this.a);
    var pos_normal = v.dot(this.normal);
    var pos_direction = v.dot(this.direction.norm);
    var vel_normal = ball.velocity.dot(this.normal);

    if (Math.abs(pos_normal) < ball.radius + 1 &&
        Math.sign(pos_normal) != Math.sign(vel_normal) &&
        pos_direction <= this.direction.mag) {
        ball.velocity = ball.velocity.reflect(this.normal);
        
        return true;
    }

    return false;
};

Bound.prototype.redraw = function () {
    var a_x = this.a.x - this.viewport.position.x;
    var a_y = this.a.y - this.viewport.position.y;
    var b_x = this.b.x - this.viewport.position.x;
    var b_y = this.b.y - this.viewport.position.y;

    this.viewport.ctx.beginPath();
    this.viewport.ctx.moveTo(a_x, a_y);
    this.viewport.ctx.lineTo(b_x, b_y);
    this.viewport.ctx.closePath();
    this.viewport.ctx.strokeStyle = this.viewport.bgStyle;
    this.viewport.ctx.lineWidth = this.width + 1;
    this.viewport.ctx.stroke();
    this.viewport.ctx.beginPath();
    this.viewport.ctx.moveTo(a_x, a_y);
    this.viewport.ctx.lineTo(b_x, b_y);
    this.viewport.ctx.closePath();
    this.viewport.ctx.strokeStyle = this.style;
    this.viewport.ctx.lineWidth = this.width;
    this.viewport.ctx.stroke();
};


exports = module.exports = Bound;
