"use strict";

var elements = require("elements");


/**
 * These functions construct, bind, and return listeners.
 */
exports = module.exports = {
   
    /**
     * Manages displaying game type specific settings when game type changes.
     */ 
    gameType: function () {
        var listener = function (e) {
            switch (elements.gameTypeSelect
                            .options[elements.gameTypeSelect
                                             .selectedIndex].value) {
                case "polygon":
                    elements.optsDiv.innerHTML = "";
                    elements.optsDiv.appendChild(elements.polygonSides);
                    break;
                case "lattice":
                    elements.optsDiv.innerHTML = "";
                    elements.optsDiv.appendChild(elements.latticeShape);
                    break;
            }

            elements.optsDiv.appendChild(elements.aiSpeed);
            elements.optsDiv.appendChild(elements.shieldSize);
            elements.optsDiv.appendChild(elements.nodeSize);
        };

        elements.gameTypeSelect.addEventListener("change", listener);
        return listener;
    },

    /**
     * Resize and redraw game when window is resized.
     */
    resize: function (game) {
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
    },

    /**
     * Keyboard controls for shield.
     */
    control: function (player) {
        var listener = function (e) {
            if (e.keyCode === 37) { // Left
                player.moveShield(-0.1);
            } else if (e.keyCode === 39) { // Right
                player.moveShield(0.1);
            }
        };

        window.addEventListener("keydown", listener);
        return listener;
    },
    
    /**
     * Esc key stops the game and shows the menu.
     */
    escKey: function (animFrameHolder, game, resizeListener, controlListener) {
        // Construct an anonymous function to return the listener so we can 
        // give it a reference to itself, so it can remove itself.
        var listener = function (listener) {
            return function (e) {
                if (e.keyCode === 27) {
                    cancelAnimationFrame(animFrameHolder.value);
                    elements.menuWrapper.style.display = "inline";
                    window.removeEventListener("keyup", listener);
                    window.removeEventListener("resize", resizeListener);
                    window.removeEventListener("keydown", controlListener);
                }
            };
        };

        window.addEventListener("keyup", listener(listener));
        return listener;
    }
};
