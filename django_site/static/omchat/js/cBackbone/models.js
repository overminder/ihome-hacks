goog.provide('cBackbone.models');
goog.provide('cBackbone.models.EventType');

goog.require('cBackbone.sync');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventHandler');
goog.require('goog.events.EventTarget');
goog.require('goog.object');

/** Event names for model/collection events
 * @enum {string}
 */
cBackbone.models.EventType = {
    ADD: goog.events.getUniqueId('add'),
    DESTROY: goog.events.getUniqueId('destroy'),
    REMOVE: goog.events.getUniqueId('remove'),
    CHANGE: goog.events.getUniqueId('change'),
    RESET: goog.events.getUniqueId('reset'),
    ERROR: goog.events.getUniqueId('error')
};

/**
 * @param {Object=} attributes
 * @param {Object=} options
 * @constructor
 * @extends goog.events.EventTarget
 */
cBackbone.models.Model = function(attributes, options) {
    goog.base(this);

    var defaults;
    var extendedAttributes = {};
    if (!goog.isDefAndNotNull(attributes))
        attributes = {};

    if (defaults = this.defaults) {
        if (goog.isFunction(defaults)) defaults = defaults.call(this);
        goog.object.extend(extendedAttributes, defaults);
    }
    goog.object.extend(extendedAttributes, attributes);

    /**
     * @type {Object}
     * @private
     */
    this.attributes_ = {};

    /**
     * @type {?string}
     * @private
     */
    this.id_ = null;

    /**
     * @type {Object}
     * @private
     */
    this.escapedAttributes_ = {};

    this.set(extendedAttributes, {'slient': true});

    /**
     * Has the item been changed since the last `"CHANGE"` event?
     * @type {boolean}
     * @private
     */
    this.changed_ = false;

    /**
     * A snapshot of the model's previous attributes, taken immediately
     * after the last `"CHANGE"` event was fired.
     * @type {Object}
     * @private
     */
    this.previousAttributes_ = goog.object.clone(this.attributes);

    /**
     * @type {cBackbone.models.Collection}
     * @private
     */
    this.collection_ = null;
    if (goog.isDefAndNotNull(options) &&
            goog.object.containsKey(options, 'collection'))
        this.setCollection(options['collection']);

    this.initializeInternal(extendedAttributes, options);
};
goog.inherits(cBackbone.models.Model, goog.events.EventTarget);

/**
 * @return {cBackbone.models.Collection}
 */
cBackbone.models.Model.prototype.getCollection = function() {
    return this.collection_;
};

/**
 * @param {cBackbone.models.Collection} collection
 */
cBackbone.models.Model.prototype.setCollection = function(collection) {
    this.collection_ = collection;
};


/**
 * @return {?string}
 */
cBackbone.models.Model.prototype.getId = function() {
    return this.id_;
};

/**
 * @param {string} id
 */
cBackbone.models.Model.prototype.setId = function(id) {
    this.id_ = id;
};


/**
 * @return {string}
 */
cBackbone.models.Model.prototype.getCid = function() {
    return goog.getUid(this);
};


/**
 * The default name for the JSON `id` attribute is `"id"`. Tastypie users
 * may want to set this to `"resource_uri"`.
 * @return {string}
 */
cBackbone.models.Model.prototype.getIdAttribute = function() {
    return 'id';
};

/**
 * Default URL for the model's repr on the server -- if you are using
 * Backbone's RESTful methods, override this to change the endpoint
 * that will be called.
 * @return {string}
 */
cBackbone.models.Model.prototype.getUrl = goog.abstractMethod;

/**
 * To be overridden by the subclass
 * @param {Object} attr
 * @param {Object} opt
 * @protected
 */
cBackbone.models.Model.prototype.initializeInternal = goog.nullFunction;

/**
 * Return a copy of the model's `attributes` object.
 */
cBackbone.models.Model.prototype.toJson = function() {
    return goog.object.clone(this.attributes_);
};

