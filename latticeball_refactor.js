window.onload = function () {
    let canvas_bg = document.getElementById("bg");
    let ctx_bg = canvas_bg.getContext("2d");
    let canvas_ball = document.getElementById("ball");
    let ctx_ball = canvas_ball.getContext("2d");
    
    canvas_ball.width = window.innerWidth;
    canvas_ball.height = window.innerHeight;
    canvas_bg.width = window.innerWidth;
    canvas_bg.height = window.innerHeight;

    let game = buildGame(config.shape, canvas_bg.width, canvas_bg.height);

    let collisionCellSize = 20;
    let collisionMap = new Array(Math.ceil(canvas_bg.width / collisionCellSize));
    for (let i = 0; i < collisionMap.length; i++) {
        collisionMap[i] = new Array(Math.ceil(canvas_bg.height / collisionCellSize));

        for (let j = 0; j < collisionMap[i].length; j++) {
            collisionMap[i][j] = new Array();

            let a_x = collisionCellSize * i;
            let a_y = collisionCellSize * j;
            let b_x = a_x + collisionCellSize;
            let b_y = a_y + collisionCellSize;

            ctx_bg.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctx_bg.strokeStyle = "rgb(128, 128, 128)";
            ctx_bg.lineWidth = 1;
            ctx_bg.strokeRect(a_x, a_y, b_x - a_x, b_y - a_y);

            for (let k = 0; k < game.players.length; k++) {
                if (game.players[k].collisionPossible(a_x, a_y, collisionCellSize)) {
                    collisionMap[i][j].push(game.players[k]);
                    ctx_bg.fillRect(a_x, a_y, collisionCellSize, collisionCellSize);
                }
            }

            for (let k = 0; k < game.bounds.length; k++) {
                if (game.bounds[k].collisionPossible(a_x, a_y, collisionCellSize)) {
                    collisionMap[i][j].push(game.bounds[k]);
                    ctx_bg.fillRect(a_x, a_y, collisionCellSize, collisionCellSize);
                }
            }
        }
    }

    let before = performance.now();



        for (let i = 0; i < game.players.length; i++) {
            game.players[i].redrawNode(ctx_bg);
            game.players[i].redrawShield(ctx_bg);
        }

        for (let i = 0; i < game.bounds.length; i++) {
            game.bounds[i].redraw(ctx_bg);
        }



    let detectCollisions = function (collisionMap, cellSize, ball) {
        let idx_x = Math.floor(ball.position.x / cellSize);
        let idx_y = Math.floor(ball.position.y / cellSize);

        for (let i = (0 < idx_x ? -1 : 0);
             i <= (idx_x < collisionMap.length ? 1 : 0);
             i++) {
            for (let j = (0 < idx_y ? -1 : 0);
                 j <= (idx_y < collisionMap[0].length ? 1 : 0);
                 j++) {
                let cell = collisionMap[idx_x + i][idx_y + j];
            
            


            ctx_ball.globalCompositeOperation = "source-over";
            ctx_ball.fillStyle = "rgba(0, 0, 255, 0.333)";
            ctx_ball.fillRect((idx_x + i) * cellSize, (idx_y + j) * cellSize,
                              cellSize, cellSize);




                for (let k = 0; k < cell.length; k++) {
                    if (cell[k].collisionHandler(game.ball)) {
                        return true;
                    }
                }
            }
        }
    };


    let animate = function (timestamp) {
        let time = timestamp - before;

        game.ball.redraw(ctx_ball);
        
        while (time > 0) {
            let t = time > 16 ? 16 : time;

            detectCollisions(collisionMap, collisionCellSize, game.ball);

            game.ball.move(t);

            time -= t;
        }

        before = timestamp;
        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
};


var config = { shape: 6,
               nodeRadius: 40,
               shieldRadius: 45,
               shieldHalfWidth: Math.PI / 24,
               shieldStyle: "rgb(0, 0, 255)",
               shieldDepth: 3,
               bgStyle: "rgb(255, 255, 255)",
               boundStyle: "rgb(0, 0, 0)",
               boundWidth: 1,
               nodeStyle: "rgb(0, 0, 0)",
               ballStyle: "rgb(255, 0, 0)",
               ballRadius: 10 };


const TAU = 2 * Math.PI;


function buildGame(n, width, height) {
    let center = new V(width / 2, height / 2);
    let radius = Math.min(center.x, center.y) - 10;
    let angle = TAU / n;

    let players = new Array(n);
    let bounds = new Array(n);
    let ball = new Ball(new V(center.x, center.y), config.ballRadius);
    
    for (let i = 0; i < n; i++) {
        let disp_angle = i * angle;
        let position = center.add(new V(Math.cos(disp_angle) * radius,
                                        Math.sin(disp_angle) * radius));
        let startAngle = disp_angle + (TAU / 4) + (angle / 2);
        let endAngle = disp_angle + (TAU * (3 / 4)) - (angle / 2);
        let shieldCenter = (startAngle + endAngle) / 2;

        players[i] = new Player(position, startAngle % TAU, endAngle % TAU,
                                config.nodeRadius, config.shieldRadius,
                                (shieldCenter - config.shieldHalfWidth) % TAU,
                                (shieldCenter + config.shieldHalfWidth) % TAU);
    }

    for (let i = 0; i < n; i++) {
        bounds[i] = new Bound(players[i].startBound.b,
                              players[(i + 1) % n].endBound.b);
    }
    
    return { players: players, bounds: bounds, ball: ball };
}


function Ball(position, radius) {
    this.position = position;
    this.radius = radius;
    this.velocity = new V(0.4 * (Math.random() - 0.5),
                          0.4 * (Math.random() - 0.5));
}

Ball.prototype.move = function (time) {
    this.position.x += this.velocity.x * time;
    this.position.y += this.velocity.y * time;
};

Ball.prototype.redraw = function (ctx) {
    ctx.globalCompositeOperation = "copy";
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, TAU, false);
    ctx.closePath();
    ctx.fillStyle = config.ballStyle;
    ctx.fill();
};


