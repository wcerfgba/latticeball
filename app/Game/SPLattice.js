"use strict";

var Game = require("Game");
var Ball = require("Ball");
var Player = require("Player");
var Bound = require("Bound");
var V = require("vect").V;
var util = require("util");


/**
 * Represents a game on a square or hexagonal/triangular lattice of points, 
 * with a {@link Player} on each point.
 */
function SPLattice(viewport, settings) {
    this.viewport = viewport;
   
    // Ensure spacing is always sufficient. 
    settings.spacing += settings.nodeRadius;
    
    // Calculate number of players per row and column.
    var xDensity = Math.ceil(this.viewport.canvas.width / settings.spacing);
    var yDensity = Math.ceil(this.viewport.canvas.height / settings.spacing);

    this.players = new Array(xDensity * yDensity);
    this.bounds = new Array(4);
    this.ball = new Ball(new V(100, 100), this.viewport, settings.ballRadius);
    this.ais = new Array();
    this.aiSpeed = settings.aiSpeed;
    this.player;
    this.collisionCellSize = settings.collisionCellSize;
    
    // Human player goes in the middle.
    var playerIdx = Math.floor((xDensity * yDensity) / 2);

    // Build Player objects.
    for (var i = 0; i < this.players.length; i++) {
        // Place at each point of the lattice, with a fixed offset.
        var x = ((i % xDensity) * settings.spacing) +
                (1.5 * settings.nodeRadius);
        var y = (Math.floor(i / xDensity) * settings.spacing) +
                    (1.5 * settings.nodeRadius);
        var style = i === playerIdx ? settings.playerStyle : settings.nodeStyle;

        // In a hex grid, every other row is offset by a half.
        if (settings.shape === "hex" &&
            (Math.floor(i / xDensity) % 2) == 1) {
            x += Math.floor(settings.spacing / 2);
        }
        
        this.players[i] = new Player(new V(x, y), this.viewport, 0, util.TAU, 
                                     settings.nodeRadius,
                                     settings.nodeRadius + 5,
                                     settings.shieldHalfWidth * util.TAU,
                                     style);

        if (i === playerIdx) {
            this.player = this.players[i];
        } else {
            this.ais.push(this.players[i]);
        }
    }

    // Fixed bounds at the edges.
    this.bounds[0] = new Bound(new V(0, 0),
                               new V(this.viewport.canvas.width, 0),
                               this.viewport);
    this.bounds[1] = new Bound(this.bounds[0].b,
                               new V(this.viewport.canvas.width,
                                     this.viewport.canvas.height),
                               this.viewport);
    this.bounds[2] = new Bound(this.bounds[1].b,
                               new V(0, this.viewport.canvas.height),
                               this.viewport);
    this.bounds[3] = new Bound(this.bounds[2].b, this.bounds[0].a,
                               this.viewport);

    Game.setCollisionMap(this);
}
SPLattice.prototype = Object.create(Game.prototype);


exports = module.exports = SPLattice;
