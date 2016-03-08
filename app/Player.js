"use strict";

var V = require("vect").V;
var Bound = require("Bound");
var util = require("util");


/**
 * Represents a player, a circle or circle segment with health and a shield.
 */
function Player(position, viewport, startAngle, angleRange, radius,
                shieldRadius, shieldHalfWidth, style) {
    this.position = position;
    this.viewport = viewport;
    this.startAngle = startAngle;
    this.angleRange = angleRange;
    // Slightly fuzzy test to see if we are a full circle. If so, we don't need 
    // start and end bounds, and we do not have to test for angle limits when 
    // moving the shield or detecting collisions.
    this.fullCircle = this.angleRange + 0.01 > util.TAU ? true : false;
    this.endAngle = this.startAngle + this.angleRange;
    this.radius = radius;
    
    if (!this.fullCircle) {
        this.startBound = new Bound(this.position, this.position.add(
                               new V(this.radius * Math.cos(this.startAngle),
                                     this.radius * Math.sin(this.startAngle))));
        this.endBound = new Bound(this.position, this.position.add(
                             new V(this.radius * Math.cos(this.endAngle),
                                   this.radius * Math.sin(this.endAngle))));
    }

    this.shieldRadius = shieldRadius;
    this.shieldAngle = (this.startAngle + this.endAngle) / 2;
    this.shieldHalfWidth = shieldHalfWidth;
    this.shieldStartAngle = this.shieldAngle - this.shieldHalfWidth;
    this.shieldEndAngle = this.shieldAngle + this.shieldHalfWidth;
    this.style = style;
    this.shieldDepth = 3;
    this.shieldStyle = "rgb(0, 0, 255)";
    this.health = 1;
    this.damageRate = 0.1;
}

/**
 * Modify shield angle if within limits, and redraw immediately.
 */
Player.prototype.moveShield = function (a) {
    this.clearShield();

    if (this.fullCircle ||
        (util.angle.between(this.startAngle + 0.02, this.shieldStartAngle + a,
            this.endAngle - 0.02) &&
         util.angle.between(this.startAngle + 0.02, this.shieldEndAngle + a,
            this.endAngle - 0.02))) {
        this.shieldAngle += a;
        this.shieldStartAngle += a;
        this.shieldEndAngle += a;
    }

    this.redrawShield();
};

/**
 * Collision detection spatial partitioning.
 */
Player.prototype.collisionPossible = function (x, y, size) {
    var radius = size / 2;
    var center = new V(x + radius, y + radius);
    var v = center.sub(this.position);
    // Distance to the edge of the box from its center is given by dividing the 
    // radius of the inscribed circle by the maximum of the absolutes of the 
    // sine and cosine of the angle around the center.
    var edge_dist = radius / Math.max(Math.abs(Math.cos(v.angle)),
                                      Math.abs(Math.sin(v.angle)));

    // Collision possible if player circle intersects box.
    if (v.mag < this.shieldRadius + edge_dist + 1 &&
        ((!this.fullCircle &&
          util.angle.between(this.startAngle, v.angle, this.endAngle)) ||
         this.fullCircle)) {
        return true;
    }

    // Collision also possible with bounds.
    if (!this.fullCircle &&
        (this.startBound.collisionPossible(x, y, size) ||
         this.endBound.collisionPossible(x, y, size))) {
        return true;
    }
    
    return false;
};

/**
 * Collides a {@link Ball} with this player, taking damage if appropriate.
 */
