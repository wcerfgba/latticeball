var elements = require("elements");

var SPPolygon = require("Game/SPPolygon");
var SPLattice = require("Game/SPLattice");


var defaults = { collisionCellSize: 20,
                 nodeRadius: 40,
                 shieldRadius: 45,
                 shieldHalfWidth: Math.PI / 24,
                 shieldStyle: "rgb(0, 0, 255)",
                 shieldDepth: 3,
                 bgStyle: "rgb(255, 255, 255)",
                 boundStyle: "rgb(0, 0, 0)",
                 boundWidth: 1,
                 nodeStyle: "rgb(0, 0, 0)",
                 playerStyle: "rgb(128, 0, 128)",
                 ballStyle: "rgb(255, 0, 0)",
                 ballRadius: 10,
                 spacing: 100 };


function buildGame(viewport) {
    var settings = {};
    var type = elements.gameTypeSelect
                       .options[elements.gameTypeSelect.selectedIndex].value;
    var constructor;

    // Build game settings.
    for (var p in defaults) {
        settings[p] = defaults[p];
    }

    switch (type) {
        case "polygon":
            settings.sides = parseInt(elements.polygonSides.lastChild.value);
            if (settings.sides === NaN || settings.sides < 3) {
                settings.sides = 6;
            }
            constructor = SPPolygon;
            break;
        case "lattice":
            var shape = elements.latticeShape.lastChild;
            settings.shape = shape.options[shape.selectedIndex].value;
            if (settings.shape !== "hex" &&
                settings.shape !== "square") {
                settings.shape = "hex";
            }
            constructor = SPLattice;
            break;
    }

    settings.aiSpeed = parseFloat(elements.aiSpeed.lastChild.value);
    settings.shieldHalfWidth = parseFloat(elements.shieldSize.lastChild.value);
    settings.nodeRadius = parseInt(elements.nodeSize.lastChild.value);

    // Instantiate and return game.
    return new constructor(viewport, settings);
};


exports = module.exports = buildGame;
