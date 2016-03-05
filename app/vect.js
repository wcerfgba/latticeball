var comprops = require("comprops");
var util = require("util");

var TAU = util.TAU;

function V(x, y) {
    this.x = x;
    this.y = y;

    comprops(this);
}

V.comprops = {
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

    comprops(this);
}

L.comprops = {
    direction: function (l) {
        return l.b.sub(l.a);
    },
    normal: function (l) {
        return l.direction.norm.cw90deg;
    }
};


exports = module.exports = { V: V, L: L };
