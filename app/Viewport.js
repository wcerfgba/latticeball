function Viewport(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");

    this.bgStyle = "rgb(255, 255, 255)";

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


exports = module.exports = Viewport;
