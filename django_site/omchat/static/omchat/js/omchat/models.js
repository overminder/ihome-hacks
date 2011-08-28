goog.provide('omchat.models');

goog.require('goog.events');
goog.require('cBackbone.models');


/**
 * @inheritDoc
 * @constructor
 * @extends {cBackbone.models.Model}
 */
omchat.models.Chat = function(attr, opt) {
    goog.base(this, attr, opt);
};
goog.inherits(omchat.models.Chat, cBackbone.models.Model);

/**
 * @inheritDoc
 */
omchat.models.Chat.prototype.getIdAttribute = function() {
    return "resource_uri";
};

/**
 * @inheritDoc
 */
omchat.models.Chat.prototype.getUrl = omchat.models.Chat.prototype.getId;


/**
 * @inheritDoc
 * @constructor
 * @extends {cBackbone.models.Collection}
 */
omchat.models.ChatCollection = function() {
    goog.base(this);
};
goog.inherits(omchat.models.ChatCollection, cBackbone.models.Collection);

/**
 * @inheritDoc
 */
omchat.models.ChatCollection.prototype.model_ = omchat.models.Chat;

/**
 * @inheritDoc
 */
omchat.models.ChatCollection.prototype.parse = function(data) {
    return data["objects"];
};

/**
 * @inheritDoc
 */
omchat.models.ChatCollection.prototype.getUrl = function() {
    return '/omchat/api/v1/chat/';
};


