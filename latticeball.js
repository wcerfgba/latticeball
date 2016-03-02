var animFrame;

var config = { collisionCellSize: 20,
               nodeRadius: 40,
               shieldRadius: 45,
               shieldHalfWidth: Math.PI / 24,
               shieldStyle: "rgb(0, 0, 255)",
               shieldDepth: 3,
               bgStyle: "rgb(255, 255, 255)",
               boundStyle: "rgb(0, 0, 0)",
               boundWidth: 1,
               nodeStyle: "rgb(0, 0, 0)",
               playerStyle: "rgb(128, 0, 128)",
               ballStyle: "rgb(255, 0, 0)",
               ballRadius: 10,
               spacing: 100 };


window.onload = function () {
    var canvas = document.getElementById("canvas");
    var menu_wrapper = document.getElementById("menu-wrapper");
    var gameTypeSelect = document.getElementById("game-type");
    var optsDiv = document.getElementById("opts");
    var playBtn = document.getElementById("play");

    var optsEls = buildOptionsHTMLElements();
    var gameSettings = {};

    var gameTypeHandler = buildGameTypeHandler(gameTypeSelect, optsDiv, optsEls,
                                               gameSettings);
    gameTypeHandler();
    gameTypeSelect.addEventListener("change", gameTypeHandler);
    
    playBtn.addEventListener("click", function (e) {
        populateGameSettings(gameSettings);

        var viewport = new Viewport(canvas);
        var game = new gameSettings.gameFunction(viewport, gameSettings);

        var resizeListener = bindResizeListener(game);
        var controlListener = bindControlListener(game.players[game.player]);
        bindEscKeyListener(game, menu_wrapper, resizeListener,
                           controlListener);

        var before = performance.now();

        game.redrawAll();
        
        var animate = function (timestamp) {
            var time = timestamp - before;
            
            game.ball.clear();

            while (time > 0) {
                var t = time > 10 ? 10 : time;

                game.detectCollision();

                game.ball.move(t);
                time -= t;
            }
           
            game.ball.redraw();
            game.redrawActive(); 
           
            if (game.isOver) {
                game.viewport.ctx.font = "48px sans";
                var metrics = game.viewport.ctx.measureText(game.overMsg);
                game.viewport.ctx.fillText(
                            game.overMsg,
                            (game.viewport.canvas.width - metrics.width) / 2,
                            (game.viewport.canvas.height - metrics.height) / 2);
            } else { 
                before = timestamp;
                animFrame = requestAnimationFrame(animate);
            }
        };
        
        menu_wrapper.style.display = "none";

        animFrame = requestAnimationFrame(animate);
    });
};


function buildGameTypeHandler(gameTypeSelect, optsDiv, optsEls, gameSettings) {
    return function (e) {
        switch (gameTypeSelect.options[gameTypeSelect.selectedIndex].value) {
            case "polygon":
                optsDiv.innerHTML = "";
                optsDiv.appendChild(optsEls.sides);
                gameSettings.gameFunction = SPPolygonGame;
                break;
            case "lattice":
                optsDiv.innerHTML = "";
                optsDiv.appendChild(optsEls.latticeShape);
                gameSettings.gameFunction = SPLatticeGame;
                break;
        }

        optsDiv.appendChild(optsEls.aiSpeed);
        optsDiv.appendChild(optsEls.shieldSize);
        optsDiv.appendChild(optsEls.nodeSize);
    };
}

function populateGameSettings(gameSettings) {
    for (let p in config) {
        gameSettings[p] = config[p];
    }

    switch (gameSettings.gameFunction) {
        case SPPolygonGame:
            gameSettings.sides = parseInt(document.getElementById("sides")
                                                  .value);
            if (gameSettings.sides === NaN || gameSettings.sides < 3) {
                gameSettings.sides = 6;
            }
            break;
        case SPLatticeGame:
            var shape = document.getElementById("latticeShape");
            gameSettings.shape = shape.options[shape.selectedIndex].value;
            if (gameSettings.shape === "hex" ||
                gameSettings.shape === "square") {
                gameSettings.shape = "hex";
            }
            break;
    }

    gameSettings.aiSpeed = parseFloat(document.getElementById("aiSpeed").value);
    gameSettings.shieldHalfWidth =
                        parseFloat(document.getElementById("shieldSize").value);
    gameSettings.nodeRadius =
                            parseInt(document.getElementById("nodeSize").value);

}


