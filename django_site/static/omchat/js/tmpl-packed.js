define(["underscore-template-autoescape"], function() {
return (function() {
var __root_module = {};
(function() {
var __curr_module = {};
__root_module.chat = __curr_module;
__curr_module.active_users = _.template("<% var unique_authors = {}; coll.each(function(model) { var author = model.get('author'); if (unique_authors[author]) return; else unique_authors[author] = true; %> <li><a class=\"local-nav\" href=\"#!/author/<%= author %>\"> <%= author %> </a></li>  <% }); %>");
__curr_module.simple_display = _.template("<li class=\"chat\"> <h3><%= msg.type %></h3> <div><%= msg.timestamp %></div> <div><%= msg.content %></div> </li>");
__curr_module.simple_err = _.template("<h3>Error</h3> <% _.each(errors, function(val, key) { %> <div><%= key %>: <%= val %></div> <hr />  <% }); %> ");
__curr_module.item = _.template("<span class=\"author\"> <a class=\"local-nav\" href=\"#!/author/<%= model.get('author') %>\"> <%= model.get('author') %>: </a> </span>  <div class=\"content\"> <%= model.get('content') %> </div>  ");
})();
return __root_module;})();
;
});
