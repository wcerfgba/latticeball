"use strict";

/**
 * Cached computed properies. This function decorates a prototype with 
 * additional methods derived from those passed in an object as its second 
 * argument. Each key in the second argument is used as the name of a getter 
 * which is added to the prototype. If the getter is called and the property 
 * has not been computed, the corresponding function (value for said key) is 
 * used to compute it, and the value is cached in `object.compropCache`.
 *
 * Note that this implementation is only suitable for immutable types: changing 
 * a dependent property of a comprop will not trigger its recomputation. If 
 * your objects are being mutated, make sure you always remove the 
 * `compropCache` or any relevant entries, which can be done by adding a setter 
 * for any dependent properties.
 *
 * For examples see {@link V} and {@link L} in vect.js.
 */
function comprops(proto, comprops) {
    for (var key in comprops) {
        Object.defineProperty(proto, key,
            (function (key, func) {
                return {
                    get: function () {
                        if (! ("compropCache" in this)) {
                            this["compropCache"] = {};
                        }

                        if (! (key in this.compropCache)) {
                            this.compropCache[key] = func(this);
                        }
                        
                        return this.compropCache[key];
                    }
                };
            })(key, comprops[key])
        );
    }
}


exports = module.exports = comprops;
