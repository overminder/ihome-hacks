define(["underscore-template-autoescape"], function() {
return (function() {
var __root_module = {};
(function() {
var __curr_module = {};
__root_module.chat = __curr_module;
__curr_module.simple_display = _.template("<li class=\"chat\"> <h3><%= msg.type %></h3> <div><%= msg.timestamp %></div> <div><%= msg.content %></div> </li>");
__curr_module.simple_err = _.template("<h3>Error</h3> <% _.each(errors, function(val, key) { %> <div><%= key %>: <%= val %></div> <hr />  <% }); %> ");
})();
return __root_module;})();
;
});
