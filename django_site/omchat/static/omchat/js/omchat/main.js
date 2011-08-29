
goog.provide('omchat.main');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('cBackbone.models.EventType');
goog.require('omchat.conf');
goog.require('omchat.comet');
goog.require('omchat.models');
goog.require('omchat.view');
goog.require('omchat.templates');

/**
 * Main entrance for omchat
 */
omchat.main = function() {
    var chatCollection = new omchat.models.ChatCollection();

    var scrollDown = goog.partial(omchat.view.scrollDown,
            goog.dom.getElement('chat-list'));

    var chatDom = goog.dom.getElementsByTagNameAndClass('ul',
            null, goog.dom.getElement('chat-list'))[0];

    goog.events.listen(chatCollection, cBackbone.models.EventType.RESET,
        function(e) {
            /** @type {omchat.models.ChatCollection} */
            var collection = e.target;
            omchat.view.renderChatCollection(chatDom, collection);
            scrollDown();
        });

    goog.events.listen(chatCollection, cBackbone.models.EventType.ADD,
        function(e) {
            /** @type {omchat.models.Chat} */
            var model = e.target;
            omchat.view.renderChatModel(chatDom, model);
            scrollDown();
        });

    chatCollection.reset(chatCollection.parse(omchat_initdata));
    window.cc = chatCollection;

};

goog.exportSymbol('omchat.main', omchat.main);