/**
 * Get the value of an attribute
 * @param {string} attr
 * @return {string}
 */
cBackbone.models.Model.prototype.get = function(attr) {
    return this.attributes_[attr];
};

/**
 * Get the HTML-escaped value of an attribute
 * @param {string} attr
 * @return {string}
 */
cBackbone.models.Model.prototype.escape = function(attr) {
    var html;
    if (html = this.escapedAttributes_[attr])
        return html;

    var value = this.get(attr);
    return this.escapedAttributes_[attr] = goog.string.htmlEscape(
            goog.isDefAndNotNull(value) ? '' + value : '');
};

/**
 * Returns `true` is the attribute contains a value that is not null
 * or undefined.
 * @param {string} attr
 */
cBackbone.models.Model.prototype.has = function(attr) {
    return goog.isDefAndNotNull(this.get(attr));
};

/**
 * Set a hash of model attributes on the object, firing `"change"` unless you
 * choose to slience it.
 * @param {Object=} attrs
 * @param {Object=} options
 * @return {cBackbone.models.Model}
 */
cBackbone.models.Model.prototype.set = function(attrs, options) {
    // Extrace attributes and options
    if (!goog.isDefAndNotNull(attrs))
        return this;
    if (!goog.isDefAndNotNull(options))
        options = {};
    if (goog.object.containsKey(attrs, 'attributes'))
        attrs = attrs['attributes'];
    var now = this.attributes_, escaped = this.escapedAttributes_;

    // Run validation
    if (!options['silent'] && this['validate_'] &&
            this.performValidation(attrs, options))
        return null;

    // Check for changes of `id`.
    if (goog.object.containsKey(attrs, this.getIdAttribute()))
        this.setId(attrs[this.getIdAttribute()]);

    // We're about to start triggering change events
    var alreadyChanging = this.changing_;
    this.changing_ = true;

    // Update attributes
    var self = this;
    goog.object.forEach(attrs, function(value, attr) {
        if (now[attr] !== value) {
            now[attr] = value;
            delete escaped[attr];
            self.changed_ = true;
        }
    });

    if (!alreadyChanging && !options['silent'] && this.changed_)
        this.changeInternal(options);
    this.changing_ = false;
    return this;
};


/**
 * Fetch the model from the server. If the server's representation of the
 * model differs from its current attributes, they will be overriden,
 * triggering a `"CHANGE"` event.
 * @param {Object=} options
 * @return {*}
 */
cBackbone.models.Model.prototype.fetch = function(options) {
    if (!goog.isDefAndNotNull(options))
        options = {};

    var self = this;
    var success = options['success'];
    options['success'] = function(e) {
        var xhr = /** @type {goog.net.XhrIo} */ (e.target);
        if (!self.set(self.parse(xhr.getResponseJson()), options))
            return null;

        if (success)
            return success(e);
        else
            return e;
    };
    return cBackbone.sync.getByVendorName()('read', this, options);
};


/**
 * Set a hash of model attributes, and sync the model to the server.
 * If the server returns an attributes hash that differs, the model's
 * state will be `set` again.
 * @param {Object=} attrs
 * @param {Object=} options
 * @return {*}
 */
cBackbone.models.Model.prototype.save = function(attrs, options) {
    if (!goog.isDefAndNotNull(options))
        options = {};
    if (attrs && !this.set(attrs, options))
        return null;

    var self = this;
    var success = options['success'];
    options['success'] = function(e) {
        var xhr = /** @type {goog.net.XhrIo} */ (e.target);
        if (!self.set(self.parse(xhr.getResponseJson()), options))
            return null;

        if (success)
            return success(e);
        else
            return e;
    };
    // TODO: error handling
    var action = this.isNew() ? 'create' : 'update';
    return cBackbone.sync.getByVendorName()(action, this, options);
};


/**
 * Destroy this model on the server if it was already persisted. Upon success,
 * the model is removed from its collection, if it has one.
 * @param {Object=} options
 * @return {*}
 */
