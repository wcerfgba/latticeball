function comprops(o) {
    o.compropCache = {};

    for (var f in o.constructor.comprops) {
        Object.defineProperty(o, f,
            (function (comprop) {
                return {
                    get: function () {
                        if (!(comprop in this.compropCache)) {
                            this.compropCache[comprop] =
                                this.constructor.comprops[comprop](this);
                        }

                        return this.compropCache[comprop];
                    }
                };
            })(f)
        );
    }

    return o;
}


exports = module.exports = comprops;
