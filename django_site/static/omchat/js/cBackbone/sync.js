goog.provide('cBackbone.sync');

goog.require('goog.async.Deferred');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.object');


/**
 * @enum {string}
 */
cBackbone.sync.methodMap = {
    "create": "POST",
    "update": "PUT",
    "delete": "DELETE",
    "read": "GET"
};


/**
 * Override this function to change the manner in which Backbone persists
 * models to the server. You will be passed the type of request, and the
 * model in question. By default, uses makes a RESTful Ajax request
 * to the model's `getUrl_()`. Some possible customizations could be:
 *
 * - Use `setTimeout` to batch rapid-fire updates into a single request.
 * - Send up the models as XML instead of JSON
 * - Persist models via WebSockets instead of Ajax.
 *
 * allowed options:
 * - url
 * - success
 * - data
 * - headers
 *
 * @param {string} action To be translated into HTTP method
 * @param {cBackbone.models.Model|cBackbone.models.Collection} model The model
 * to be synchronized.
 * @param {Object} options See options above.
 * @return {goog.async.Deferred}
 */
cBackbone.sync.defaultSync = function(action, model, options) {
    /** @type {string} */
    var method = cBackbone.sync.methodMap[action];

    // Ensure that we have a URL.
    /** @type {Object} */
    var params = goog.object.clone(options);
    if (!params.url)
        params.url = model.getUrl() || model.getCollection().getUrl();

    // Ensure that we have the appropriate request data.
    if (!params.data && model &&
            (action == 'create' || action == 'update')) {
        params.data = goog.json.serialize(model.toJson());
    }

    var headers = {
        "Content-Type": "application/json"
    };
    goog.object.extend(headers, params.headers || {});

    // The Deferred object to be returned
    // TODO: errback as well?
    var d = new goog.async.Deferred();
    d.addCallback(params.success);

    goog.net.XhrIo.send(params.url,
            goog.bind(d.callback, d) /* opt_callback */,
            method /* opt_method */,
            params.data /* opt_content */,
            headers /* opt_headers */);

    return d;
};

/** 
 * Vendors to use.
 * @type {Object}
 */
cBackbone.sync.vendorMap = {
    'Backbone': cBackbone.sync.defaultSync
};

/** @type {string} */
cBackbone.sync.defaultVendor = 'Backbone';

/** 
 * @param {string} name
 */
cBackbone.sync.setDefaultVendor = function(name) {
    cBackbone.sync.defaultVendor = name;
};

/** 
 * Get a sync fucntion by the vendor's name.
 * @param {string=} name
 */
cBackbone.sync.getByVendorName = function(name) {
    if (!goog.isDef(name))
        name = cBackbone.sync.defaultVendor;
    if (!goog.object.containsKey(cBackbone.sync.vendorMap, name))
        name = cBackbone.sync.defaultVendor;
    return cBackbone.sync.vendorMap[name];
};

/**
 * @param {string} name
 * @param {Function} sync
 */
cBackbone.sync.addVendor = function(name, sync) {
    cBackbone.sync.vendorMap[name] = sync;
};