function buildOptionsHTMLElements() {
    var elDefs = [
        [ "input", { id: "sides", type: "number", min: "2", value: "6" },
          "Sides" ],
        [ "select", { id: "latticeShape", options: [ [ "hex", "Hexagonal" ],
                                                     [ "square", "Square" ] ] },
          "Lattice shape" ],
        [ "input", { id: "aiSpeed", type: "range", min: "0.1", max: "1", 
                     step: "0.1", value: "0.4" },
          "AI speed" ],
        [ "input", { id: "shieldSize", type: "range", min: "0.05", max: "0.25",
                     step: "0.01", value: "0.1" },
          "Shield size" ],
        [ "input", { id: "nodeSize", type: "range", min: "10", max: "100",
                     step: "1", value: "50" },
          "Node size" ] 
    ];

    var elements = {};

    for (let def of elDefs) {
        var id = def[1].id;
        var element = document.createElement(def[0]);

        switch (def[0]) {
            case "input":
                for (let p in def[1]) {
                    element.setAttribute(p, def[1][p]);
                }
                break;
            case "select":
                element.setAttribute("id", def[1].id);
                for (let o of def[1].options) {
                    var opt = document.createElement("option");
                    opt.value = o[0];
                    opt.text = o[1];
                    element.add(opt);
                }
                break;
        }

        var label = document.createElement("label");
        label.setAttribute("for", id);
        label.textContent = def[2];

        var div = document.createElement("div");
        div.setAttribute("class", "opt");
        div.appendChild(label);
        div.appendChild(element);

        elements[id] = div;
    }

    return elements;
}


function bindResizeListener(game) {
    var listener = (function () {
        var timeout;

        return function (e) {
            clearInterval(timeout);
            timeout = setTimeout(function () {
                game.viewport.resize();
                game.redrawAll();
            }, 100);
        };
    })();

    window.addEventListener("resize", listener);

    return listener;
}

function bindControlListener(player) {
    var listener = function (e) {
        if (e.keyCode === 37) { // Left
            player.moveShield(-0.1);
        } else if (e.keyCode === 39) { // Right
            player.moveShield(0.1);
        }
    };

    window.addEventListener("keydown", listener);

    return listener;
}
    
function bindEscKeyListener(game, menu_wrapper, resizeListener,
                            controlListener) {
    var listener = function (e) {
        if (e.keyCode === 27) {
            cancelAnimationFrame(animFrame);
            game.stopAIs();
            menu_wrapper.style.display = "table";
            window.removeEventListener("keyup", listener);
            window.removeEventListener("resize", resizeListener);
            window.removeEventListener("keydown", controlListener);
        }
    };

    window.addEventListener("keyup", listener);
}


function buildAI(player, ball, max_adjust) {
    return function () {
        var a = ball.position.sub(player.position).angle;
        var shieldCenter = player.shieldAngle;

        if (a < shieldCenter) {
            if (shieldCenter - a < TAU / 2) {
                player.moveShield(-Math.min(max_adjust, shieldCenter - a));
            } else {
                player.moveShield(Math.min(max_adjust,
                                            a + TAU - shieldCenter));
            } 
        } else {
            if (a - shieldCenter < TAU / 2) {
                player.moveShield(Math.min(max_adjust, a - shieldCenter));
            } else {
                player.moveShield(-Math.min(max_adjust,
                                           shieldCenter + TAU - a));
            } 
        }
    };
};


