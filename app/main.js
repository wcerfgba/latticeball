"use strict";

var elements = require("elements");
var listeners = require("listeners");
var buildGame = require("buildGame");
var Viewport = require("Viewport");


/**
 * Sets up listeners and describes the main loop.
 */
function run () {
    var gameTypeListener = listeners.gameType();
    // Call now to add settings initially.
    gameTypeListener();
    
    elements.playSubmit.addEventListener("click", function (e) {
        // Wrap the animation frame request ID in an object so we can pass 
        // around a reference to it.

        var animFrameHolder = { value: null };
        var viewport = new Viewport(elements.canvas);
        var game = buildGame(viewport);

        var resizeListener = listeners.resize(game);
        var controlListener = listeners.control(game.player);
        listeners.escKey(animFrameHolder, game,
                         resizeListener, controlListener);

        var before = performance.now();

        game.redrawAll();

        // Main loop.        
        var animate = function (timestamp) {
            // Elapsed time.
            var time = timestamp - before;
            
            game.ball.clear();

            // Physics simulation sub-loop. This caps the time between test for
            // collisions so that the ball cannot glitch through surfaces if 
            // there has been a delay or lag in animating.
            while (time > 0) {
                var t = time > 10 ? 10 : time;

                game.detectCollision();

                game.ball.move(t);
                time -= t;
            }
           
            game.updateAIs();
            game.ball.redraw();
            game.redrawActive(); 
           
            // Test for game over, if not, repeat loop.
            var gameOverMsg = game.isGameFinished();
            if (gameOverMsg) {
                game.viewport.ctx.font = "48px sans";
                game.viewport.ctx.fillStyle = "rgb(127, 127, 127)";
                var metrics = game.viewport.ctx.measureText(gameOverMsg);
                game.viewport.ctx.fillText(
                            gameOverMsg,
                            (game.viewport.canvas.width - metrics.width) / 2,
                            (game.viewport.canvas.height + 48) / 2);
            } else { 
                before = timestamp;
                animFrameHolder.value = requestAnimationFrame(animate);
            }
        };
        
        elements.menuWrapper.style.display = "none";

        animFrameHolder.value = requestAnimationFrame(animate);
    });
}


exports = module.exports = function () {
    document.addEventListener("DOMContentLoaded", function (event) {
        run();
    });
};
