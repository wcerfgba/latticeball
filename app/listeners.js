var elements = require("elements");


exports = module.exports = {
    
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
    
    escKey: function (animFrameHolder, game, resizeListener, controlListener) {
        var listener = function (e) {
            if (e.keyCode === 27) {
                cancelAnimationFrame(animFrameHolder.value);
                game.stopAIs();
                elements.menuWrapper.style.display = "table";
                    // ???
                window.removeEventListener("keyup", listener);
                window.removeEventListener("resize", resizeListener);
                window.removeEventListener("keydown", controlListener);
            }
        };

        window.addEventListener("keyup", listener);
        return listener;
    }
};
