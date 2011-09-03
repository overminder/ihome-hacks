goog.provide('omchat.comet');

goog.require('goog.async.Deferred');
goog.require('goog.dom');
goog.require('goog.events.EventTarget');
goog.require('goog.json');
goog.require('goog.net.Jsonp');
goog.require('omchat.conf');


/**
 * @param {string} cid The channel id.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
omchat.comet.Channel = function(cid) {
    /**
     * The channel id, keep it as a secret.
     * @type {string}
     * @private
     */
    this.cid_ = cid;

    /**
     * The remote endpoint to bind with.
     * @type {string}
     * @private
     */
    this.endpoint_ = omchat.conf.cometServer + '/' + omchat.conf.appName +
        '/' + this.cid_ + '/once';

    /**
     * Whether we have established a connection with the server or not.
     * @type {boolean}
     * @private
     */
    this.connected_ = false;
};
goog.inherits(omchat.comet.Channel, goog.events.EventTarget);

/**
 * Connect to the endpoint.
 */
omchat.comet.Channel.prototype.connect = function() {
    if (this.connected_)
        throw new Error('Connection already established');
    this.connected_ = true;

    // In order to avoid displaying some annoying spinning animation,
    // issue jsonp request in the next eventloop.
    // But it seems that firefox want document to be loaded first...
    // So we need some kind of jQuery's $.ready checker.
    var fetchFunc = goog.bind(this.fetchOnceInternal, this);
    var pollingFunc = function() {
        if (document.body && document.readyState === 'complete') {
            fetchFunc();
        }
        else {
            setTimeout(pollingFunc, 100);
        }
    };
    pollingFunc();
};

/**
 * @param {*} message The message received from server.
 * @protected
 */
omchat.comet.Channel.prototype.onMessage = goog.nullFunction;

/**
 * @param {*} error The error received from server.
 * @protected
 */
omchat.comet.Channel.prototype.onError = goog.nullFunction;

/**
 * @protected
 */
omchat.comet.Channel.prototype.onTimeout = goog.nullFunction;

/**
 * @param {string} resp The response data.
 * @protected
 */
omchat.comet.Channel.prototype.handleResponseInternal = function(resp) {
    if (resp['errors']) {
        var errors = resp['errors'];
        if (errors['__all__'] &&
            errors['__all__'][0] == 'ChannelTimeout') {
            // server-side timeout, go ahead.
            this.fetchOnceInternal();
        }
        else {
            // errors that we cannot handle.
            this.onError(errors);
        }
    }
    else {
        // got message, fetch again.
        this.onMessage(resp['msg']);
        this.fetchOnceInternal();
    }
};

/**
 * @protected
 */
omchat.comet.Channel.prototype.handleTimeoutInternal = function() {
    this.onTimeout();
};


/**
 * The default implementation is to use Jsonp to ensure cross-domainess.
 * @protected
 */
omchat.comet.Channel.prototype.fetchOnceInternal = function() {
    var self = this;

    var jsonp = new goog.net.Jsonp(this.endpoint_);

    // In the default implementation, server-side timeout is 60 seconds
    // so we set client-side timeout to 65 seconds which is safe.
    jsonp.setRequestTimeout(65 * 1000);

    jsonp.send(null, goog.bind(this.handleResponseInternal, this),
            goog.bind(this.handleTimeoutInternal, this));
};

/**
 * Privides interface to handle duplex messages.
 * @constructor
 * @extends {omchat.comet.Channel}
 */
omchat.comet.MultiplexChannel = function(cid) {
    goog.base(this, cid);
};
goog.inherits(omchat.comet.MultiplexChannel, omchat.comet.Channel);

/**
 * @inheritDoc
 * @override
 */
omchat.comet.Channel.prototype.onMessage = function(msg) {
    var action = msg['action'];
    this.dispatchEvent({
        type: action,
        messageBody: msg['data']
    });
};