cBackbone.models.Model.prototype.destroy = function(attrs, options) {
    if (!goog.isDefAndNotNull(options))
        options = {};
    if (this.isNew())
        return this.dispatchEvent(cBackbone.models.EventType.DESTROY);

    var self = this;
    var success = options['success'];
    options['success'] = function(e) {
        self.dispatchEvent(cBackbone.models.EventType.DESTROY);
        if (success)
            return success(e);
        else
            return e;
    };
    // TODO: error handling
    return cBackbone.sync.getByVendorName()('delete', this, options);
};


/**
 * Converts a response into the hash of attributes to be `set` on the model.
 * The default implementation is just to pass the response along.
 * @param {Object} data The json response to be parsed.
 * @return {Object} parsed data.
 * @protected
 */
cBackbone.models.Model.prototype.parse = function(data) {
    return data;
};


/**
 * A model is new if it has never been saved to the server, and lacks an id.
 * @return {boolean}
 */
cBackbone.models.Model.prototype.isNew = function() {
    return goog.isNull(this.getId());
};

/**
 * Call this method to manually fire a `CHANGE` event for this model.
 * Calling this will cause all objects observing the model to update.
 * @param {Object=} options
 * @protected
 */
cBackbone.models.Model.prototype.changeInternal = function(options) {
    this.dispatchEvent(cBackbone.models.EventType.CHANGE);
    this.previousAttributes_ = goog.object.clone(this.attributes_);
    this.changed_ = false;
};


/**
 * Determine if the model has changed since the last `"CHANGE"`.
 * If you specify an attribute name, determine if that attribute has changed.
 * @param {string=} attr
 */
cBackbone.models.Model.prototype.hasChanged = function(attr) {
    if (goog.isDefAndNotNull(attr))
        return this.previousAttributes[attr] != this.attributes_[attr];
    else
        return this.changed_;
};


/**
 * Run validation against a set of incoming attributes, returning `true`
 * if all is well. If a specific `error` callback has been passed,
 * call that instead of firing the general `"ERROR"` event.
 * @param {Object=} attrs
 * @param {Object=} options
 * @return {boolean} whether the validation is successful or not.
 */
cBackbone.models.Model.prototype.performValidation = function(
        attrs, options) {

    var error = this.validate(attrs);
    if (!goog.object.isEmpty(error)) {
        if (goog.object.containsKey(options, 'error')) {
            options['error'](this, error, options);
        }
        else {
            this.dispatchEvent(cBackbone.models.EventType.ERROR);
        }
        return false;
    }
    return true;
};


/**
 * @param {cBackbone.models.Model=} models
 * @param {Object=} options
 * @constructor
 * @extends goog.events.EventTarget
 */
cBackbone.models.Collection = function(models, options) {
    goog.base(this);

    if (!goog.isDefAndNotNull(options))
        options = {};

    if (goog.object.containsKey(options, 'comparator'))
        this.comparator = options['comparator'];

    /**
     * @type {Array.<cBackbone.models.Model>}
     * @private
     */
    this.models_ = [];

    /**
     * @type {Object}
     * @private
     */
    this.byId_ = {};

    /**
     * @type {Object}
     * @private
     */
    this.byCid_ = {};

    if (goog.isDefAndNotNull(models))
        this.reset(models, {'silent': true});

    /**
     * @type {goog.events.EventHandler}
     * @private
     */
    this.eventHandler_ = new cBackbone.models.CollectionEventHandler(this);

    this.initializeInternal.apply(this, arguments);
};
goog.inherits(cBackbone.models.Collection, goog.events.EventTarget);

/**
 * To be overridden.
 * @type {Function}
 * @protected
 */
cBackbone.models.Collection.prototype.comparator = null;


/**
 * The constructor of the model that belongs to this collection.
 * To be overriden.
 * @type {Function}
 * @protected
 */
