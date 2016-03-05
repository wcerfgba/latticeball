function TreeSet() { }
TreeSet.prototype = Object.create(Array.prototype);

TreeSet.prototype.add = function (o) {
    var start = 0;
    var end = this.length;
    
    while (start < end) {
        var i = Math.floor((start + end) / 2);

        if (o <= this[i]) {
            end = i;
        } else {
            start = i + 1;
        }
    }

    if (this[start] != o) {
        this.splice(start, 0, o);
    }
};


exports = module.exports = TreeSet;