function SPLatticeGame(viewport, settings) {
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

    for (let i = 0; i < this.players.length; i++) {
        var x = ((i % xDensity) * settings.spacing) + (1.5 * config.nodeRadius);
        var y = (Math.floor(i / xDensity) * settings.spacing) +
                    (1.5 * config.nodeRadius);
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

    for (let i = 0; i < this.players.length; i++) {
        if (i == this.player) {
            continue;
        }

    // TODO: AIs in main loop
        this.ais.push(setInterval(
                            buildAI(this.players[i], this.ball, 0.04), 100));
    }

    Game.setCollisionMap(this);
}
SPLatticeGame.prototype = Object.create(Game.prototype);


function SPPolygonGame(viewport, settings) {
    this.viewport = viewport;
    this.players = new Array(settings.sides);
    this.player = 0;
    this.bounds = new Array(settings.sides);
    this.ball = new Ball(new V(this.viewport.center.x, this.viewport.center.y),
                         this.viewport, settings.ballRadius);
    this.ais = new Array(settings.sides - 1);
    this.collisionCellSize = settings.collisionCellSize;
    
    var radius = Math.min(this.viewport.center.x, this.viewport.center.y) - 10;
    var angle = TAU / settings.sides;
    
    for (let i = 0; i < settings.sides; i++) {
        var disp_angle = i * angle;
        var position = new V(this.viewport.center.x +
                                (Math.cos(disp_angle) * radius),
                             this.viewport.center.y +
                                (Math.sin(disp_angle) * radius));
        var startAngle = disp_angle + (TAU / 4) + (angle / 2);
        var endAngle = disp_angle + (TAU * (3 / 4)) - (angle / 2);
        var shieldCenter = (startAngle + endAngle) / 2;
        var style = i === this.player ? settings.playerStyle : 
                                        settings.nodeStyle;
        
        this.players[i] = new Player(position, this.viewport, 
                                 startAngle, (TAU / 2) - angle,
                                 settings.nodeRadius, settings.nodeRadius + 5,
                                 settings.shieldHalfWidth, style);
    }

    for (let i = 0; i < settings.sides; i++) {
        this.bounds[i] = new Bound(
                              this.players[i].startBound.b,
                              this.players[(i + 1) % settings.sides].endBound.b,
                              this.viewport);
    }
        
    for (let i = 1; i < this.players.length; i++) {
        this.ais[i - 1] = setInterval(
                            buildAI(this.players[i], this.ball, 0.04), 100);
    }

    Game.setCollisionMap(this);
}
SPPolygonGame.prototype = Object.create(Game.prototype);


function Game() {}

Game.prototype.stopAIs = function () {
    for (let i = 0; i < this.ais.length; i++) {
        clearInterval(this.ais[i]);
    }
};

Game.prototype.detectCollision = function () {
    var idx_x = Math.floor(this.ball.position.x / this.collisionCellSize);
    var idx_y = Math.floor(this.ball.position.y / this.collisionCellSize);

    var set = new Set();

    for (let i = (0 < idx_x ? -1 : 0);
         i <= (idx_x + 1 < this.collisionMap.length ? 1 : 0);
         i++) {
        for (let j = (0 < idx_y ? -1 : 0);
             j <= (idx_y + 1 < this.collisionMap[idx_x + i].length ? 1 : 0);
             j++) {
            var cell = this.collisionMap[idx_x + i][idx_y + j];
        
            for (let k = 0; k < cell.length; k++) {
                set.add(cell[k]);
            }
        }
    }

    for (let o of set) {
        if (o.collisionHandler(this.ball)) {
            return true;
        }
    }

    return false;
};

// TODO: Lightweight game over implementation.
Game.prototype.isGameFinished = function () {
    if (this.players[this.player].health == 0) {
        return "CPU wins";
    }

    for (let i = 0; i < this.players.length; i++) {
        if (i === this.player) {
            continue;
        }

        if (this.players[i].health > 0) {
            return false;
        }
    }

    return "You win";
};

Game.prototype.redrawAll = function () {
    for (let i = 0; i < this.players.length; i++) {
        this.players[i].redraw();
    }
    
    for (let i = 0; i < this.bounds.length; i++) {
        this.bounds[i].redraw();
    }
};

Game.prototype.redrawActive = function () {
    var idx_x = Math.floor(this.ball.position.x / this.collisionCellSize);
    var idx_y = Math.floor(this.ball.position.y / this.collisionCellSize);

    var set = new Set();

    for (let i = (0 < idx_x ? -1 : 0);
         i <= (idx_x + 1 < this.collisionMap.length ? 1 : 0);
         i++) {
        for (let j = (0 < idx_y ? -1 : 0);
             j <= (idx_y + 1 < this.collisionMap[idx_x + i].length ? 1 : 0);
             j++) {
            var cell = this.collisionMap[idx_x + i][idx_y + j];
        
            for (let k = 0; k < cell.length; k++) {
                set.add(cell[k]);
            }
        }
    }

    for (let o of set) {
        o.redraw();
    }
};

Game.setCollisionMap = function (game) {
    game.collisionMap = new Array(Math.ceil(game.viewport.canvas.width / 
                                            game.collisionCellSize));

    for (let i = 0; i < game.collisionMap.length; i++) {
        game.collisionMap[i] = new Array(Math.ceil(game.viewport.canvas.height /
                                                   game.collisionCellSize));

        for (let j = 0; j < game.collisionMap[i].length; j++) {
            game.collisionMap[i][j] = new Array();

            var x = game.collisionCellSize * i;
            var y = game.collisionCellSize * j;

            for (let k = 0; k < game.players.length; k++) {
                if (game.players[k]
                        .collisionPossible(x, y, game.collisionCellSize)) {
                    game.collisionMap[i][j].push(game.players[k]);
                }
            }

            for (let k = 0; k < game.bounds.length; k++) {
                if (game.bounds[k]
                        .collisionPossible(x, y, game.collisionCellSize)) {
                    game.collisionMap[i][j].push(game.bounds[k]);
                }
            }
        }
    }
};


function Viewport(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");

    this.fillWindow();

    this.position = { x: 0, y: 0 };

    Object.defineProperty(this, "limit", {
        get: function () {
            return { x: this.position.x + this.canvas.width,
                     y: this.position.y + this.canvas.height };
        }
    });
    
    Object.defineProperty(this, "center", {
        get: function () {
            return { x: this.position.x + (this.canvas.width / 2),
                     y: this.position.y + (this.canvas.height / 2) };
        }
    });
}

Viewport.prototype.translate = function (x, y) {
    this.position.x += x;
    this.position.y += y;
}

Viewport.prototype.resize = function () {
    var center = this.center;
    this.fillWindow();
    this.position.x = center.x - (this.canvas.width / 2);
    this.position.y = center.y - (this.canvas.height / 2);
}

Viewport.prototype.fillWindow = function () {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
};


function Ball(position, viewport, radius) {
    this.position = position;
    this.viewport = viewport;
    this.radius = radius;
    this.velocity = new V(0.4 * (Math.random() - 0.5),
                          0.4 * (Math.random() - 0.5));
}

Ball.prototype.move = function (time) {
    this.position.x += this.velocity.x * time;
    this.position.y += this.velocity.y * time;
};

Ball.prototype.clear = function () {
    var x = this.position.x - this.viewport.position.x;
    var y = this.position.y - this.viewport.position.y;

    if (-this.radius < x && x < this.viewport.canvas.width + this.radius &&
        -this.radius < y && y < this.viewport.canvas.height + this.radius) {
        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.radius + 2, 0, TAU, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.fillStyle = config.bgStyle;
        this.viewport.ctx.fill();

        return true;
    }

    return false;
};

Ball.prototype.redraw = function () {
    if (this.clear()) {
        var x = this.position.x - this.viewport.position.x;
        var y = this.position.y - this.viewport.position.y;
        
        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.radius, 0, TAU, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.fillStyle = config.ballStyle;
        this.viewport.ctx.fill();
    }
};


function Player(position, viewport, startAngle, angleRange, radius,
                shieldRadius, shieldHalfWidth, style) {
    this.position = position;
    this.viewport = viewport;
    this.startAngle = startAngle;
    this.angleRange = angleRange;
    this.fullCircle = this.angleRange + 0.01 > TAU ? true : false;
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
    this.health = 1;
    this.damageRate = 0.1;
}

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

Player.prototype.collisionPossible = function (x, y, size) {
    var radius = size / 2;
    var center = new V(x + radius, y + radius);
    var v = center.sub(this.position);
    var edge_dist = radius / Math.max(Math.abs(Math.cos(v.angle)),
                                      Math.abs(Math.sin(v.angle)));

    if (v.mag < this.shieldRadius + edge_dist + 1 &&
        ((!this.fullCircle &&
          util.angle.between(this.startAngle, v.angle, this.endAngle)) ||
         this.fullCircle)) {
        return true;
    }

    if (!this.fullCircle &&
        (this.startBound.collisionPossible(x, y, size) ||
         this.endBound.collisionPossible(x, y, size))) {
        return true;
    }
    
    return false;
};

Player.prototype.collisionHandler = function (ball) {
    var v = ball.position.sub(this.position);
    var normal_velocity = -v.dot( ball.velocity);

    if (normal_velocity < 0) {
        return false;
    }

    if (this.health > 0 &&
        v.magsq < Math.pow(this.shieldRadius + ball.radius, 2) + 1 &&
        util.angle.between(this.shieldStartAngle, v.angle,
                           this.shieldEndAngle)) {
        ball.velocity = ball.velocity.reflect(v);
        
        return true;
    }

    if (v.magsq < Math.pow(this.radius + ball.radius, 2) + 1 &&
        ((!this.fullCircle &&
          util.angle.between(this.startAngle, v.angle, this.endAngle)) ||
         this.fullCircle)) {
        ball.velocity = ball.velocity.reflect(v);
        this.takeDamage();
        return true;
    }

    if (!this.fullCircle && 
        (this.startBound.collisionHandler(ball) ||
         this.endBound.collisionHandler(ball))) {
        this.takeDamage();
        return true;
    }

    return false;
};

Player.prototype.takeDamage = function () {
    if (this.health < this.damageRate + 0.001) {
        this.clearShield();
        this.health = 0;
    } else {
        this.health -= this.damageRate;
    }
};

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
        this.viewport.ctx.fillStyle = config.bgStyle;
        this.viewport.ctx.fill();
        this.viewport.ctx.beginPath();
        this.viewport.ctx.moveTo(x, y);
        this.viewport.ctx.arc(x, y, this.radius,
                this.startAngle, this.endAngle, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.strokeStyle = this.style;
        this.viewport.ctx.lineWidth = config.boundWidth;
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
        this.viewport.ctx.strokeStyle = config.bgStyle;
        this.viewport.ctx.lineWidth = config.shieldDepth + 1;
        this.viewport.ctx.stroke();
        this.viewport.ctx.closePath();

        return true;
    }

    return false;
};

