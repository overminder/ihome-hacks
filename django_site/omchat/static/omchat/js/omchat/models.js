goog.provide('omchat.models');

goog.require('goog.events');
goog.require('goog.date.UtcDateTime');
goog.require('cBackbone.vendors.tastypie');

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
    var pub_time = this.get("pub_time");
    if (pub_time) {
        this.set({
            "pub_time": goog.date.UtcDateTime.fromIsoString(pub_time)
        }, {"silent": true});
    }
};

/**
 * @inheritDoc
 * @override
 */
omchat.models.Chat.prototype.toJson = function() {
    var json = goog.base(this, "toJson");
    var pub_time = json["pub_time"];
    if (pub_time)
        json["pub_time"] = pub_time.toUTCIsoString(true, true);
    return json;
};

/**
 * @inheritDoc
 * @constructor
 * @extends {cBackbone.models.Collection}
 */
omchat.models.ChatCollection = function(models, opt) {
    goog.base(this, models, opt);
};
goog.inherits(omchat.models.ChatCollection,
        cBackbone.vendors.tastypie.Collection);

/**
 * Sort by publish time in ascending order.
 * @inheritDoc
 * @override
 */
omchat.models.ChatCollection.prototype.comparator_ = function(a, b) {
    aTime = a.get('pub_time');
    bTime = b.get('pub_time');
    return aTime > bTime ? 1 : aTime < bTime ? -1 : 0;
};

/**
 * @inheritDoc
 * @override
 */
omchat.models.ChatCollection.prototype.model_ = omchat.models.Chat;

/**
 * @inheritDoc
 * @override
 */
omchat.models.ChatCollection.prototype.getUrl = function() {
    return '/omchat/api/v1/chat/';
};


