goog.provide('omchat.view');

goog.require('goog.dom');
goog.require('goog.array');
goog.require('omchat.templates');

/**
 * @param {Element} targetDom
 * @param {omchat.models.ChatCollection} collection
 */
omchat.view.renderChatCollection = function(targetDom, collection) {
    goog.array.forEach(collection.getModels(), goog.partial(
            omchat.view.renderChatModel, targetDom));
};

/**
 * @param {Element} targetDom
 * @param {omchat.models.Chat} model
 */
omchat.view.renderChatModel = function(targetDom, model) {
    var html = omchat.templates.chatItem(model.toJson());
    var newElem = goog.dom.createDom('li', {"innerHTML": html});
    targetDom.appendChild(newElem);
};

/**
 * Scroll down the list when new chat is rendered
 * @param {Element} targetDom
 */
omchat.view.scrollDown = function(targetDom) {
    targetDom.scrollTop = targetDom.scrollHeight;
};

