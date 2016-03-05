var Game = require("Game");
var Ball = require("Ball");
var Player = require("Player");
var Bound = require("Bound");
var V = require("vect").V;
var util = require("util");

var TAU = util.TAU;

function SPLattice(viewport, settings) {
    this.viewport = viewport;
    
    settings.spacing += settings.nodeRadius;
    
    var xDensity = Math.floor(this.viewport.canvas.width / settings.spacing);
    var yDensity = Math.floor(this.viewport.canvas.height / settings.spacing);

    this.players = new Array(xDensity * yDensity);
    this.bounds = new Array(4);
    this.ball = new Ball(new V(100, 100), this.viewport, settings.ballRadius);
    this.ais = new Array(this.players.length - 1);
    this.player = Math.floor((xDensity * yDensity) / 2);
    this.collisionCellSize = settings.collisionCellSize;

    for (var i = 0; i < this.players.length; i++) {
        var x = ((i % xDensity) * settings.spacing) +
                (1.5 * settings.nodeRadius);
        var y = (Math.floor(i / xDensity) * settings.spacing) +
                    (1.5 * settings.nodeRadius);
        var style = i === this.player ? settings.playerStyle : 
                                        settings.nodeStyle;

        if ((Math.floor(i / xDensity) % 2) == 1) {
            x += Math.floor(settings.spacing / 2);
        }
        
        this.players[i] = new Player(new V(x, y), this.viewport, 0, TAU, 
                                     settings.nodeRadius,
                                     settings.nodeRadius + 5,
                                     settings.shieldHalfWidth, style);
    }

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

    for (var i = 0; i < this.players.length; i++) {
        if (i == this.player) {
            continue;
        }

    // TODO: AIs in main loop
        this.ais.push(setInterval(
                          Game.buildAI(this.players[i], this.ball, 0.04), 100));
    }

    Game.setCollisionMap(this);
}
SPLattice.prototype = Object.create(Game.prototype);


exports = module.exports = SPLattice;
