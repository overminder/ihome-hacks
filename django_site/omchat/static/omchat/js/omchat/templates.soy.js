// This file was automatically generated from templates.soy.
// Please don't edit this file by hand.

goog.provide('omchat.templates');

goog.require('soy');
goog.require('soy.StringBuilder');


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string|undefined}
 * @notypecheck
 */
omchat.templates.chatItem = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<span class="author"><a class="local-nav" href="#!/author/', soy.$$escapeHtml(opt_data.author), '">', soy.$$escapeHtml(opt_data.author), ':</a></span><div class="content">', soy.$$escapeHtml(opt_data.content), '</div>');
  if (!opt_sb) return output.toString();
};