cBackbone.models.Collection.prototype.model = cBackbone.models.Model;

/**
 * Default URL for the collection's repr on the server -- if you are using
 * Backbone's RESTful methods, override this to change the endpoint
 * that will be called.
 * @return {string}
 */
cBackbone.models.Collection.prototype.getUrl = goog.abstractMethod;

/**
 * Overriden by the user to provide custon behavior of initialization.
 * @param {Object} attr
 * @param {Object} opt
 * @protected
 */
cBackbone.models.Collection.prototype.initializeInternal = goog.nullFunction;

/**
 * Returns the whole array of models copied.
 * @return {Array.<cBackbone.models.Model>}
 */
cBackbone.models.Collection.prototype.getModels = function() {
    return goog.array.clone(this.models_);
};

/**
 * The JSON representation of a Collection is an array of the
 * models' attributes.
 * @return {Array.<Object>}
 */
cBackbone.models.Collection.prototype.toJson = function() {
    return goog.array.map(this.models_, function(model) {
        return model.toJson();
    });
};


/**
 * Add a model, or list of models to the set. Pass `"silent"` to avoid
 * firing the `ADDED` event for every new model.
 * @param {cBackbone.models.Model|Array.<cBackbone.models.Model>|
 * Object|Array.<Object>} models
 * @param {Object} options
 * @return {cBackbone.models.Collection}
 */
cBackbone.models.Collection.prototype.add = function(models, options) {
    if (goog.isArray(models)) {
        var self = this;
        goog.array.forEach(models, function(model) {
            self.addInternal(model, options);
        });
    }
    else {
        this.addInternal(models, options);
    }
    return this;
};


/**
 * Remove a model, or list of models from the set. Pass `"silent"` to avoid
 * firing the `REMOVED` event for every model removed.
 * @param {cBackbone.models.Model|Array.<cBackbone.models.Model>} models
 * @param {Object} options
 * @return {cBackbone.models.Collection}
 */
cBackbone.models.Collection.prototype.remove = function(models, options) {
    if (goog.isArray(models)) {
        var self = this;
        goog.array.forEach(models, function(model) {
            self.removeInternal(model, options);
        });
    }
    else {
        this.removeInternal(models, options);
    }
    return this;
};


/**
 * Get a model from the set by id.
 * @param {string=} id
 * @return {cBackbone.models.Model}
 */
cBackbone.models.Collection.prototype.get = function(id) {
    if (!goog.isDefAndNotNull(id))
        return null;
    else
        return this.byId_[id];
};


/**
 * Get a model from the set by client id.
 * @param {string=} id
 * @return {cBackbone.models.Model}
 */
cBackbone.models.Collection.prototype.getByCid = function(cid) {
    if (!goog.isDefAndNotNull(cid))
        return null;
    else
        return this.byCid_[cid];
};


/**
 * Get a model at the given index.
 * @param {number} id
 * @return {cBackbone.models.Model}
 */
cBackbone.models.Collection.prototype.at = function(index) {
    return this.models_[index];
};


/**
 * Force the collection to re-sort itself. You don't need to call this under
 * normal circumstances, as the set will maintain sort order as each item
 * is added.
 * @param {Object} options
 * @return {cBackbone.models.Collection} this.
 */
cBackbone.models.Collection.prototype.sort = function(options) {
    if (!goog.isDefAndNotNull(options))
        options = {};

    if (!this.comparator)
        throw new Error('Cannot sort a set without a comparator');

    goog.array.stableSort(this.models_, this.comparator);
    if (!options['silent'])
        this.dispatchEvent(cBackbone.models.EventType.RESET);
    return this;
};


/**
 * Pluck an attribute from each model in the collection.
 * @param {string} attr
 * @return {Array.<string>}
 */
cBackbone.models.Collection.prototype.pluck = function(attr) {
    return goog.array.map(this.models_, function(model) {
        return model.get(attr);
    });
};


