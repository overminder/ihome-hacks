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
omchat.templates.chatlistItem = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div class="author"> ', soy.$$escapeHtml(opt_data.author), ': </div><div class="content">', soy.$$escapeHtml(soy.$$changeNewlineToBr(opt_data.content)), '</div><span class="pub-time"> ', soy.$$escapeHtml(opt_data.howLongAgo), ' </span><span class="button-container"><a href="#!/author/', soy.$$escapeHtml(opt_data.author), '" class="filter-by-author">Filter by ', soy.$$escapeHtml(opt_data.author), '</a></span>');
  if (!opt_sb) return output.toString();
};


/**
 * @param {Object.<string, *>=} opt_data
 * @param {soy.StringBuilder=} opt_sb
 * @return {string|undefined}
 * @notypecheck
 */
omchat.templates.createMouth = function(opt_data, opt_sb) {
  var output = opt_sb || new soy.StringBuilder();
  output.append('<div><input type="text" class="username"/></div><textarea class="texts"></textarea><div class="status">.</div><button class="say">Say!</button>');
  if (!opt_sb) return output.toString();
};
