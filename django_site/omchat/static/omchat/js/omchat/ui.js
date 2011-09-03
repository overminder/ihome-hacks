goog.provide('omchat.ui');
goog.provide('omchat.ui.Chatlist');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.string');
goog.require('goog.style');
goog.require('goog.Timer');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component');
goog.require('goog.ui.Container');
goog.require('goog.ui.ContainerRenderer');
goog.require('goog.ui.Control');
goog.require('goog.ui.ControlRenderer');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.Textarea');
goog.require('goog.ui.Tooltip');
goog.require('soy');
goog.require('omchat.models');
goog.require('omchat.templates');
goog.require('omchat.util');

/**
 * A singleton chat model renderer. Can only do createDom.
 * @constructor
 * @extends {goog.ui.ControlRenderer}
 */
omchat.ui.ChatlistItemRenderer = function() {
    goog.base(this);
};
goog.inherits(omchat.ui.ChatlistItemRenderer, goog.ui.ControlRenderer);
goog.addSingletonGetter(omchat.ui.ChatlistItemRenderer);

/** @type {string} */
omchat.ui.ChatlistItemRenderer.CSS_CLASS = 'omchat-chatlist-item';

/** @type {omchat.util.ColorSelector} */
omchat.ui.ChatlistItemRenderer.colorSelector = new omchat.util.ColorSelector();

/**
 * @inheritDoc
 * @override
 */
omchat.ui.ChatlistItemRenderer.prototype.getCssClass = function() {
    return omchat.ui.ChatlistItemRenderer.CSS_CLASS;
};

/**
 * Create an element for the given chatlistItem.
 * @param {omchat.ui.ChatlistItem} chatlistItem One chat item.
 * @return {Element}
 * @override
 */
omchat.ui.ChatlistItemRenderer.prototype.createDom = function(chatlistItem) {
    var el = goog.base(this, 'createDom', chatlistItem);
    // Violates visibility but it's unavoidable.
    chatlistItem.setElementInternal(el);

    // Some implicity here, such as .toJson()
    var model = chatlistItem.getModel();

    var renderData = {
        author: model.get('author'),
        content: model.get('content'),
        howLongAgo: model.getHumanReadablePubTime()
    };
    var fragment = soy.renderAsFragment(omchat.templates.chatlistItem,
                                        renderData);
    goog.dom.append(el, fragment);

    // Set color on the author name
    var authorDom = goog.dom.getElementByClass('author', el);
    var color = omchat.ui.ChatlistItemRenderer.colorSelector.getColorByName(
            renderData.author);
    goog.style.setStyle(authorDom, 'color', '#' + color);

    var pubTimeDom = goog.dom.getElementByClass('pub-time', el);
    var label = new goog.ui.Tooltip(undefined,
            String(new Date(model.get('pub_time').getTime())));
    label.attach(pubTimeDom);

    return el;

    // If template is not used, things will be much complex here:
    // Create a element, create children and do decoration.
    // Suggested pattern is to add children to chatlistItem with opt_render=1
};

/**
 * We are using template so there is no need to decorate things.
 * @inheritDoc
 * @override
 */
omchat.ui.ChatlistItemRenderer.prototype.canDecorate = function(element) {
    return false;
};

/**
 * A control that displays a {omchat.models.Chat}.
 * @param {omchat.models.Chat} chat The model to display.
 * @param {omchat.ui.ChatlistItemRenderer=} renderer The renderer to use.
 * @constructor
 * @extends {goog.ui.Control}
 */
omchat.ui.ChatlistItem = function(chat, renderer) {
    goog.base(this, null /* content */, renderer);
    this.setModel(chat);
};
goog.inherits(omchat.ui.ChatlistItem, goog.ui.Control);

/**
 * @return {!omchat.models.Chat}
 * @override
 */
omchat.ui.ChatlistItem.prototype.getModel;

goog.ui.registry.setDefaultRenderer(omchat.ui.ChatlistItem,
                                    omchat.ui.ChatlistItemRenderer);


/**
 * A singleton chat collection renderer. Can only do createDom.
 * @constructor
 * @extends {goog.ui.ContainerRenderer}
 */
omchat.ui.ChatlistRenderer = function() {
    goog.base(this);
};
goog.inherits(omchat.ui.ChatlistRenderer, goog.ui.ContainerRenderer);
goog.addSingletonGetter(omchat.ui.ChatlistRenderer);