/**
 * When you have more items than you want to add or remove individually,
 * you can rest the entire set with a new list of models, without firing
 * any `added` or `removed` events. Fires `reset` when finished.
 * @param {cBackbone.models.Model=|Array.<cBackbone.models.Model>} models
 * @param {Object=} options
 * @return {cBackbone.models.Collection} this.
 */
cBackbone.models.Collection.prototype.reset = function(models, options) {
    if (!goog.isDefAndNotNull(models))
        models = [];
    if (!goog.isDefAndNotNull(options))
        options = {};

    goog.array.forEach(this.models_,
            goog.bind(this.removeReferenceInternal, this));
    this.resetInternal();
    this.add(models, {'silent': true});
    if (!options['silent'])
        this.dispatchEvent(cBackbone.models.EventType.RESET);

    return this;
};

/**
 * Fetch the default set of models for this collection, resetting the
 * collection when they arrive. If `add: treu` is passed, appends the
 * models to the collection instead of resetting.
 * @param {Object=} options
 * @return {goog.async.Deferred}
 */
cBackbone.models.Collection.prototype.fetch = function(options) {
    if (!goog.isDefAndNotNull(options))
        options = {};

    var self = this;
    var addMethod = goog.bind(this.add, this);
    var resetMethod = goog.bind(this.reset, this);
    var success = options['success'];
    options['success'] = function(e) {
        var xhr = /** @type {goog.net.XhrIo} */ (e.target);
        var method = options['add'] ? addMethod : resetMethod;
        method(self.parse(xhr.getResponseJson()), options);
        if (success)
            return success(e);
        else
            return e;
    };

    // TODO: error handling
    return cBackbone.sync.getByVendorName()('read', this, options);
};


/**
 * Create a new instance of a model in this collection. After the model
 * has been created on the server, it will be added to the collection.
 * Return s the model, or `false` if the validation on a new model fails.
 * @param {cBackbone.models.Model|Object} model Model instance or raw data.
 * @param {Object=} options
 * @return {goog.async.Deferred}
 */
cBackbone.models.Collection.prototype.create = function(model, options) {
    if (!goog.isDefAndNotNull(options))
        options = {};

    var self = this;
    model = this.prepareModelInternal(model, options);
    if (!model)
        return null;

    var success = options['success'];
    options['success'] = function(e) {
        var xhr = /** @type {goog.net.XhrIo} */ (e.target);
        self.add(xhr.getResponseJson(), options);
        if (success)
            return success(e);
        else
            return e;
    };

    // TODO: error handling
    model.save(null, options);
    return model;
};


/**
 * Converts a response into a list of models to be added to the
 * collection. The default implementation is just to pass it through.
 * @param {Object} data The json response to be parsed.
 * @return {Object} parsed data.
 */
cBackbone.models.Collection.prototype.parse = function(data) {
    return data;
};


/**
 * Reset all internal state. Called when the collection is reset.
 * @param {Object=} options
 * @protected
 */
cBackbone.models.Collection.prototype.resetInternal = function(options) {
    goog.array.clear(this.models_);
    goog.object.clear(this.byId_);
    goog.object.clear(this.byCid_);
};


/**
 * Prepare a model to be added to this collection
 * @param {cBackbone.models.Model|Object} model Either a model instance or
 * a raw object that contains the data for a model.
 * @param {Object=} options
 * @return {cBackbone.models.Model}
 * @protected
 */
cBackbone.models.Collection.prototype.prepareModelInternal = function(
        model, options) {

    if (!(model instanceof cBackbone.models.Model)) {
        /** @type {Object} */
        var attrs = model;

        model = new this.model(attrs, {collection: this});
        if (model.validate && !model.performValidation(attrs, options))
            model = null;
    }
    else if (!model.getCollection()) {
        model.setCollection(this);
    }
    return model;
};

