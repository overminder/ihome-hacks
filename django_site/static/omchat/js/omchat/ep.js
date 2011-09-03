goog.provide('omchat.ep');
goog.provide('omchat.ep.EntryPoint');

goog.require('goog.dom');
goog.require('goog.json');
goog.require('omchat.comet');
goog.require('omchat.models');
goog.require('omchat.route');
goog.require('omchat.ui');

/**
 * @constructor
 */
omchat.ep.EntryPoint = function() {
    /**
     * Handle model resources.
     * @type {omchat.models.ChatCollection}
     * @private
     */
    this.chatCollection_ = new omchat.models.ChatCollection();

    /**
     * @type {Element}
     * @private
     */
    this.chatDom_ = goog.dom.getElement('chats');

    /**
     * @type {omchat.ui.Chatlist}
     * @private
     */
    this.chatContainer_ = new omchat.ui.Chatlist(this.chatCollection_);

    /**
     * @type {omchat.ui.Mouth}
     * @private
     */
    this.mouth_ = new omchat.ui.Mouth({
        collection: this.chatCollection_,
        selfEditStatus: omchat.models.MouthStatus.State.NOT_EDITING,
        currentEditingUser: null
    });

    /**
     * @type {Element}
     * @private
     */
    this.mouthElement_ = goog.dom.getElement('mouth');

    /**
     * @type {omchat.comet.Channel}
     * @private
     */
    this.channel_ = new omchat.comet.Channel(omchat_cid);
};
goog.addSingletonGetter(omchat.ep.EntryPoint);

/**
 * bind channel's onMessage
 * @protected
 */
omchat.ep.EntryPoint.prototype.setupChannel = function() {
    var chatCollection = this.chatCollection_;
    this.channel_.onMessage = function(msg) {
        var action = msg['action'];
        if (action == 'chat:created') {
            var obj = goog.json.parse(msg['data']);
            chatCollection.add(new omchat.models.Chat(obj));
        }
        else if (action == 'chat:editing') {
            var author = msg['data'];
        }
    };
    this.channel_.connect();
};

/**
 * TODO: make it more comprehensive.
 * @protected
 */
omchat.ep.EntryPoint.prototype.setupRouting = function() {
    omchat.route.register('!/author/:name', goog.bind(function(name) {
        this.chatContainer_.getModel().setSelectedAuthor(name);
    }, this));

    omchat.route.register('!/', goog.bind(function() {
        this.chatContainer_.getModel().setSelectedAuthor(null);
    }, this));

    omchat.route.start();
    omchat.route.setDefaultRoute('!/');
};

/**
 * Main entry for omchat
 */
omchat.ep.EntryPoint.main = function() {
    var ep = omchat.ep.EntryPoint.getInstance();

    window['entrypoint'] = ep;

    // If the data is not fetched yet, fire the reset event. UI elements are
    // required to listen to this in order to start rendering.
    // But since the data here is already available...
    ep.chatCollection_.reset(ep.chatCollection_.parse(omchat_initdata));

    // Render chat items
    ep.chatContainer_.render(ep.chatDom_);

    // make formset usable
    ep.mouth_.decorate(ep.mouthElement_);

    // History support
    ep.setupRouting();
    
    // Comet support
    ep.setupChannel();
};

goog.exportSymbol('omchat.ep.EntryPoint.main', omchat.ep.EntryPoint.main);

