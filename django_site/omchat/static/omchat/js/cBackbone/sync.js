goog.provide('cBackbone.sync');
goog.provide('cBackbone.django');

goog.require('goog.async.Deferred');
goog.require('goog.events');
goog.require('goog.net.Cookies');
goog.require('goog.net.XhrIo');

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
 *
 * @param {cBackbone.models.Model} obj The object to be synchronized
 * @param {string} action To be translated into HTTP method
 * @param {cBackbone.models.Model|cBackbone.models.Collection} model
 * @param {Object} options See options above.
 * @return {goog.async.Deferred}
 */
cBackbone.sync = function(obj, action, model, options) {
    /** @define {string} */
    var method = cBackbone.sync.methodMap[action];

    // Ensure that we have a URL.
    /** @define {Object} */
    var params = goog.object.clone(options);
    if (!params["url"])
        params["url"] = model.getUrl();

    // Ensure that we have the appropriate request data.
    if (!params["data"] && model &&
            (action == 'create' || action == 'update')) {
        params["data"] = goog.json.serialize(model.toJson());
    }

    var headers = {
        "Content-Type": "application/json"
    };

    if (action !== 'read') {
        headers["X-CSRFToken"] = cBackbone.django.getCsrf();
    }

    // The Deferred object to be returned
    var d = new goog.async.Deferred();
    d.addCallback(params["success"]);

    goog.net.XhrIo.send(params["url"],
            goog.bind(d.callback, d) /* opt_callback */,
            method /* opt_method */,
            params["data"] /* opt_content */,
            headers /* opt_headers */);

    return d;
};

/**
 * @enum {string}
 */
cBackbone.sync.methodMap = {
    "create": "POST",
    "update": "PUT",
    "delete": "DELETE",
    "read": "GET"
};


/** @return {string} */
cBackbone.django.getCsrf = function() {
    return (new goog.net.Cookies(document)).get('csrftoken');
};