/** @type {string} */
omchat.ui.ChatlistRenderer.CSS_CLASS = 'omchat-chatlist';

/**
 * @inheritDoc
 * @override
 */
omchat.ui.ChatlistRenderer.prototype.getCssClass = function() {
    return omchat.ui.ChatlistRenderer.CSS_CLASS;
};

/**
 * @param {omchat.ui.Chatlist} chatlistContainer
 * @return {Element}
 * @override
 */
omchat.ui.ChatlistRenderer.prototype.createDom = function(chatlistContainer) {
    var el = goog.base(this, 'createDom', chatlistContainer);
    chatlistContainer.setElementInternal(el);

    var collection = chatlistContainer.getModel();
    var models = collection.getModels();

    goog.array.forEach(models, function(chat) {
        var control = new omchat.ui.ChatlistItem(chat);
        chatlistContainer.addChild(control, true /* opt_render */);
    });

    return el;
};

/**
 * @inheritDoc
 * @override
 */
omchat.ui.ChatlistRenderer.prototype.canDecorate = function(element) {
    return false;
};


/**
 * @param {omchat.models.ChatCollection} collection
 * @constructor
 * @extends {goog.ui.Container}
 */
omchat.ui.Chatlist = function(collection) {
    goog.base(this, goog.ui.Container.Orientation.VERTICAL,
              omchat.ui.ChatlistRenderer.getInstance());

    this.setModel(collection);
    this.setFocusable(false);
};
goog.inherits(omchat.ui.Chatlist, goog.ui.Container);

/**
 * @inheritDoc
 * @override
 */
omchat.ui.Chatlist.prototype.addChild = function(child, opt_render) {
    var returnValue = goog.base(this, 'addChild', child, opt_render);
    this.dispatchEvent(omchat.ui.Chatlist.EventType.CHILD_ADDED);
    return returnValue;
};

/**
 * @return {omchat.ui.ChatCollection}
 * @override
 */
omchat.ui.Chatlist.prototype.getModel;

/**
 * Start listening to dom events.
 * @inheritDoc
 * @override
 */
omchat.ui.Chatlist.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    // Considered hack here for accessing parentElement.
    var scrollDown = goog.bind(function(e) {
        var parentElement = this.getElement().parentElement;
        parentElement.scrollTop = parentElement.scrollHeight;
    }, this);

    var recalculatePubTime = goog.bind(function(e) {
        this.forEachChild(function(child) {
            // TODO: consider put this in the chatlistItem class
            var el = child.getElement();
            var timeDisplay = goog.dom.getElementByClass('pub-time',
                                                         el);
            timeDisplay.innerHTML = goog.string.htmlEscape(
                    child.getModel().getHumanReadablePubTime());
        });
    }, this);

    // After we are in the dom, we should scroll down.
    scrollDown();
    // Scroll down the dom when new child is added.
    goog.events.listen(this, omchat.ui.Chatlist.EventType.CHILD_ADDED,
                       scrollDown);

    // Re-calculate pubTime when new child is added.
    goog.events.listen(this, omchat.ui.Chatlist.EventType.CHILD_ADDED,
                       recalculatePubTime);

    // Render when new model is added.
    goog.events.listen(this.getModel(), cBackbone.models.EventType.ADD,
            goog.bind(function(e) {
                var model = /** @type {omchat.models.Chat } */ (e.target);
                var control = new omchat.ui.ChatlistItem(model);
                this.addChild(control, true /* opt_render */);
            }, this)
    );

    // Hide/show items filtered by author's name
    goog.events.listen(this.getModel(),
            omchat.models.ChatCollection.EventType.SELECTED_AUTHOR_CHANGED,
            goog.bind(function(e) {
                if (this.getModel().hasSelectedAuthor()) {
                    var author = this.getModel().getSelectedAuthor();
                    this.forEachChild(function(child) {
                        var model = child.getModel();
                        if (model.get('author') === author)
                            child.setVisible(true);
                        else
                            child.setVisible(false);
                    });
                }
                else {
                    this.forEachChild(function(child) {
                        child.setVisible(true);
                    });
                }

                // When author filtered, scroll down.
                scrollDown();
            }, this)
    );

    // Re-render the pub-time section once per minute.
    var minuteTimer = new goog.Timer(60 * 1000);
    goog.events.listen(minuteTimer, goog.Timer.TICK, recalculatePubTime);
    minuteTimer.start();
};

