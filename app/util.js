"use strict";

var TAU = 2 * Math.PI;

exports = module.exports = {
    TAU: TAU,
    angle: {
        /**
         * Tests if one angle lies between two others.
         */
        between: function (start, a, end) {
            // First, mod everything by tau so it is bounded.
            start = start % TAU;
            a = a % TAU;
            end = end % TAU;

            if (start < end) {
                // start < end, therefore no discontinuity, bounds apply as 
                // they are.
                return (start < a && a < end);
            } else if (start < a) {
                // end <= start and start < a, therefore end exceeded tau.
                return a < end + TAU;
            } else {
                // end <= start and a <= start, therefore a exceeded tau.
                return a < end;
            }
        }
    }
};