Player.prototype.collisionHandler = function (ball) {
    var v = ball.position.sub(this.position);
    var normal_velocity = -v.dot(ball.velocity);

    // No collision if we are moving away from the player.
    if (normal_velocity < 0) {
        return false;
    }

    // If we are alive and ball hits the shield, bounce it.
    if (this.health > 0 &&
        v.magsq < Math.pow(this.shieldRadius + ball.radius, 2) + 1 &&
        util.angle.between(this.shieldStartAngle, v.angle,
                           this.shieldEndAngle)) {
        ball.velocity = ball.velocity.reflect(v);
        
        return true;
    }

    // Collide with player, take damage.
    if (v.magsq < Math.pow(this.radius + ball.radius, 2) + 1 &&
        ((!this.fullCircle &&
          util.angle.between(this.startAngle, v.angle, this.endAngle)) ||
         this.fullCircle)) {
        ball.velocity = ball.velocity.reflect(v);
        this.takeDamage();
        return true;
    }

    // Collide with bounds, take damage.
    if (!this.fullCircle && 
        (this.startBound.collisionHandler(ball) ||
         this.endBound.collisionHandler(ball))) {
        this.takeDamage();
        return true;
    }

    return false;
};

/**
 * Reduce health by damage rate, and destroy the shield if we are dead.
 */
Player.prototype.takeDamage = function () {
    if (this.health < this.damageRate + 0.001) {
        this.clearShield();
        this.health = 0;
    } else {
        this.health -= this.damageRate;
    }
};

/**
 * Clear and redraw the player without the shield.
 */
Player.prototype.redrawNode = function () {
    var x = this.position.x - this.viewport.position.x;
    var y = this.position.y - this.viewport.position.y;

    if (-this.radius < x && x < this.viewport.canvas.width + this.radius &&
        -this.radius < y && y < this.viewport.canvas.height + this.radius) {
        this.viewport.ctx.beginPath();
        this.viewport.ctx.moveTo(x, y);
        this.viewport.ctx.arc(x, y, this.radius + 1,
                this.startAngle, this.endAngle, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.fillStyle = this.viewport.bgStyle;
        this.viewport.ctx.fill();
        this.viewport.ctx.beginPath();
        this.viewport.ctx.moveTo(x, y);
        this.viewport.ctx.arc(x, y, this.radius,
                this.startAngle, this.endAngle, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.strokeStyle = this.style;
        this.viewport.ctx.lineWidth = 1;
        this.viewport.ctx.stroke();
        this.viewport.ctx.beginPath();
        this.viewport.ctx.moveTo(x, y);
        this.viewport.ctx.arc(x, y, this.radius * this.health,
                this.startAngle, this.endAngle, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.fillStyle = this.style;
        this.viewport.ctx.fill();

        return true;
    }

    return false;
};

Player.prototype.clearShield = function () {
    // If dead, don't do anything.
    if (this.health == 0) {
        return false;
    }

    var x = this.position.x - this.viewport.position.x;
    var y = this.position.y - this.viewport.position.y;

    if (-this.shieldRadius < x &&
        x < this.viewport.canvas.width + this.shieldRadius &&
        -this.shieldRadius < y &&
        y < this.viewport.canvas.height + this.shieldRadius) {
        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.shieldRadius,
               this.shieldStartAngle - 0.02, this.shieldEndAngle + 0.02, false);
        this.viewport.ctx.strokeStyle = this.viewport.bgStyle;
        this.viewport.ctx.lineWidth = this.shieldDepth + 1;
        this.viewport.ctx.stroke();
        this.viewport.ctx.closePath();

        return true;
    }

    return false;
};

Player.prototype.redrawShield = function () {
    // Redraw if shield was successfully cleared and we are alive.
    if (this.clearShield() && this.health > 0) {
        var x = this.position.x - this.viewport.position.x;
        var y = this.position.y - this.viewport.position.y;

        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.shieldRadius,
                this.shieldStartAngle, this.shieldEndAngle, false);
        this.viewport.ctx.strokeStyle = this.shieldStyle;
        this.viewport.ctx.lineWidth = this.shieldDepth;
        this.viewport.ctx.stroke();
        this.viewport.ctx.closePath();

        return true;
    }

    return false;
};

/**
 * Wraps type specific functions to satisfy the {@link Game} interface.
 */
Player.prototype.redraw = function () {
    this.redrawNode();
    this.redrawShield();
};


exports = module.exports = Player;