goog.ui.registry.setDefaultRenderer(omchat.ui.Chatlist,
        omchat.ui.ChatlistRenderer);


/**
 * A formset that can do submittion.
 * @param {omchat.models.MouthStatus} model
 * @constructor
 * @extends {goog.ui.Component}
 */
omchat.ui.Mouth = function(model) {
    goog.base(this);
    this.setModel(model);
};
goog.inherits(omchat.ui.Mouth, goog.ui.Component);

/**
 * @return {omchat.models.MouthStatus}
 * @override
 */
omchat.ui.Mouth.getModel;


/** @type {string} */
omchat.ui.Mouth.CSS_CLASS = 'omchat-mouth';

/**
 * @inheritDoc
 * @override
 */
omchat.ui.Mouth.prototype.getCssClass = function() {
    return omchat.ui.Mouth.CSS_CLASS;
};


/**
 * @inheritDoc
 * @override
 */
omchat.ui.Mouth.prototype.createDom = function() {
    goog.base(this, 'createDom');
    var el = this.element_;

    var fragment = soy.renderAsFragment(omchat.templates.chatlistItem,
                                        renderData);
    goog.dom.append(el, fragment);
    this.decorate(el);
};

/**
 * @inheritDoc
 * @override
 */
omchat.ui.Mouth.prototype.decorateInternal = function(element) {
    goog.base(this, 'decorateInternal', element);

    // Put here because createDom will call as well.
    goog.dom.classes.set(element, this.getCssClass());

    var usernameElement = goog.dom.getElementByClass('username', element);
    var usernameLabel = new goog.ui.LabelInput('Name');
    this.addChild(usernameLabel);
    usernameLabel.decorate(usernameElement);

    var textareaElement = goog.dom.getElementByClass('texts', element);
    var textarea = new goog.ui.Textarea();
    this.addChild(textarea);
    textarea.setMinHeight(90);
    textarea.decorate(textareaElement);
    var textareaLabel = new goog.ui.LabelInput(
            'Say something... (shift + enter to submit)');
    textareaLabel.decorate(textareaElement);

    var buttonElement = goog.dom.getElementByClass('say', element);
    var button = new goog.ui.Button(null);
    this.addChild(button);
    button.decorate(buttonElement);
};

/**
 * @inheritDoc
 * @override
 */
omchat.ui.Mouth.prototype.enterDocument = function() {
    goog.base(this, 'enterDocument');

    var nameInput = this.getChildAt(0);
    var textarea = this.getChildAt(1);
    var button = this.getChildAt(2);
    var statusElement = this.getElementByClassName;

    var submitHandler = goog.bind(function(e) {
        var author = nameInput.getValue();
        var content = textarea.getValue();

        // Cannot submit empty value
        if (!goog.string.trim(content))
            return;

        // Is already submitting: ignore this.
        if (!textarea.isEnabled())
            return;

        textarea.setEnabled(false);
        button.setEnabled(false);

        var collection = this.getModel().collection;

        var newChat = new omchat.models.Chat({
            'author': author,
            'content': content
        });
        var xhrDeferred = newChat.save(null, {'url': collection.getUrl()});

        xhrDeferred.addCallback(function() {
            // After submission succeed
            textarea.setEnabled(true);
            textarea.setValue('');
            if (author) {
                // Disable name changing after submitting.
                nameInput.getElement().readOnly = true;
            }
        });
    }, this);

    var buttonEnabler = function(e) {
        if (textarea.getValue())
            button.setEnabled(true);
        else
            button.setEnabled(false);
    };

    var onTextareaKeyUp = function(e) {
        var keyCode = /** @type {number} */ (e.keyCode);
        if (keyCode == 13 && e.shiftKey) {
            // is shift + enter
            e.preventDefault();
            submitHandler(e);
        }
        else {
            buttonEnabler(e);
        }
    };

    goog.events.listen(button, goog.ui.Component.EventType.ACTION,
                       submitHandler);
    goog.events.listen(textarea.getElement(),
                       [goog.events.EventType.KEYUP,
                        goog.events.EventType.KEYDOWN],
                       onTextareaKeyUp);
    buttonEnabler();  // set the status of the textarea to be disabled.
};



/** @enum {string} */
omchat.ui.Chatlist.EventType = {
    CHILD_ADDED: goog.events.getUniqueId('add-child')
};