Player.prototype.redrawShield = function () {
    if (this.clearShield() && this.health > 0) {
        var x = this.position.x - this.viewport.position.x;
        var y = this.position.y - this.viewport.position.y;

        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.shieldRadius,
                this.shieldStartAngle, this.shieldEndAngle, false);
        this.viewport.ctx.strokeStyle = config.shieldStyle;
        this.viewport.ctx.lineWidth = config.shieldDepth;
        this.viewport.ctx.stroke();
        this.viewport.ctx.closePath();

        return true;
    }

    return false;
};

Player.prototype.redraw = function () {
    this.redrawNode();
    this.redrawShield();
};


function Bound(a, b, viewport) {
    L.call(this, a, b);

    this.viewport = viewport;
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
    this.viewport.ctx.strokeStyle = config.bgStyle;
    this.viewport.ctx.lineWidth = config.boundWidth + 1;
    this.viewport.ctx.stroke();
    this.viewport.ctx.beginPath();
    this.viewport.ctx.moveTo(a_x, a_y);
    this.viewport.ctx.lineTo(b_x, b_y);
    this.viewport.ctx.closePath();
    this.viewport.ctx.strokeStyle = config.boundStyle;
    this.viewport.ctx.lineWidth = config.boundWidth;
    this.viewport.ctx.stroke();
};


