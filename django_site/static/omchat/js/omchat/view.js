goog.provide('omchat.view');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.object');
goog.require('goog.string');
goog.require('omchat.templates');

/*
 * TODO: use goog.ui.* to build rich view
 */

/**
 * @param {Element} targetDom The dom to be inserted into.
 * @param {omchat.models.ChatCollection} collection Data.
 * @param {string} author Optional: the name of the author.
 */
omchat.view.renderChatCollection = function(targetDom, collection, author) {
    goog.dom.removeChildren(targetDom);

    var models = collection.getModels();
    if (author)
        models = goog.array.filter(models, function(model) {
            return model.get('author') == author;
        });
    goog.array.forEach(models, goog.partial(
            omchat.view.renderChatModel, targetDom));
};

/**
 * @param {Element} targetDom The dom to be inserted into.
 * @param {omchat.models.Chat} model The chat model to render.
 */
omchat.view.renderChatModel = function(targetDom, model) {
    var chat = model.toJson();
    chat['content'] = goog.string.newLineToBr(goog.string.htmlEscape(
            chat['content']), true);
    var html = omchat.templates.chatItem({
        chat: chat
    });
    var newElem = goog.dom.createDom('li', {'innerHTML': html});
    targetDom.appendChild(newElem);
};

/**
 * Render and sort by newest chat.
 * @param {Element} targetDom The dom to be inserted into.
 * @param {omchat.models.ChatCollection} collection The collection to render.
 */
omchat.view.renderRecentUserList = function(targetDom, collection) {
    goog.dom.removeChildren(targetDom);

    var chats = collection.getModels();
    var uniqueAuthorMap = {};
    goog.array.forEach(chats, function(chat) {
        var author = chat.get('author');
        if (author in uniqueAuthorMap) {
            var record = uniqueAuthorMap[author];
            record.count += 1;
            if (record.latestChat.get('pub_time') < chat.get('pub_time')) {
                record.latestChat = chat;
            }
        }
        else {
            uniqueAuthorMap[author] = {
                latestChat: chat,
                count: 1
            };
        }
    });

    var uniqueAuthorList = goog.object.getValues(uniqueAuthorMap);
    // Sort by descending `pub_time`
    goog.array.sort(uniqueAuthorList, function(a, b) {
        var aTime = a.latestChat.get('pub_time');
        var bTime = b.latestChat.get('pub_time');
        return aTime < bTime ? 1 : aTime > bTime ? -1 : 0;
    });

    goog.object.forEach(uniqueAuthorList,
            goog.partial(omchat.view.renderRecentUser, targetDom));
};

/**
 * @param {Element} targetDom The dom to be inserted into.
 * @param {Object} record Struct containing the author and its chat count.
 */
omchat.view.renderRecentUser = function(targetDom, record) {
    var html = omchat.templates.recentUser({
        author: record.latestChat.get('author'),
        numChats: record.count
    });
    var newElem = goog.dom.createDom('li', {'innerHTML': html});
    targetDom.appendChild(newElem);
};


/**
 * Scroll down the list when new chat is rendered
 * @param {Element} targetDom The dom to be inserted into.
 */
omchat.view.scrollDown = function(targetDom) {
    targetDom.scrollTop = targetDom.scrollHeight;
};

