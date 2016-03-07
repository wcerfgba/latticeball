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
