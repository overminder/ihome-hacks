goog.provide('omchat.conf');

/** @const {string} */
omchat.conf.appName = 'omchat';

if (location.pathname.search('/~ch_jyx') == 0) {
    /** @type {string} */
    omchat.conf.scriptPrefix = '/~ch_jyx';

    /** @type {string} */
    omchat.conf.cometServer = 'http://ihome.ust.hk:8443';
}
else {
    /** @type {string} */
    omchat.conf.scriptPrefix = '';

    /** @type {string} */
    omchat.conf.cometServer = 'http://localhost:8443';
}

