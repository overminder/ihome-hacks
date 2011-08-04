require(['tmpl-packed', 'jslib'], function(tmpls) {

    var export = window;

    if (export.app)
        var app = export.app;
    else
        var app = export.app = {};

    /* app.js */
    app.name = 'omchat';
    if (location.pathname.search('/~ch_jyx') == 0) {
        app.script_prefix = '/~ch_jyx';
        app.comet_server = 'http://ihome.ust.hk:8443';
    }
    else {
        app.script_prefix = '';
        app.comet_server = 'http://localhost:8443';
    }

    var notify_editing = function(name) {
        $.post(app.script_prefix + '/omchat/notify-editing', {
            author: name
        });
    };

    /* channel.js */
    var Channel = app.Channel = function(opt) {
        this.cid = opt.cid;
        this.endpoint = app.comet_server + '/' + app.name + '/' + this.cid;
        _.extend(this, Backbone.Events);
    };

    Channel.prototype = {
        _fetch: function() {
            if (this.stopped)
                return;  /* don't do anything if we are stopped */

            var self = this;
            var dfd = $.ajax({
                url: this.endpoint,
                dataType: 'jsonp'
            });
            dfd.done(function(resp) {

                if (resp.errors) {
                    var errors = resp.errors;
                    if (errors.__all__ &&
                        errors.__all__[0] == 'ChannelTimeout') {
                        /* re-fetch in the next event loop */
                        self._fetch();
                    }
                    else {
                        /* errors that we cannot handle. */
                        self.trigger('error', errors);
                    }
                }
                else {
                    /* got message: fetch again */
                    self.trigger('msg', resp.msg);
                    self._fetch();
                }
            });
        },

        connect: function() {
            if (this.conn_established)
                return;
            var self = this;
            this.conn_established = true;
            this._fetch();
        }
    };

    /* models.js */
    var Chat = app.Chat = Backbone.RelationalModel.extend({
        relations: [
            {
                key: 'is_reply_to',
                type: Backbone.HasOne,
                relatedModel: 'app.Chat',
                relatedCollection: 'app.ChatColl',
                includeInJSON: Backbone.Model.prototype.idAttribute,
                reverseRelation: {
                    key: 'replies',
                    type: Backbone.HasMany,
                    includeInJSON: false
                }
            }
        ]
    });

    var ChatColl = app.ChatColl = Backbone.Collection.extend({
        model: Chat,
        url: app.script_prefix + '/omchat/api/v1/chat/'
    });

    var chat_coll = app.chat_coll = new ChatColl;

    /* views.js */
    var ChatItemView = Backbone.View.extend({
        tagName: 'li',
        template: tmpls.chat.item,
        initialize: function() {
            _.bindAll(this);
            this.model.bind('change', this.render);
        },
        render: function() {
            $(this.el).html(this.template({
                model: this.model
            }));
            return this;
        }
    });

    var ChatListView = Backbone.View.extend({
        initialize: function(opt) {
            _.bindAll(this);
            this.view_class = opt.view_class;
            this.collection.bind('add', this.add_one);
            this.collection.bind('reset', this.add_all);
            this.list_sel = opt.list_sel || ' > ul';
        },
        add_one: function(model) {
            var itemview = new this.view_class({
                model: model
            });
            this.$(this.list_sel).append(itemview.render().el);
            $('#chat-list').prop('scrollTop', 99999);  /* dirty hack... */
        },
        add_all: function() {
            this.collection.each(this.add_one);
        }
    });

    var UserListView = Backbone.View.extend({
        template: tmpls.chat.active_users,
        initialize: function(opt) {
            _.bindAll(this);
            this.collection.bind('all', this.render);
        },
        render: function() {
            this.$(' > ul').html(this.template({
                coll: this.collection
            }));
        }
    });


    $(function() {
        $('#chat-list .last-pub-time').hide();

        var curr_editing_author = null;
        var show_remote_editing = function(author) {
            curr_editing_author = author;
            if (author) {
                $('#mouth .status').css('visibility', 'visible')
                                   .text(author + ' is editing...');
            }
            else {
                $('#mouth .status').css('visibility', 'hidden');
            }
        };

        var set_last_time = function(time) {
            $('#chat-list .last-pub-time').show();
            var now = new Date();
            var then = new Date(time);
            if (now.getDay() != then.getDay() || now - then >= 60 * 60 * 24) {
                /* is not the same day */
                var fmt = then.toLocaleDateString() + ' ' + then.toLocaleTimeString();
            }
            else {
                var fmt = then.toLocaleTimeString();
            }
            $('#chat-list .last-pub-time > .time').text(fmt);
        };

        chat_coll.bind('add', function(model) {
            if (model.get('pub_time'))
                set_last_time(model.get('pub_time'));
        });

        $('body').delegate('a.local-nav', 'click', function(e) {
            e.preventDefault();
            var el = $(this);
            var href = el.attr('href');
            if (href[0] == '#') {
                Backbone.history.navigate(href, true);
            }
        });

        var form = $('#mouth');
        form.find('button').click(function() {
            var chat = new Chat({
                content: form.find('textarea').val(),
                author: form.find('input').val()
            });
            form.find('textarea').val('');
            form.attr('disabled', true);

            chat_coll.add(chat);
            chat.save().done(function() {
                form.attr('disabled', '');
            });
        });

        form.find('textarea').keydown(function(e) {
            if (form.find('textarea').val() == '') {
                notify_editing(form.find('input').val());
            }
            if (e.keyCode == 13) {
                form.find('button').trigger('click');
                return false;
            }
        });

        var chat_listview = new ChatListView({
            el: $('#chat-list'),
            collection: chat_coll,
            view_class: ChatItemView
        });

        var user_listview = new UserListView({
            el: $('#onlines'),
            collection: chat_coll
        });

        var ch = app.ch = new Channel({
            cid: app.cid
        });

        ch.bind('msg', function(msg) {
            var action = msg.action;
            if (action == 'chat:created') {
                var obj = JSON.parse(msg.data);
                if (chat_coll.get(obj.resource_uri)) {
                    chat_coll.get(obj.resource_uri).set(obj);
                }
                else {
                    var obj_list = {
                        objects: obj
                    };
                    chat_coll.add(chat_coll.parse(obj_list));
                }
                set_last_time(obj.pub_time);
                if (obj.author == curr_editing_author)
                    show_remote_editing(false);
            }
            else if (action == 'chat:editing') {
                var author = msg.data;
                if (author == form.find('input').val())
                    return;
                else
                    show_remote_editing(author);
            }
        });

        ch.bind('error', function(errors) {
            console.warn(errors);
        });

        ch.connect();
        chat_coll.add(chat_coll.parse(app.initdata));
    });
});
