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

    let before = performance.now();
    let collisionResume = before;



        for (let i = 0; i < game.players.length; i++) {
            game.players[i].redrawNode(ctx_bg);
            game.players[i].redrawShield(ctx_bg);
        }

        for (let i = 0; i < game.boundPoints.length; i++) {
            game.boundPoints[i].redraw(ctx_bg);
        }



    let animate = function (timestamp) {
        for (let i = 0; i < game.players.length; i++) {
            if (collisionResume < timestamp &&
                game.players[i].collisionHandler(game.ball)) {
                collisionResume = timestamp + 10;
            }
        }

        for (let i = 0; i < game.boundPoints.length; i++) {
            if (collisionResume < timestamp && 
                game.boundPoints[i].collisionHandler(game.ball)) {
                collisionResume = timestamp + 10;
            }
        }

        game.ball.move(timestamp - before);
        game.ball.redraw(ctx_ball);

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
    let center = { x: width / 2, y: height / 2 };
    let radius = Math.min(center.x, center.y) - 10;
    let angle = TAU / n;

    let players = new Array(n);
    let boundPoints = new Array(2 * n);
    let ball = new Ball(center.x, center.y, config.ballRadius);
    
    for (let i = 0; i < n; i++) {
        let disp_angle = i * angle;
        let x = center.x + (Math.cos(disp_angle) * radius);
        let y = center.y + (Math.sin(disp_angle) * radius);
        let startAngle = disp_angle + (TAU / 4) + (angle / 2);
        let endAngle = disp_angle + (TAU * (3 / 4)) - (angle / 2);
        let shieldCenter = (startAngle + endAngle) / 2;

        players[i] = new Player(x, y, startAngle % TAU, endAngle % TAU,
                                config.nodeRadius, config.shieldRadius,
                                (shieldCenter  - config.shieldHalfWidth) % TAU,
                                (shieldCenter + config.shieldHalfWidth) % TAU);

        let x_a = x + (Math.cos(startAngle) * config.nodeRadius);
        let y_a = y + (Math.sin(startAngle) * config.nodeRadius);
        let x_b = center.x + (Math.cos(disp_angle + (TAU / n)) * radius) -
                    (Math.cos(startAngle) * config.nodeRadius);       
        let y_b = center.y + (Math.sin(disp_angle + (TAU / n)) * radius) - 
                    (Math.sin(startAngle) * config.nodeRadius);       
 
        boundPoints[2 * i] = new BoundPoint(x_a, y_a, null);
        boundPoints[(2 * i) + 1] = new BoundPoint(x_b, y_b, boundPoints[2 * i]);
        boundPoints[2 * i].nextPoint = boundPoints[(2 * i) + 1];
    }

    return { players: players, boundPoints: boundPoints, ball: ball };
}


function Ball(x, y, radius) {
    this.position = { x: x, y: y };
    this.radius = radius;
    this.velocity = { x: 0.4 * (Math.random() - 0.5),
                      y: 0.4 * (Math.random() - 0.5) };
}

Ball.prototype.move = function (time) {
    this.position.x += this.velocity.x * time;
    this.position.y += this.velocity.y * time;
};

Ball.prototype.redraw = function (ctx) {
    ctx.globalCompositeOperation = "copy";
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius,
            0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fillStyle = config.ballStyle;
    ctx.fill();
};


function Player(x, y, startAngle, endAngle, radius,
                shieldRadius, shieldStartAngle, shieldEndAngle) {
    this.position = { x: x, y: y };
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.radius = radius;
    this.shieldRadius = shieldRadius;
    this.shieldStartAngle = shieldStartAngle;
    this.shieldEndAngle = shieldEndAngle;
    this.health = 1;
}

Player.prototype.collisionHandler = function (ball) {
    let v = util.vect.sub(ball.position, this.position);
    let v_magsq = util.vect.magsq(v);
    let v_angle = util.vect.angle(v);

    if (v_magsq < Math.pow(this.shieldRadius + ball.radius, 2) + 1 &&
        util.angle.between(this.shieldStartAngle, v_angle,
                           this.shieldEndAngle)) {
        ball.velocity = util.vect.reflect(ball.velocity, v);
        console.log("shield");
        return true;
    }

    if (v_magsq < Math.pow(this.radius + ball.radius, 2) + 1 &&
        util.angle.between(this.startAngle, v_angle, this.endAngle)) {
        ball.velocity = util.vect.reflect(ball.velocity, v);
        this.health -= this.health < this.damageRate ? this.health :
                                                       this.damageRate;
        console.log("node");
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


function BoundPoint(x, y, nextPoint) {
    Object.defineProperty(this, "nextPoint", {
        set: function (val) {
                if (val instanceof BoundPoint) {
                    this._nextPoint = val;
                    this.normal = util.vect.cw90deg(
                                    util.vect.norm(
                                        util.vect.sub(this.nextPoint.position,
                                                      this.position)));
                } else {
                    this._nextPoint = null;
                    this.normal = null;
                }
        },
        get: function () {
            return this._nextPoint;
        }
    });

    this.position = { x: x, y: y };
    this.normal = null;
    this.nextPoint = nextPoint;
}

BoundPoint.prototype.collisionHandler = function (ball) {
    if (!this.nextPoint) {
        return false;
    }

    let v = util.vect.sub(this.position, ball.position);
    let dist = Math.abs(util.vect.dot(v, this.normal));

    if (dist < ball.radius + 1) {
        ball.velocity = util.vect.reflect(ball.velocity, this.normal);
        console.log("bound");
        return true;
    }

    return false;
};

BoundPoint.prototype.redraw = function (ctx) {
    if (!this.nextPoint) {
        return;
    }

    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.nextPoint.position.x, this.nextPoint.position.y);
    ctx.closePath();
    ctx.strokeStyle = config.bgStyle;
    ctx.lineWidth = config.boundWidth + 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.nextPoint.position.x, this.nextPoint.position.y);
    ctx.closePath();
    ctx.strokeStyle = config.boundStyle;
    ctx.lineWidth = config.boundWidth;
    ctx.stroke();
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
    },
    vect: {
        angle: function (v) {
            let a = Math.atan2(v.y, v.x);
            return a < 0 ? TAU + a : a;
        },
        magsq: function (v) {
            return Math.pow(v.x, 2) + Math.pow(v.y, 2);
        },
        norm: function (v) {
            let mag = Math.sqrt(util.vect.magsq(v));
            return { x: v.x / mag, y: v.y / mag };
        },
        dot: function (v, w) {
            return (v.x * w.x) + (v.y * w.y);
        },
        reflect: function (v, n) {
            n = util.vect.norm(n);
            let p = util.vect.cw90deg(n);
            let N = util.vect.dot(v, n);
            let P = util.vect.dot(v, p);
            return { x: (P * p.x) - (N * n.x), y: (P * p.y) - (N * n.y) };
        },
        sub: function (v, w) {
            return { x: v.x - w.x, y: v.y - w.y };
        },
        cw90deg: function (v) {
            return { x: -v.y, y: v.x };
        }
    }
};
