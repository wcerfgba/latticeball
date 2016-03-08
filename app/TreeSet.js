"use strict";

/**
 * Limited tree set functionality build on an Array. {@link TreeSet#add} will 
 * maintain the Array as an ordered list and insert an item only if it is 
 * unique. The Array can then be iterated as normal.
 */
function TreeSet() { }
TreeSet.prototype = Object.create(Array.prototype);

/**
 * Adds an element to the array only if it is unique. Assumes the array is 
 * sorted and performs a binary search.
 */
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

    if (this[start] !== o) {
        this.splice(start, 0, o);
    }
};


exports = module.exports = TreeSet;