/**
 * Internal implementation of adding a single model to the set, updating
 * hash indexes for `id` and `cid` lookups.
 * Returns the model, or `null` if validation on a new model fails.
 *
 * @param {cBackbone.models.Model|Object} model Either a model instance or
 * a raw object that contains the data for a model.
 * @param {Object=} options
 * @return {cBackbone.models.Model}
 * @protected
 */
cBackbone.models.Collection.prototype.addInternal = function(
        model, options) {

    if (!goog.isDefAndNotNull(options))
        options = {};

    model = this.prepareModelInternal(model, options);
    if (!model)
        return null;

    var already = this.getByCid(model.getCid());
    if (already)
        throw new Error(["Can't add the same model to a set twice",
                already.getId()]);

    this.byId_[model.getId()] = model;
    this.byCid_[model.getCid()] = model;

    // Figure out the index that the model should live at.
    if (goog.isDefAndNotNull(options['at'])) {
        // Insert the model to the given index.
        this.models_.splice(options['at'], 0, model);
    }
    else if (this.comparator) {
        // Insert the model but preserving the order.
        goog.array.binaryInsert(this.models_, model, this.comparator);
    }
    else {
        // Append the model if we cannot figure out the order.
        this.models_.push(model);
    }

    // Setup event bubbling.
    model.setParentEventTarget(this);

    if (!options['silent'])
        model.dispatchEvent(cBackbone.models.EventType.ADD);
    return model;
};


/**
 * Internal implementation of removing a single model from the set, updating
 * hash indexes for `id` and `cid` lookups.
 *
 * @param {cBackbone.models.Model} model
 * @param {Object=} options
 * @return {cBackbone.models.Model} The removed model.
 * @protected
 */
cBackbone.models.Collection.prototype.removeInternal = function(
        model, options) {

    if (!goog.isDefAndNotNull(options))
        options = {};

    model = this.getByCid(model.getCid()) || this.get(model.getId());
    if (!model)
        return null;

    delete this.byId_[model.getId()];
    delete this.byCid_[model.getCid()];
    if (this.comparator)
        goog.array.binaryRemove(this.models_, model, this.comparator);
    else
        goog.array.remove(this.models_, model);

    if (!options.silent)
        model.dispatchEvent(cBackbone.models.EventType.REMOVE);

    this.removeReferenceInternal(model);
    return model;
};


/**
 * Internal method to remove a model's ties to a collection.
 * @param {cBackbone.models.Model} model
 * @protected
 */
cBackbone.models.Collection.prototype.removeReferenceInternal = function(
        model) {

    if (model.getCollection() === this) {
        model.setCollection(null);
        model.setParentEventTarget(null);
    }
};



/**
 * Handles Collection's events
 * @constructor
 * @extends {goog.events.EventHandler}
 */
cBackbone.models.CollectionEventHandler = function(collection) {
    goog.base(this);

    /**
     * @type {cBackbone.models.Collection}
     * @private
     */
    this.collection_ = collection;

    var self = this;
    // Listen and handle all of the events.
    goog.object.forEach(cBackbone.models.EventType, function(type) {
        self.listen(self.collection_, type);
    });
};
goog.inherits(cBackbone.models.CollectionEventHandler,
        goog.events.EventHandler);


/**
 * @param {goog.events.Event} e
 * @protected
 */
cBackbone.models.CollectionEventHandler.prototype.handleEvent = function(e) {
    /** @type {cBackbone.models.Model|cBackbone.models.Collection} */
    var target = e.target;

    // We are only interested in redirecting model's events
    if (target instanceof cBackbone.models.Model) {
        /** @type {string} */
        var type = e.type;

        if ((type == cBackbone.models.EventType.ADD ||
                type == cBackbone.models.EventType.REMOVE) &&
                target.getCollection() != this.collection_) {
            e.stopPropagation();
            return;
        }
        if (type == cBackbone.models.EventType.DESTROY)
            this.collection_.removeInternal(target);
        // XXX: Unlike Backbone.js, we do not have a way to handle the
        // `change:id` event of a model.
    }
};


