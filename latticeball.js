// Config
var FPS = 30;
var NODES = 6;
var NODE_RADIUS = 50;
var BALL_RADIUS = 10;
var SHIELD_RADIUS = NODE_RADIUS + 10;
var SHIELD_WIDTH = Math.PI / 12;
var CLEAR_COLOUR = "rgb(255, 255, 255)";
var LATTICE_COLOUR = "rgb(0, 0, 0)";
var BALL_COLOUR = "rgb(255, 0, 0)";
var SHIELD_COLOUR = "rgb(0, 0, 255)";
var SHIELD_THICKNESS = 3;
var SHIELD_MAXVEL = Math.PI / 8;

// State
var canvas_ball;
var ctx_ball;
var canvas_bg;
var ctx_bg;
var center;
var radius;
var nodes = new Array(NODES);
var normals = new Array(NODES);
var ball;
var ball_vel;
var elapsed, before;
var shields = new Array(NODES);

window.onload = function () {
    canvas_ball = document.getElementById("ball");
    ctx_ball = canvas_ball.getContext("2d");
    canvas_bg = document.getElementById("bg");
    ctx_bg = canvas_bg.getContext("2d");

    
    canvas_ball.width = window.innerWidth;
    canvas_ball.height = window.innerHeight;
    canvas_bg.width = window.innerWidth;
    canvas_bg.height = window.innerHeight;

    center = { x: Math.floor(canvas_bg.width / 2),
               y: Math.floor(canvas_bg.height / 2) };
    radius = Math.floor((Math.min(canvas_bg.width, canvas_bg.height) / 2) - 20);

    calcLattice();
    drawLattice();

    ball = { x: center.x, y: center.y };
    ball_vel = { x: 200 * (Math.random() - 0.5),
                 y: 200 * (Math.random() - 0.5) };

    for (var i = 0; i < shields.length; i++) {
        shields[i] = Math.PI / NODES;
    }


    before = performance.now();

    requestAnimationFrame(render);
};

function render(time) {
    elapsed = time - before;

    drawBall();
    drawShields();

    before = time;
    requestAnimationFrame(render);
}

function calcLattice() {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i] = { x: Math.floor(
                         (Math.cos(2 * Math.PI * (i / NODES)) * radius)
                         + center.x),
                     y: Math.floor(
                         (Math.sin(2 * Math.PI * (i / NODES)) * radius)
                         + center.y) };
    }

    for (var i = 0; i < normals.length; i++) {
        var edge = { x: nodes[(i + 1) % nodes.length].x - nodes[i].x,
                     y: nodes[(i + 1) % nodes.length].y - nodes[i].y };
        edge = norm(edge);
        normals[i] = { x: -edge.y, y: edge.x };
        console.log(normals[i]);
    }
}

function drawLattice() {
    drawBounds();
    drawNodes();
}

function drawNodes() {
    ctx_bg.fillStyle = LATTICE_COLOUR;

    for (var i = 0; i < nodes.length; i++) {
        ctx_bg.beginPath();
        ctx_bg.arc(nodes[i].x, nodes[i].y, NODE_RADIUS, 0, 2 * Math.PI, false);
        ctx_bg.fill();
        ctx_bg.closePath();
    }
}

function drawBounds() {
    ctx_bg.strokeStyle = LATTICE_COLOUR;
    ctx_bg.lineWidth = 1;
    
    ctx_bg.beginPath();
    ctx_bg.moveTo(nodes[nodes.length - 1].x, nodes[nodes.length - 1].y);
    for (var i = 0; i < nodes.length; i++) {
        ctx_bg.lineTo(nodes[i].x, nodes[i].y);
    }
    ctx_bg.stroke(); 
    ctx_bg.closePath();
}

