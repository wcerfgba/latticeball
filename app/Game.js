var TreeSet = require("TreeSet");
var util = require("util");

var TAU = util.TAU;

function Game() {}

Game.prototype.updateAIs = function () {
    for (var i = 0; i < this.ais.length; i++) {
        var a = this.ball.position.sub(this.ais[i].position).angle;
        var shieldCenter = this.ais[i].shieldAngle;

        if (a < shieldCenter) {
            if (shieldCenter - a < TAU / 2) {
                this.ais[i].moveShield(-Math.min(this.aiSpeed,
                                                 shieldCenter - a));
            } else {
                this.ais[i].moveShield(Math.min(this.aiSpeed,
                                                a + TAU - shieldCenter));
            } 
        } else {
            if (a - shieldCenter < TAU / 2) {
                this.ais[i].moveShield(Math.min(this.aiSpeed,
                                                a - shieldCenter));
            } else {
                this.ais[i].moveShield(-Math.min(this.aiSpeed,
                                                 shieldCenter + TAU - a));
            } 
        }
    } 
};

Game.prototype.detectCollision = function () {
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
        if (o.collisionHandler(this.ball)) {
            return true;
        }
    }

    return false;
};

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
