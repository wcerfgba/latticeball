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
               ballRadius: 10 };


window.onload = function () {
    let canvas = document.getElementById("canvas");
    let menu_wrapper = document.getElementById("menu-wrapper");
    let playBtn = document.getElementById("play");
    
    playBtn.addEventListener("click", function (e) {
        let shape = parseInt(document.getElementById("sides").value);
        shape = (shape === NaN || shape < 3) ? 6 : shape;

        let viewport = new Viewport(canvas);
//        let game = new SinglePlayerGame(shape, viewport);
        let game = new SPLatticeGame(viewport);

        let resizeListener = bindResizeListener(game);
        let controlListener = bindControlListener(game.players[game.player]);
        bindEscKeyListener(game, menu_wrapper, resizeListener,
                           controlListener);


        let before = performance.now();

        game.redrawAll();
        
        let animate = function (timestamp) {
            let time = timestamp - before;
            
            game.ball.clear();

            while (time > 0) {
                let t = time > 10 ? 10 : time;

                game.detectCollision();

                game.ball.move(t);
                time -= t;
            }
           
            game.ball.redraw();
            game.redrawActive(); 
           
            let msg = game.isGameFinished();

            if (msg) {
                game.viewport.ctx.font = "48px sans";
                let metrics = game.viewport.ctx.measureText(msg);
                game.viewport.ctx.fillText(msg,
                               (game.viewport.canvas.width - metrics.width) / 2,
                               game.viewport.canvas.height / 2);
            } else { 
                before = timestamp;
                animFrame = requestAnimationFrame(animate);
            }
        };
        
        menu_wrapper.style.display = "none";
        animFrame = requestAnimationFrame(animate);
    });
};


