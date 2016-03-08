"use strict";

var V = require("vect").V;
var util = require("util");


function Ball(position, viewport, radius) {
    this.position = position;
    this.viewport = viewport;
    this.radius = radius;
    this.velocity = new V(0.4 * (Math.random() - 0.5),
                          0.4 * (Math.random() - 0.5));
    this.style = "rgb(255, 0, 0)";
}

Ball.prototype.move = function (time) {
    this.position.x += this.velocity.x * time;
    this.position.y += this.velocity.y * time;
};

/** 
 * Draws over relative position of ball in viewport with background style, 
 * effectively clearing the ball on-screen.
 */
Ball.prototype.clear = function () {
    var x = this.position.x - this.viewport.position.x;
    var y = this.position.y - this.viewport.position.y;

    if (-this.radius < x && x < this.viewport.canvas.width + this.radius &&
        -this.radius < y && y < this.viewport.canvas.height + this.radius) {
        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.radius + 2, 0, util.TAU, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.fillStyle = this.viewport.bgStyle;
        this.viewport.ctx.fill();

        return true;
    }

    return false;
};

/**
 * Clears and redraws ball.
 */
Ball.prototype.redraw = function () {
    if (this.clear()) {
        var x = this.position.x - this.viewport.position.x;
        var y = this.position.y - this.viewport.position.y;
        
        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.radius, 0, util.TAU, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.fillStyle = this.style;
        this.viewport.ctx.fill();
    }
};


exports = module.exports = Ball;
