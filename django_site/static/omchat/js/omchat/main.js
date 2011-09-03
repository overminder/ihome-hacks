goog.provide('omchat.main');

goog.require('cBackbone.models.EventType');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.json');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.Textarea');
goog.require('omchat.comet');
goog.require('omchat.models');
goog.require('omchat.route');
goog.require('omchat.templates');
goog.require('omchat.view');

/**
 * Main entrance for omchat
 */
omchat.main = function() {
    var allComponentEvents = goog.object.getValues(goog.ui.Component.EventType);
    var allDomEvents = goog.object.getValues(goog.events.EventType);

    var usernameInput = new goog.ui.LabelInput('Name');
    usernameInput.decorate(goog.dom.getElementByClass('username',
            goog.dom.getElement('mouth')));

    var sayButton = new goog.ui.Button(null);
    sayButton.decorate(goog.dom.getElementByClass('say',
            goog.dom.getElement('mouth')));
    sayButton.setTooltip('Click to submit');
    sayButton.setEnabled(false);

    var sayInput = new goog.ui.Textarea(null);
    sayInput.decorate(goog.dom.getElementByClass('texts',
            goog.dom.getElement('mouth')));
    sayInput.setMinHeight(90);
    new goog.ui.LabelInput('Say something... (shift + enter to submit)'
            ).decorate(sayInput.getElement());

    var buttonEnabler = function(e) {
        if (sayInput.getValue())
            sayButton.setEnabled(true);
        else
            sayButton.setEnabled(false);
    };

    // Enable/disable the submit button according to the textarea
    goog.events.listen(sayInput.getElement(),
            [goog.events.EventType.KEYUP, goog.events.EventType.KEYDOWN],
            buttonEnabler);

    var submitChat = function(e) {
        var author = usernameInput.getValue();
        var content = sayInput.getValue();

        // Cannot submit empty value
        if (!goog.string.trim(content))
            return;

        new omchat.models.Chat({
            'author': author,
            'content': content
        }).save(null, {'url': chatCollection.getUrl()});

        sayInput.setValue('');
        sayButton.setEnabled(false);
    };

    // Submit the chat
    goog.events.listen(sayButton, goog.ui.Component.EventType.ACTION,
            submitChat);

    goog.events.listen(sayInput.getElement(),
        [goog.events.EventType.KEYUP, goog.events.EventType.KEYDOWN],
        function(e) {
            if (e.keyCode == 13 && e.shiftKey) {
                submitChat(e);
                e.preventDefault();
            }
        });

    // Handle model resources
    var chatCollection = new omchat.models.ChatCollection();

    var scrollDown = goog.partial(omchat.view.scrollDown,
            goog.dom.getElement('chat_list'));

    var chatDom = goog.dom.getElementsByTagNameAndClass('ul',
            null, goog.dom.getElement('chat_list'))[0];

    // Recent User displaying
    var recentUserDom = goog.dom.getElementByClass('list',
            goog.dom.getElement('onlines'));
    var renderRecentUserList = goog.partial(omchat.view.renderRecentUserList,
        recentUserDom, chatCollection);

    goog.events.listen(chatCollection, cBackbone.models.EventType.RESET,
        function(e) {
            /** @type {omchat.models.ChatCollection} */
            var collection = e.target;
            omchat.view.renderChatCollection(chatDom, collection);
            renderRecentUserList();
            scrollDown();
        });

    goog.events.listen(chatCollection, cBackbone.models.EventType.ADD,
        function(e) {
            /** @type {omchat.models.Chat} */
            var model = e.target;
            omchat.view.renderChatModel(chatDom, model);
            renderRecentUserList();
            scrollDown();
        });

    // Fire the reset event to start ui rendering.
    chatCollection.reset(chatCollection.parse(omchat_initdata));

    // Channel handling
    var channel = new omchat.comet.Channel(omchat_cid);
    channel.onMessage = function(msg) {
        var action = msg['action'];
        if (action == 'chat:created') {
            var obj = goog.json.parse(msg['data']);
            chatCollection.add(new omchat.models.Chat(obj));
        }
        else if (action == 'chat:editing') {
            var author = msg['data'];
        }
    };
    channel.connect();

    omchat.route.register('!/author/:name', function(name) {
        omchat.view.renderChatCollection(chatDom, chatCollection, name);
        scrollDown();
    });

    omchat.route.register('!/', function(name) {
        omchat.view.renderChatCollection(chatDom, chatCollection);
        scrollDown();
    });

    // Route handling
    omchat.route.start();
};

goog.exportSymbol('omchat.main', omchat.main);

