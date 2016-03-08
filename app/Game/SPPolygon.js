"use strict";

var Game = require("Game");
var Ball = require("Ball");
var Player = require("Player");
var Bound = require("Bound");
var V = require("vect").V;
var util = require("util");


/**
 * Build a game in a regular polygon, with players at the vertices.
 */
function SPPolygon(viewport, settings) {
    this.viewport = viewport;
    this.players = new Array(settings.sides);
    this.player;
    this.bounds = new Array(settings.sides);
    this.ball = new Ball(new V(this.viewport.center.x, this.viewport.center.y),
                         this.viewport, settings.ballRadius);
    this.ais = new Array();
    this.aiSpeed = settings.aiSpeed;
    this.collisionCellSize = settings.collisionCellSize;
   
    // Make the polygon a little smaller than the viewport will allow. 
    var radius = Math.min(this.viewport.center.x, this.viewport.center.y) - 10;
    // Set interior angle.
    var angle = util.TAU / settings.sides;
    
    // Build each Player.
    for (var i = 0; i < settings.sides; i++) {
        // Displacement around the circle circumscribing the polygon.
        var disp_angle = i * angle;
        var position = new V(this.viewport.center.x +
                                (Math.cos(disp_angle) * radius),
                             this.viewport.center.y +
                                (Math.sin(disp_angle) * radius));
        // Convert displacement to angle at vertex of the appropriate side of 
        // the polygon.
        var startAngle = disp_angle + (util.TAU / 4) + (angle / 2);
        var shieldCenter = disp_angle + (util.TAU / 2);
        var style = i === 0 ? settings.playerStyle : settings.nodeStyle;
        
        this.players[i] = new Player(position, this.viewport, 
                                 startAngle, (util.TAU / 2) - angle,
                                 settings.nodeRadius, settings.nodeRadius + 5,
                                 settings.shieldHalfWidth * angle, style);

        if (i === 0) {
            this.player = this.players[i];
        } else {
            this.ais.push(this.players[i]);
        }
    }

    // Add a bound between the corners of each pair of nodes, closing the 
    // polygon.
    for (var i = 0; i < settings.sides; i++) {
        this.bounds[i] = new Bound(
                              this.players[i].startBound.b,
                              this.players[(i + 1) % settings.sides].endBound.b,
                              this.viewport);
    }

    Game.setCollisionMap(this);
}
SPPolygon.prototype = Object.create(Game.prototype);

exports = module.exports = SPPolygon;
