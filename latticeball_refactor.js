window.onload = function () {
    let canvas_bg = document.getElementById("bg");
    let ctx_bg = canvas_bg.getContext("2d");
    let canvas_ball = document.getElementById("ball");
    let ctx_ball = canvas_ball.getContext("2d");

    let game = buildGame(config.shape);

    let before = performance.now();
    let collisionResume = before;

    let animate = function (timestamp) {
        for 

        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
};





var config = { shape: 6,
               nodeRadius: 20,
               shieldRadius: 25,
               shieldWidth: Math.PI / 12,
               bgStyle: "rgb(255, 255, 255)",
               boundStyle: "rgb(0, 0, 0)",
               boundWidth: 1,
               nodeStyle: "rgb(0, 0, 0)" };


function buildGame(n) {
    let players = new Array(n);
    let boundPoints = new Array(n);
    let ball = new Ball(???); // Don't forget this! :3
    
}


function Player(x, y, startAngle, endAngle, radius,
                shieldRadius, shieldStartAngle, shieldEndAngle) {
    this.position = { x: x, y: y };
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.radius = radius;
    this.shieldRadius = shieldRadius;
    this.shieldStartAngle = sheildStartAngle;
    this.shieldEndAngle = shieldEndAngle;
    this.health = 1;
}

Player.prototype.collisionHandler = function (ball) {
    let v = util.vect.sub(this.position, ball);
    let v_magsq = util.vect.magsq(v);

    if (v_magsq < Math.pow(this.shieldRadius + ball.radius, 2) + 1) {
        ball.velocity = util.vect.reflect(ball.velocity, v);
        return true;
    }

    if (v_magsq < Math.pow(this.radius + ball.radius, 2) + 1) {
        ball.velocity = util.vect.reflect(ball.velocity, v);
        this.health -= this.health < this.damageRate ? this.health :
                                                       this.damageRate;
        return true;
    }

    return false;
};

Player.prototype.redrawNode = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 1,
            this.startAngle, this.endAngle, false);
    ctx.fillStyle = config.bgStyle;
    ctx.fill();
    ctx.arc(this.x, this.y, this.radius,
            this.startAngle, this.endAngle, false);
    ctx.strokeStyle = config.boundStyle;
    ctx.lineWidth = config.boundWidth;
    ctx.stroke();
    ctx.arc(this.x, this.y, this.radius * this.health,
            this.startAngle, this.endAngle, false);
    ctx.fillStyle = config.nodeStyle;
    ctx.fill();
    ctx.closePath();
};

Player.prototype.redrawShield = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.shieldRadius,
            this.shieldStartAngle + 0.02, this.shieldEndAngle + 0.02, false);
    ctx.strokeStyle = config.bgStyle;
    ctx.lineWidth = config.shieldWidth + 1;
    ctx.stroke();
    ctx.arc(this.x, this.y, this.shieldRadius,
            this.shieldStartAngle, this.shieldEndAngle, false);
    ctx.strokeStyle = config.bgStyle;
    ctx.lineWidth = config.shieldWidth;
    ctx.stroke();
    ctx.closePath();
};


function BoundPoint(x, y, nextPoint) {
    this.position = { x: x, y: y };
    this.nextPoint = nextPoint instanceof BoundPoint ? nextPoint : null;
    this.normal = null;

    if (nextPoint) {
        this.normal = util.vect.cw90deg(
                        util.vect.norm(
                            util.vect.sub(this.nextPoint.position,
                                          this.position)));
    }
}
    
BoundPoint.prototype.collisionHandler = function (ball) {
    let v = util.vect.sub(this.position, ball);
    let distSq = Math.abs(util.vect.dot(v, this.normal));

    if (distSq < Math.pow(ball.radius, 2) + 1) {
        ball.velocity = util.vect.reflect(ball.velocity, this.normal);
        return true;
    }

    return false;
};

BoundPoint.prototype.redraw = function (ctx) {
    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.nextPoint.x, this.nextPoint.position.y);
    ctx.strokeStyle = config.bgStyle;
    ctx.lineWidth = config.boundWidth + 1;
    ctx.stroke();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.nextPoint.x, this.nextPoint.position.y);
    ctx.strokeStyle = config.boundStyle;
    ctx.lineWidth = config.boundWidth;
    ctx.stroke();
    ctx.closePath();
};

var util = {
    vect: {
        norm: function (
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