function dProps(o) {
    o.dPropsCache = {};

    for (let f in o.constructor.dProps) {
        Object.defineProperty(o, f,
            (function (dProp) {
                return {
                    get: function () {
                        if (!(dProp in this.dPropsCache)) {
                            this.dPropsCache[dProp] =
                                this.constructor.dProps[dProp](this);
                        }

                        return this.dPropsCache[dProp];
                    }
                };
            })(f)
        );
    }

    return o;
}


function V(x, y) {
    this.x = x;
    this.y = y;

    dProps(this);
}

V.dProps = {
    angle: function (v) {
        var a = Math.atan2(v.y, v.x);
        return a < 0 ? TAU + a : a;
    },
    magsq: function (v) {
        return Math.pow(v.x, 2) + Math.pow(v.y, 2);
    },
    mag: function (v) {
        return Math.sqrt(v.magsq);
    },
    norm: function (v) {
        return new V(v.x / v.mag, v.y / v.mag);
    },
    cw90deg: function (v) {
        return new V(-v.y, v.x);
    }
};

V.prototype.dot = function (v) {
    return (this.x * v.x) + (this.y * v.y);
};

V.prototype.add = function (v) {
    return new V(this.x + v.x, this.y + v.y);
};

V.prototype.sub = function (v) {
    return new V(this.x - v.x, this.y - v.y);
};

V.prototype.reflect = function (v) {
    var n = this.dot(v.norm);
    var p = this.dot(v.norm.cw90deg);
    return new V((p * v.norm.cw90deg.x) - (n * v.norm.x),
                 (p * v.norm.cw90deg.y) - (n * v.norm.y));
};


function L(a, b) {
    this.a = a;
    this.b = b;

    dProps(this);
}

L.dProps = {
    direction: function (l) {
        return l.b.sub(l.a);
    },
    normal: function (l) {
        return l.direction.norm.cw90deg;
    }
};


const TAU = 2 * Math.PI;

var util = {
    angle: {
        between: function (start, a, end) {
            start = start % TAU;
            a = a % TAU;
            end = end % TAU;

            if (start < end) {
                return (start < a && a < end);
            } else if (start < a) {
                return a < end + TAU;
            } else {
                return a < end;
            }
        }
    }
};
