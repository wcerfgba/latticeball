var TAU = 2 * Math.PI;

exports = module.exports = {
    TAU: TAU,
    angle: {
        between: function (start, a, end) {
            start = start % TAU;
            a = a % TAU;
            end = end % TAU;

            if (start < end) {
                return (start < a && a < end);
            } else if (start < a) {
                return a < end + TAU;
            } else {
                return a < end;
            }
        }
    }
};
