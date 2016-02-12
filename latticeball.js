// Config
var FPS = 30;
var NODES = 6;
var NODE_RADIUS = 50;
var BALL_RADIUS = 10;
var CLEAR_COLOUR = "rgba(0, 0, 0, 0)";
var LATTICE_COLOUR = "rgb(0, 0, 0)";
var BALL_COLOUR = "rgb(255, 0, 0)";

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

    before = performance.now();

    requestAnimationFrame(render);
};

function render(time) {
    elapsed = time - before;

    drawBall();

    before = time;
    requestAnimationFrame(render);
}

function calcLattice() {
    for (var i = 0; i < nodes.length; i++) {
        nodes[i] = { x: Math.floor(
                         (Math.sin(2 * Math.PI * (i / NODES)) * radius)
                         + center.x),
                     y: Math.floor(
                         (Math.cos(2 * Math.PI * (i / NODES)) * radius)
                         + center.y) };
    }

    for (var i = 0; i < normals.length; i++) {
        var edge = { x: nodes[(i + 1) % nodes.length].x - nodes[i].x,
                     y: nodes[(i + 1) % nodes.length].y - nodes[i].y };
        edge = norm(edge);
        normals[i] = { x: edge.y, y: -edge.x };
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
    ctx_bg.fillStyle = LATTICE_COLOUR;
    
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

function norm(vect) {
    var mag = Math.sqrt(magsq(vect));
    return { x: vect.x / mag, y: vect.y / mag };
}

function magsq(vect) {
    return Math.pow(vect.x, 2) + Math.pow(vect.y, 2);
}