function bindResizeListener(game) {
    let listener = (function () {
        let timeout;

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
    let listener = function (e) {
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
    let listener = function (e) {
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
        let a = ball.position.sub(player.position).angle;
        let shieldCenter = player.shieldAngle;

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


function SPLatticeGame(viewport) {
    this.viewport = viewport;
    
    let spacing = 130;
    let xDensity = Math.floor(viewport.canvas.width / spacing);
    let yDensity = Math.floor(viewport.canvas.height / spacing);

    this.players = new Array(xDensity * yDensity);
    this.bounds = new Array(4);
    this.ball = new Ball(new V(100, 100), this.viewport, config.ballRadius);
    this.ais = new Array(this.players.length - 1);
    this.player = Math.floor((xDensity * yDensity) / 2);

    for (let i = 0; i < this.players.length; i++) {
        let x = ((i % xDensity) * spacing) + (1.5 * config.nodeRadius);
        let y = (Math.floor(i / xDensity) * spacing) +
                    (1.5 * config.nodeRadius);
        let style = i === this.player ? config.playerStyle : config.nodeStyle;

        if ((Math.floor(i / xDensity) % 2) == 1) {
            x += Math.floor(spacing / 2);
        }
        
        this.players[i] = new Player(new V(x, y), this.viewport, 0, TAU, 
                                     config.nodeRadius, config.shieldRadius,
                                     config.shieldHalfWidth, style);
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

        this.ais.push(setInterval(
                            buildAI(this.players[i], this.ball, 0.04), 100));
    }

    Game.setCollisionMap(this);
}
SPLatticeGame.prototype = Object.create(Game.prototype);


function SinglePlayerGame(shape, viewport) {
    this.viewport = viewport;
    this.players = new Array(shape);
    this.player = 0;
    this.bounds = new Array(shape);
    this.ball = new Ball(new V(this.viewport.center.x, this.viewport.center.y),
                         this.viewport, config.ballRadius);
    this.collisionMap = new Array(Math.ceil(this.viewport.canvas.width / 
                                            config.collisionCellSize));
    this.ais = new Array(shape - 1);
    
    let radius = Math.min(this.viewport.center.x, this.viewport.center.y) - 10;
    let angle = TAU / shape;
    
    for (let i = 0; i < shape; i++) {
        let disp_angle = i * angle;
        let position = new V(this.viewport.center.x +
                                (Math.cos(disp_angle) * radius),
                             this.viewport.center.y +
                                (Math.sin(disp_angle) * radius));
        let startAngle = disp_angle + (TAU / 4) + (angle / 2);
        let endAngle = disp_angle + (TAU * (3 / 4)) - (angle / 2);
        let shieldCenter = (startAngle + endAngle) / 2;

        this.players[i] = new Player(position, this.viewport, 
                                 startAngle, (TAU / 2) - angle,
                                 config.nodeRadius, config.shieldRadius,
                                 shieldCenter, config.shieldHalfWidth);
    }

    for (let i = 0; i < shape; i++) {
        this.bounds[i] = new Bound(this.players[i].startBound.b,
                                   this.players[(i + 1) % shape].endBound.b,
                                   this.viewport);
    }

        
    for (let i = 1; i < this.players.length; i++) {
        this.ais[i - 1] = setInterval(
                            buildAI(this.players[i], this.ball, 0.04), 100);
    }
}
SinglePlayerGame.prototype = Object.create(Game.prototype);


function Game() {}

Game.prototype.stopAIs = function () {
    for (let i = 0; i < this.ais.length; i++) {
        clearInterval(this.ais[i]);
    }
};

Game.prototype.detectCollision = function () {
    let idx_x = Math.floor(this.ball.position.x / config.collisionCellSize);
    let idx_y = Math.floor(this.ball.position.y / config.collisionCellSize);

    let set = new Set();

    for (let i = (0 < idx_x ? -1 : 0);
         i <= (idx_x + 1 < this.collisionMap.length ? 1 : 0);
         i++) {
        for (let j = (0 < idx_y ? -1 : 0);
             j <= (idx_y + 1 < this.collisionMap[idx_x + i].length ? 1 : 0);
             j++) {
            let cell = this.collisionMap[idx_x + i][idx_y + j];
        
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
    let idx_x = Math.floor(this.ball.position.x / config.collisionCellSize);
    let idx_y = Math.floor(this.ball.position.y / config.collisionCellSize);

    let set = new Set();

    for (let i = (0 < idx_x ? -1 : 0);
         i <= (idx_x + 1 < this.collisionMap.length ? 1 : 0);
         i++) {
        for (let j = (0 < idx_y ? -1 : 0);
             j <= (idx_y + 1 < this.collisionMap[idx_x + i].length ? 1 : 0);
             j++) {
            let cell = this.collisionMap[idx_x + i][idx_y + j];
        
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
                                            config.collisionCellSize));

    for (let i = 0; i < game.collisionMap.length; i++) {
        game.collisionMap[i] = new Array(Math.ceil(game.viewport.canvas.height /
                                                   config.collisionCellSize));

        for (let j = 0; j < game.collisionMap[i].length; j++) {
            game.collisionMap[i][j] = new Array();

            let x = config.collisionCellSize * i;
            let y = config.collisionCellSize * j;

            for (let k = 0; k < game.players.length; k++) {
                if (game.players[k]
                        .collisionPossible(x, y, config.collisionCellSize)) {
                    game.collisionMap[i][j].push(game.players[k]);
                }
            }

            for (let k = 0; k < game.bounds.length; k++) {
                if (game.bounds[k]
                        .collisionPossible(x, y, config.collisionCellSize)) {
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
    let center = this.center;
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
    let x = this.position.x - this.viewport.position.x;
    let y = this.position.y - this.viewport.position.y;

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
        let x = this.position.x - this.viewport.position.x;
        let y = this.position.y - this.viewport.position.y;
        
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
    let radius = size / 2;
    let center = new V(x + radius, y + radius);
    let v = center.sub(this.position);
    let edge_dist = radius / Math.max(Math.abs(Math.cos(v.angle)),
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
    let v = ball.position.sub(this.position);
    let normal_velocity = -v.dot( ball.velocity);

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
    let x = this.position.x - this.viewport.position.x;
    let y = this.position.y - this.viewport.position.y;

    if (-this.radius < x && x < this.viewport.canvas.width + this.radius &&
        -this.radius < y && y < this.viewport.canvas.height + this.radius) {
        this.viewport.ctx.moveTo(x, y);
        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.radius + 1,
                this.startAngle, this.endAngle, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.fillStyle = config.bgStyle;
        this.viewport.ctx.fill();
        this.viewport.ctx.moveTo(x, y);
        this.viewport.ctx.beginPath();
        this.viewport.ctx.arc(x, y, this.radius,
                this.startAngle, this.endAngle, false);
        this.viewport.ctx.closePath();
        this.viewport.ctx.strokeStyle = this.style;
        this.viewport.ctx.lineWidth = config.boundWidth;
        this.viewport.ctx.stroke();
        this.viewport.ctx.moveTo(x, y);
        this.viewport.ctx.beginPath();
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

    let x = this.position.x - this.viewport.position.x;
    let y = this.position.y - this.viewport.position.y;

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
        let x = this.position.x - this.viewport.position.x;
        let y = this.position.y - this.viewport.position.y;

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
    let w_x = x;
    let n_y = y;
    let e_x = x + size;
    let s_y = y + size;

    // Test if either point is in the box.
    if ((w_x <= this.a.x && this.a.x <= e_x &&
         n_y <= this.a.y && this.a.y <= s_y) ||
        (w_x <= this.b.x && this.b.x <= e_x &&
         n_y <= this.b.y && this.b.y <= s_y)) {
        return true;
    }

    // Find magnitude of direction vector necessary to intersect each line of 
    // the box...
    let w_p = (w_x - this.a.x) / this.direction.x;
    let n_p = (n_y - this.a.y) / this.direction.y;
    let e_p = (e_x - this.a.x) / this.direction.x;
    let s_p = (s_y - this.a.y) / this.direction.y;
    // ... and the resultant coordinate.
    let w_y = this.a.y + (this.direction.y * w_p);
    let n_x = this.a.x + (this.direction.x * n_p);
    let e_y = this.a.y + (this.direction.y * e_p);
    let s_x = this.a.x + (this.direction.x * s_p);
    
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
    let v = ball.position.sub(this.a);
    let pos_normal = v.dot(this.normal);
    let pos_direction = v.dot(this.direction.norm);
    let vel_normal = ball.velocity.dot(this.normal);

    if (Math.abs(pos_normal) < ball.radius + 1 &&
        Math.sign(pos_normal) != Math.sign(vel_normal) &&
        pos_direction <= this.direction.mag) {
        ball.velocity = ball.velocity.reflect(this.normal);
        
        return true;
    }

    return false;
};

Bound.prototype.redraw = function () {
    let a_x = this.a.x - this.viewport.position.x;
    let a_y = this.a.y - this.viewport.position.y;
    let b_x = this.b.x - this.viewport.position.x;
    let b_y = this.b.y - this.viewport.position.y;

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
        let a = Math.atan2(v.y, v.x);
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
    let n = this.dot(v.norm);
    let p = this.dot(v.norm.cw90deg);
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
