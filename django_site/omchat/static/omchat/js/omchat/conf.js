goog.provide('omchat.conf');

goog.require('goog.net.Cookies');

/**
 * @type {string}
 * @private
 */
omchat.conf.csrf_ = undefined;

/** @return {string} */
omchat.conf.get_csrf = function() {
    if (goog.isDef(omchat.conf.csrf_))
        return omchat.conf.csrf_;

    /* hack for django's csrf */
    omchat.conf.csrf_ = (new goog.net.Cookies(document)).get('csrftoken');
    return omchat.conf.get_csrf();
};