function calcBall() {
    var normal;

    for (var i = 0; i < normals.length; i++) {
        var node_vector = { x: ball.x - nodes[i].x, y: ball.y - nodes[i].y };
        var angle = Math.acos(dot(ccw90deg(normals[i]), norm(node_vector)));
        
        if (shields[i] - SHIELD_WIDTH <= angle && 
            angle <= shields[i] + SHIELD_WIDTH &&
            magsq(node_vector) <=
                Math.pow(BALL_RADIUS + SHIELD_RADIUS + SHIELD_WIDTH, 2)) {
            normal = norm(node_vector);
            break;
        }

        if (magsq(node_vector) <= Math.pow(BALL_RADIUS + NODE_RADIUS, 2)) {
            normal = norm(node_vector);
            break;
        }

        var bound_dist = (node_vector.x * normals[i].x) +
                         (node_vector.y * normals[i].y);        

        if (bound_dist <= BALL_RADIUS) {
            normal = normals[i];
            break;
        }
    }

    if (normal) {
        var vel_normal = (ball_vel.x * normal.x) + (ball_vel.y * normal.y);

        if (vel_normal < 0) {
            var perp = { x: -normal.y, y: normal.x };
            var vel_perp = (ball_vel.x * perp.x) + (ball_vel.y * perp.y);

            ball_vel = { x: (-vel_normal * normal.x) + (vel_perp * perp.x),
                         y: (-vel_normal * normal.y) + (vel_perp * perp.y) };
        }
    }

    ball = { x: ball.x + ((elapsed / 1000) * ball_vel.x),
             y: ball.y + ((elapsed / 1000) * ball_vel.y) };
}

function drawBall() {
    calcBall();
    
    ctx_ball.globalCompositeOperation = "copy";
    ctx_ball.fillStyle = BALL_COLOUR;
    ctx_ball.beginPath();
    ctx_ball.arc(ball.x, ball.y, BALL_RADIUS, 0, 2 * Math.PI, false);
    ctx_ball.fill();
    ctx_ball.closePath();
}

function calcShields() {
    for (var i = 0; i < shields.length; i++) {
        var ball_vec = { x: ball.x - nodes[i].x, y: ball.y - nodes[i].y };
        ball_vec = norm(ball_vec);
        var angle = Math.acos(dot(ccw90deg(normals[i]), ball_vec));
        
        if (angle < SHIELD_WIDTH + 0.04) {
            angle = SHIELD_WIDTH + 0.04;
        } else if ((2 * Math.PI / 3) - (SHIELD_WIDTH + 0.04) < angle) {
            angle = (2 * Math.PI / 3) - (SHIELD_WIDTH + 0.04);
        }

        var angle_diff = angle - shields[i]; 
        var angle_vel = Math.abs(angle_diff) / (elapsed / 1000);

        if (angle_vel > SHIELD_MAXVEL) {
            angle_diff = Math.sign(angle_diff) * 
                            (SHIELD_MAXVEL * (elapsed / 1000));
        }

        shields[i] += angle_diff;
    }
}

function drawShields() {
    ctx_bg.lineWidth = SHIELD_THICKNESS + 1;
    ctx_bg.strokeStyle = CLEAR_COLOUR;
    for (var i = 0; i < shields.length; i++) {
        var angle = (Math.sign(0.01 - normals[i].x) * Math.acos(normals[i].y)) +
                    shields[i];

        ctx_bg.beginPath();
        ctx_bg.arc(nodes[i].x, nodes[i].y, SHIELD_RADIUS,
                   angle - (SHIELD_WIDTH + 0.02), angle + (SHIELD_WIDTH + 0.02),
                   false);
        ctx_bg.stroke();
        ctx_bg.closePath();
    }

    calcShields();

    ctx_bg.lineWidth = SHIELD_THICKNESS;
    ctx_bg.strokeStyle = SHIELD_COLOUR;
    for (var i = 0; i < shields.length; i++) {
        var angle = (Math.sign(0.01 - normals[i].x) * Math.acos(normals[i].y)) +
                    shields[i];

        ctx_bg.beginPath();
        ctx_bg.arc(nodes[i].x, nodes[i].y, SHIELD_RADIUS,
                   angle - SHIELD_WIDTH, angle + SHIELD_WIDTH, false);
        ctx_bg.stroke();
        ctx_bg.closePath();
    }
}

function dot(v1, v2) {
    return (v1.x * v2.x) + (v1.y * v2.y);
}

function cw90deg(vect) {
    return { x: -vect.y, y: vect.x };
}

function ccw90deg(vect) {
    return { x: vect.y, y: -vect.x };
}

function norm(vect) {
    var mag = Math.sqrt(magsq(vect));
    return { x: vect.x / mag, y: vect.y / mag };
}

function magsq(vect) {
    return Math.pow(vect.x, 2) + Math.pow(vect.y, 2);
}
