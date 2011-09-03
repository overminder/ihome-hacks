goog.provide('omchat.route');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.History');
goog.require('goog.History.Event');
goog.require('goog.History.EventType');

/*
 * Generally speaking this is copied from Backbone.js
 */

/** @type {goog.History} */
omchat.route.history = null;

/**
 * Call to start the history
 */
omchat.route.start = function() {
    if (!omchat.route.history) {
        omchat.route.history = new goog.History();
        omchat.route.history.setEnabled(true);
        goog.events.listen(omchat.route.history,
                goog.History.EventType.NAVIGATE,
                omchat.route.onTokenChangeInternal);

        var routeInfo = omchat.route.dispatchToken();
        if (routeInfo)
            routeInfo.func.apply(null, routeInfo.args);
    }
};

/**
 * @param {string} fragment
 */
omchat.route.setDefaultRoute = function(fragment) {
    if (!omchat.route.history.getToken())
        omchat.route.history.replaceToken(fragment);
};

/**
 * @type {Array.<Object>}
 * @private
 */
omchat.route.routeMap_ = [];

/**
 * @const {RegExp}
 * @private
 */
omchat.route.namedParam_ = /:([\w\d]+)/g;

/**
 * @const {RegExp}
 * @private
 */
omchat.route.splatParam_ = /\*([\w\d]+)/g;

/**
 * @const {RegExp}
 * @private
 */
omchat.route.escapeRegExp_ = /[-[\]{}()+?.,\\^$|#\s]/g;

/**
 * @param {string} fragment The `url` fragment.
 * @param {Function} func The function to call when match.
 */
omchat.route.register = function(fragment, func) {
    var pattern = fragment.replace(omchat.route.escapeRegExp_, '\\$&')
                          .replace(omchat.route.namedParam_, '([^\/]*)')
                          .replace(omchat.route.splatParam_, '(.*?)');
    omchat.route.routeMap_.push({
        fragment: fragment,
        pattern: new RegExp('^' + pattern + '$'),
        func: func
    });
};

/**
 * @param {goog.events.Event} e The event triggered.
 * @protected
 */
omchat.route.onTokenChangeInternal = function(e) {
    var routeInfo = omchat.route.dispatchToken();
    if (routeInfo)
        routeInfo.func.apply(null, routeInfo.args);
};

/**
 * @param {string=} token The current url fragment.
 * @return {Object} The function and the args for this url fragment.
 */
omchat.route.dispatchToken = function(token) {
    if (!token)
        token = omchat.route.history.getToken();

    for (var i = 0, len = omchat.route.routeMap_.length; i < len; ++i) {
        var route = omchat.route.routeMap_[i];
        var match = token.match(route.pattern);
        if (match) {
            return {
                func: route.func,
                args: goog.array.slice(match, 1)
            };
        }
    }
    return null;
};



