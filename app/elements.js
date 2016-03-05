var elements = {};


var ids = [ "menuWrapper", "gameTypeSelect", "optsDiv", "playSubmit",
            "canvas" ];

// Build getters for pre-defined elements. This permits loading this module 
// before the rest of the page.
for (var i = 0; i < ids.length; i++) {
    var id = ids[i];

    Object.defineProperty(elements, id, (function (id) {
        return {
            get: function () {
                return document.getElementById(id);
            }
        };
    })(id));
}


var definitions = [
    [ "input", { id: "polygonSides", type: "number", min: "2", value: "6" },
      "Sides" ],
    [ "select", { id: "latticeShape", options: [ [ "hex", "Hexagonal" ],
                                                 [ "square", "Square" ] ] },
      "Lattice shape" ],
    [ "input", { id: "aiSpeed", type: "range", min: "0.1", max: "1", 
                 step: "0.1", value: "0.4" },
      "AI speed" ],
    [ "input", { id: "shieldSize", type: "range", min: "0.05", max: "0.25",
                 step: "0.01", value: "0.1" },
      "Shield size" ],
    [ "input", { id: "nodeSize", type: "range", min: "10", max: "100",
                 step: "1", value: "50" },
      "Node size" ] 
];

// Generate defined elements.
for (var i = 0; i < definitions.length; i++) {
    var def = definitions[i];
    var id = def[1].id;
    var element = document.createElement(def[0]);

    switch (def[0]) {
        case "input":
            for (var p in def[1]) {
                element.setAttribute(p, def[1][p]);
            }
            break;
        case "select":
            element.setAttribute("id", def[1].id);
            for (var j = 0; j < def[1].options.length; j++) {
                var o = def[1].options[j];
                var opt = document.createElement("option");
                opt.value = o[0];
                opt.text = o[1];
                element.add(opt);
            }
            break;
    }

    var label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = def[2];

    var div = document.createElement("div");
    div.setAttribute("class", "opt");
    div.appendChild(label);
    div.appendChild(element);

    elements[id] = div;
}


exports = module.exports = elements;
