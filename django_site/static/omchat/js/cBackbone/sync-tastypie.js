goog.provide('cBackbone.vendors.tastypie');

goog.require('goog.async.Deferred');
goog.require('goog.events');
goog.require('goog.net.Cookies');
goog.require('goog.net.XhrIo');
goog.require('goog.net.HttpStatus');
goog.require('goog.object');
goog.require('cBackbone.sync');
goog.require('cBackbone.models');

/**
 * description: Vendor-specific fix for django-tastypie
 * usage: install()
 */

/**
 * @private
 * @type {boolean}
 */
cBackbone.vendors.tastypie.installed_ = false;

cBackbone.vendors.tastypie.install = function() {
    if (!cBackbone.vendors.tastypie.installed_) {
        cBackbone.vendors.tastypie.installed_ = true;
        cBackbone.sync.addVendor('tastypie', cBackbone.vendors.tastypie.sync);
        cBackbone.sync.setDefaultVendor('tastypie');
    }
};

/**
 * @inheritDoc
 * @constructor
 * @extends {cBackbone.models.Model}
 */
cBackbone.vendors.tastypie.Model = function(attr, opt) {
    goog.base(this, attr, opt);
};
goog.inherits(cBackbone.vendors.tastypie.Model, cBackbone.models.Model);

/**
 * @inheritDoc
 */
cBackbone.vendors.tastypie.Model.prototype.getIdAttribute = function() {
    return "resource_uri";
};

/**
 * @inheritDoc
 */
cBackbone.vendors.tastypie.Model.prototype.getUrl =
        cBackbone.models.Model.prototype.getId;

/**
 * @inheritDoc
 * @constructor
 * @extends {cBackbone.models.Collection}
 */
cBackbone.vendors.tastypie.Collection = function(models, opt) {
    goog.base(this, models, opt);
};
goog.inherits(cBackbone.vendors.tastypie.Collection,
        cBackbone.models.Collection);

/**
 * @inheritDoc
 */
cBackbone.vendors.tastypie.Collection.prototype.model_ =
        cBackbone.vendors.tastypie.Model;

/**
 * @inheritDoc
 */
cBackbone.vendors.tastypie.Collection.prototype.parse = function(data) {
    return data && data["objects"];
};


/** @return {string} */
cBackbone.vendors.tastypie.getCsrf = function() {
    return (new goog.net.Cookies(document)).get('csrftoken');
};

/**
 * Override Backbone's sync function, to do a GET upon receiving a HTTP
 * CREATED. This requires 2 requests to do a create, so you may want to
 * use some other method in production.
 *
 * @param {string} action To be translated into HTTP method
 * @param {cBackbone.models.Model|cBackbone.models.Collection} model The model
 * to be synchronized.
 * @param {Object} options See options above.
 * @return {goog.async.Deferred}
 */
cBackbone.vendors.tastypie.sync = function(action, model, options) {
    if (!options["headers"])
        options["headers"] = {};

    options["headers"]["Accept"] = 'application/json;q=0.9';

    if (action !== 'read') {
        options["headers"]["X-CSRFToken"] =
                cBackbone.vendors.tastypie.getCsrf();
    }

    if (action !== 'create') {
        return cBackbone.sync.defaultSync(action, model, options);
    }

    var d = new goog.async.Deferred();
    d.addCallback(options["success"]);

    // Replace original success callback with 201-CREATED checker...
    options["success"] = function(e) {
        var xhr = /** @type {goog.net.XhrIo} */ (e.target);
        if (xhr.getStatus() === goog.net.HttpStatus.CREATED &&
                !xhr.getResponseText()) {
            // 201 CREATED, we need to fetch again.

            var headers = {
                "Content-Type": "application/json"
            };
            goog.object.extend(headers, options["headers"] || {});

            goog.net.XhrIo.send(xhr.getResponseHeader('Location'),
                    goog.bind(d.callback, d) /* opt_callback */,
                    'GET' /* opt_method */,
                    null /* opt_content */,
                    headers /* opt_headers */);
        }
        else {
            d.callback(e);
        }
    };
    cBackbone.sync.defaultSync(action, model, options);
    return d;
};



