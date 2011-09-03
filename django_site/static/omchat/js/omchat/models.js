goog.provide('omchat.models');
goog.provide('omchat.models.ChatCollection.EventType');
goog.provide('omchat.models.MouthStatus.State');

goog.require('goog.array');
goog.require('goog.date');
goog.require('goog.date.UtcDateTime');
goog.require('goog.events');
goog.require('goog.functions');
goog.require('cBackbone.vendors.tastypie');
goog.require('omchat.conf');

// Install the tastypie plugin.
cBackbone.vendors.tastypie.install();


/**
 * @inheritDoc
 * @constructor
 * @extends {cBackbone.vendors.tastypie.Model}
 */
omchat.models.Chat = function(attr, opt) {
    goog.base(this, attr, opt);
};
goog.inherits(omchat.models.Chat, cBackbone.vendors.tastypie.Model);

/**
 * Parse the `pub_time` field to goog.date.UtcDateTime
 * @inheritDoc
 * @override
 */
omchat.models.Chat.prototype.initializeInternal = function(attr, opt) {
    var pub_time = this.get('pub_time');
    if (pub_time) {
        this.set({
            'pub_time': goog.date.UtcDateTime.fromIsoString(pub_time)
        }, {'silent': true});
    }
};

/**
 * @inheritDoc
 * @override
 */
omchat.models.Chat.prototype.toJson = function() {
    var json = goog.base(this, 'toJson');
    var pub_time = json['pub_time'];
    if (pub_time)
        json['pub_time'] = pub_time.toUTCIsoString(true, true);
    return json;
};

/**
 * Format the pub_time.
 * @return {string} The formatted human-readable repr of pub_time
 */
omchat.models.Chat.prototype.getHumanReadablePubTime = function() {
    var pubTime = this.get('pub_time').getTime() / 1000;
    var now = goog.now() / 1000;
    var secDiff = parseInt(now - pubTime);

    var table = [
        [7 * 24 * 60 * 60, 'week'],
        [24 * 60 * 60, 'day'],
        [60 * 60, 'hour'],
        [60, 'minute'],
        [1, 'second']
    ];

    var formatList = [];

    // Build the format list.
    goog.array.forEach(table, function(formatTuple) {
        var seconds = formatTuple[0];
        var name = formatTuple[1];
        var formatted = null;

        if (seconds < secDiff) {
            var howMany = Math.floor(secDiff / seconds);
            secDiff -= howMany * seconds;
            formatted = howMany + ' ' + name + (howMany == 1 ? '' : 's');
        }
        formatList.push(formatted);
    });

    var returnValue = null;
    // Slide a 2-tuple window to filter out the return value.
    for (var i = 0; i < formatList.length; ++i) {
        var first = formatList[i];
        var second = formatList[i + 1];
        if (first && second) {
            returnValue = first + ' ' + second;
            break;
        }
        else if (first) {
            returnValue = first;
            break;
        }
    }

    return returnValue ? returnValue + ' ago' : 'just now';
};

/**
 * @inheritDoc
 * @constructor
 * @extends {cBackbone.models.Collection}
 */
omchat.models.ChatCollection = function(models, opt) {
    goog.base(this, models, opt);

    /**
     * @type {string?}
     * @private
     */
    this.selectedAuthor_ = null;
};
goog.inherits(omchat.models.ChatCollection,
        cBackbone.vendors.tastypie.Collection);

/** @return {string?} */
omchat.models.ChatCollection.prototype.getSelectedAuthor = function() {
    return this.selectedAuthor_;
};

/** @param {string?} name The selected author's name. */
omchat.models.ChatCollection.prototype.setSelectedAuthor = function(name) {
    this.selectedAuthor_ = name;
    this.dispatchEvent(
            omchat.models.ChatCollection.EventType.SELECTED_AUTHOR_CHANGED);
};

/** @return {boolean} */
omchat.models.ChatCollection.prototype.hasSelectedAuthor = function() {
    return !goog.isNull(this.getSelectedAuthor());
};

/**
 * Sort by publish time in ascending order.
 * @inheritDoc
 * @override
 */
omchat.models.ChatCollection.prototype.comparator = function(a, b) {
    aTime = a.get('pub_time').getTime();
    bTime = b.get('pub_time').getTime();
    return aTime > bTime ? 1 : aTime < bTime ? -1 : 0;
};

/**
 * @inheritDoc
 * @override
 */
omchat.models.ChatCollection.prototype.model = omchat.models.Chat;

/**
 * @inheritDoc
 * @override
 */
omchat.models.ChatCollection.prototype.getUrl = function() {
    return omchat.conf.scriptPrefix + '/omchat/api/v1/chat/';
};


/** @enum {string} */
omchat.models.ChatCollection.EventType = {
    SELECTED_AUTHOR_CHANGED: goog.events.getUniqueId('selected-author-changed')
};

/**
 * XXX: Should not be goog.provide'd or the compiler will generate wrong code.
 * @typedef {{collection:omchat.models.ChatCollection, selfEditStatus:string,
 *            currentEditingUser:string?}}
 */
omchat.models.MouthStatus;

omchat.models.MouthStatus.State = {
    EDITING: goog.events.getUniqueId('editing'),
    NOT_EDITING: goog.events.getUniqueId('not-editing')
};

