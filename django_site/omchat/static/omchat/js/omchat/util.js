goog.provide('omchat.util');

goog.require('goog.array');
goog.require('goog.object');

/** 
 * Maps a string to a color and manages some colors.
 * @constructor
 */
omchat.util.ColorSelector = function() {
    /**
     * @type {Object}
     * @private
     */
    this.nameMap_ = [];

    /**
     * @type {Array.<string>}
     * @private
     */
    this.colorList_ = goog.array.clone(omchat.util.ColorSelector.COLORS_);
    goog.array.shuffle(this.colorList_);

    /**
     * @type {number}
     * @private
     */
    this.colorIndex_ = 0;
};

/**
 * @type {Object}
 * @private
 */
omchat.util.ColorSelector.COLORS_ = [
    '9C446D',
    'DE6B4F',
    '6B7556',
    '8BA674',
    'FF9851',
    '1E851E',
    '85721E'
];

/**
 * @param {string} name A identifier for this color.
 * @return {string} A color.
 */
omchat.util.ColorSelector.prototype.getColorByName = function(name) {
    var color = this.colorList_[this.nameMap_[name]];

    if (color)
        return color;

    var colorIndex = this.colorIndex_;
    color = this.colorList_[colorIndex];
    ++this.colorIndex_;

    if (color) {
        this.nameMap_[name] = colorIndex;
        return color;
    }

    // Rotating.
    this.colorIndex_ = 0;
    return this.getColorByName(name);
};

