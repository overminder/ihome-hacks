
goog.provide('omchat.main');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('omchat.conf');
goog.require('omchat.comet');
goog.require('omchat.models');
goog.require('omchat.view');
goog.require('omchat.templates');

/**
 * Main entrance for omchat
 */
omchat.main = function() {
    var chat_collection = new omchat.models.ChatCollection();
    chat_collection.reset(chat_collection.parse(omchat_initdata));

    var chat_dom = goog.dom.getElementsByTagNameAndClass('ul',
            null, goog.dom.getElement('chat-list'))[0];

    goog.array.forEach(chat_collection.toJson(), function(chat) {
        var html = omchat.templates.chat_item(chat);
        var new_elem = goog.dom.createDom('li', {
            "innerHTML": html
        });
        chat_dom.appendChild(new_elem);
    });

    /**
     * @param {goog.events.Event} e
     */
    var event_handler = function(e) {
        var model_affected = /** @type {omchat.models.Chat} */ (e.target);
        console.log(e);
    };

    //chat_collection.create('TestAuthor', 'TestContent');
    window.cc = chat_collection;
};

goog.exportSymbol('omchat.main', omchat.main);

