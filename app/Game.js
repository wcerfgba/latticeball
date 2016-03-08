"use strict";

var TreeSet = require("TreeSet");
var util = require("util");


/**
 * Abstract type for games. Here we define common functionality.
 */
function Game() {}

/**
 * Move the shields of all AIs based on the position of the {@link Ball}. This 
 * is limited by a maximum speed, `game.aiSpeed`.
 */
Game.prototype.updateAIs = function () {
    for (var i = 0; i < this.ais.length; i++) {
        var a = this.ball.position.sub(this.ais[i].position).angle;
        var shieldCenter = this.ais[i].shieldAngle;

        if (a < shieldCenter) {
            // Choose most direct route to centering the shield on the ball. 
            // Because the angle is bounded by tau, the maximum in either 
            // direction cannot exceed tau / 2.
            if (shieldCenter - a < (util.TAU / 2)) {
                this.ais[i].moveShield(-Math.min(this.aiSpeed,
                                                 shieldCenter - a));
            } else {
                this.ais[i].moveShield(Math.min(this.aiSpeed,
                                                a + util.TAU - shieldCenter));
            } 
        } else {
            if (a - shieldCenter < (util.TAU / 2)) {
                this.ais[i].moveShield(Math.min(this.aiSpeed,
                                                a - shieldCenter));
            } else {
                this.ais[i].moveShield(-Math.min(this.aiSpeed,
                                                 shieldCenter + util.TAU - a));
            } 
        }
    } 
};

/**
 * Map the {@link Ball} onto the `collisionMap`, which represents a spatial 
 * partitioning of collidable elements at a certain granularity called the
 * collision cell size. The collision map contains references to the possible 
 * objects with which the ball can collide, and their collision handlers can 
 * then be called.
 */
Game.prototype.detectCollision = function () {
    // Calculate relevant cell of collisionMap.
    var idx_x = Math.floor(this.ball.position.x / this.collisionCellSize);
    var idx_y = Math.floor(this.ball.position.y / this.collisionCellSize);

    var set = new TreeSet();

    // Get all possible collidable elements from the collision map in the cell 
    // containing the ball, and any of the surrounding eight cells. This makes 
    // the detection robust as the ball may span multiple cells, as it is not 
    // a point but a circle.
    for (var i = (0 < idx_x ? -1 : 0);
         i <= (idx_x + 1 < this.collisionMap.length ? 1 : 0);
         i++) {
        for (var j = (0 < idx_y ? -1 : 0);
             j <= (idx_y + 1 < this.collisionMap[idx_x + i].length ? 1 : 0);
             j++) {
            var cell = this.collisionMap[idx_x + i][idx_y + j];
        
            for (var k = 0; k < cell.length; k++) {
                set.add(cell[k]);
            }
        }
    }

    // Try to collide.
    for (var i = 0; i < set.length; i++) {
        var o = set[i];
        if (o.collisionHandler(this.ball)) {
            return true;
        }
    }

    return false;
};

/**
 * Returns a message if the game is finished; currently either the player is 
 * dead or all the AIs are dead.
 */
Game.prototype.isGameFinished = function () {
    if (this.player.health === 0) {
        return "CPU wins";
    }

    for (var i = 0; i < this.ais.length; i++) {
        if (this.ais[i].health > 0) {
            return false;
        }
    }

    return "You win";
};

Game.prototype.redrawAll = function () {
    for (var i = 0; i < this.players.length; i++) {
        this.players[i].redraw();
    }
    
    for (var i = 0; i < this.bounds.length; i++) {
        this.bounds[i].redraw();
    }
};

/**
 * Same principle as {@link Game#detectCollision}, but objects are instead 
 * redrawn. Used for efficiently redrawing only those elements that may have 
 * become dirty, due to a collision.
 */
Game.prototype.redrawActive = function () {
    var idx_x = Math.floor(this.ball.position.x / this.collisionCellSize);
    var idx_y = Math.floor(this.ball.position.y / this.collisionCellSize);

    var set = new TreeSet();

    for (var i = (0 < idx_x ? -1 : 0);
         i <= (idx_x + 1 < this.collisionMap.length ? 1 : 0);
         i++) {
        for (var j = (0 < idx_y ? -1 : 0);
             j <= (idx_y + 1 < this.collisionMap[idx_x + i].length ? 1 : 0);
             j++) {
            var cell = this.collisionMap[idx_x + i][idx_y + j];
        
            for (var k = 0; k < cell.length; k++) {
                set.add(cell[k]);
            }
        }
    }

    for (var i = 0; i < set.length; i++) {
        var o = set[i];
        o.redraw();
    }
};

/**
 * Builds and sets the collision map on a Game, using the `collisionPossible`
 * methods of the {@link Player}s and {@link Bound}s.
 */
Game.setCollisionMap = function (game) {
    game.collisionMap = new Array(Math.ceil(game.viewport.canvas.width / 
                                            game.collisionCellSize));

    for (var i = 0; i < game.collisionMap.length; i++) {
        game.collisionMap[i] = new Array(Math.ceil(game.viewport.canvas.height /
                                                   game.collisionCellSize));

        for (var j = 0; j < game.collisionMap[i].length; j++) {
            game.collisionMap[i][j] = new Array();

            var x = game.collisionCellSize * i;
            var y = game.collisionCellSize * j;

            for (var k = 0; k < game.players.length; k++) {
                if (game.players[k]
                        .collisionPossible(x, y, game.collisionCellSize)) {
                    game.collisionMap[i][j].push(game.players[k]);
                }
            }

            for (var k = 0; k < game.bounds.length; k++) {
                if (game.bounds[k]
                        .collisionPossible(x, y, game.collisionCellSize)) {
                    game.collisionMap[i][j].push(game.bounds[k]);
                }
            }
        }
    }
};


exports = module.exports = Game;