function Player(position, startAngle, endAngle, radius,
                shieldRadius, shieldStartAngle, shieldEndAngle) {
    this.position = position;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.radius = radius;
    this.startBound = new Bound(this.position, this.position.add(
                               new V(this.radius * Math.cos(this.startAngle),
                                     this.radius * Math.sin(this.startAngle))));
    this.endBound = new Bound(this.position, this.position.add(
                             new V(this.radius * Math.cos(this.endAngle),
                                   this.radius * Math.sin(this.endAngle))));
    this.shieldRadius = shieldRadius;
    this.shieldStartAngle = shieldStartAngle;
    this.shieldEndAngle = shieldEndAngle;
    this.health = 1;
}

Player.prototype.collisionPossible = function (x, y, size) {
    let radius = size / 2;
    let center = new V(x + radius, y + radius);
    let v = center.sub(this.position);
    let edge_dist = radius / Math.max(Math.abs(Math.cos(v.angle)),
                                      Math.abs(Math.sin(v.angle)));

    if (v.mag < this.shieldRadius + edge_dist + 1 &&
        util.angle.between(this.startAngle, v.angle, this.endAngle)) {
        return true;
    }

    if (this.startBound.collisionPossible(x, y, size) ||
        this.endBound.collisionPossible(x, y, size)) {
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

    if (v.magsq < Math.pow(this.shieldRadius + ball.radius, 2) + 1 &&
        util.angle.between(this.shieldStartAngle, v.angle,
                           this.shieldEndAngle)) {
        ball.velocity = ball.velocity.reflect(v);
        
        return true;
    }

    if (v.magsq < Math.pow(this.radius + ball.radius, 2) + 1 &&
        util.angle.between(this.startAngle, v.angle, this.endAngle)) {
        ball.velocity = ball.velocity.reflect(v);
        this.health -= this.health < this.damageRate ? this.health :
                                                       this.damageRate;
        
        return true;
    }

    if (this.startBound.collisionHandler(ball) ||
        this.endBound.collisionHandler(ball)) {
        return true;
    }

    return false;
};

Player.prototype.redrawNode = function (ctx) {
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.arc(this.position.x, this.position.y, this.radius + 1,
            this.startAngle, this.endAngle, false);
    ctx.closePath();
    ctx.fillStyle = config.bgStyle;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.arc(this.position.x, this.position.y, this.radius,
            this.startAngle, this.endAngle, false);
    ctx.closePath();
    ctx.strokeStyle = config.boundStyle;
    ctx.lineWidth = config.boundWidth;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.arc(this.position.x, this.position.y, this.radius * this.health,
            this.startAngle, this.endAngle, false);
    ctx.closePath();
    ctx.fillStyle = config.nodeStyle;
    ctx.fill();
};

Player.prototype.redrawShield = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.shieldRadius,
            this.shieldStartAngle + 0.02, this.shieldEndAngle + 0.02, false);
    ctx.strokeStyle = config.bgStyle;
    ctx.lineWidth = config.shieldDepth + 1;
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.shieldRadius,
            this.shieldStartAngle, this.shieldEndAngle, false);
    ctx.strokeStyle = config.shieldStyle;
    ctx.lineWidth = config.shieldDepth;
    ctx.stroke();
    ctx.closePath();
};


function Bound(a, b) {
    L.call(this, a, b);
};
Bound.prototype = new L();

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

Bound.prototype.redraw = function (ctx) {
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.closePath();
    ctx.strokeStyle = config.bgStyle;
    ctx.lineWidth = config.boundWidth + 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.closePath();
    ctx.strokeStyle = config.boundStyle;
    ctx.lineWidth = config.boundWidth;
    ctx.stroke();
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


var util = {
    angle: {
        between: function (start, a, end) {
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
