require(['tmpl-packed', 'jslib'], function(tmpls) {

    var app = window.app = {}

    /* app.js */
    if (location.pathname.search('/~ch_jyx') == 0) {
        app.script_prefix = '/~ch_jyx';
    }
    else {
        app.script_prefix = '';
    }

    /* channel.js */

    var Channel = app.Channel = function(opt) {
        this.endpoint = opt.endpoint;
        this.cid = opt.cid;
        _.extend(this, Backbone.Events);
    };

    Channel.prototype = {
        _fetch: function() {
            if (this.stopped)
                return;  /* don't do anything if we are stopped */

            var self = this;
            var dfd = $.post(this.endpoint, {
                cid: this.cid
            }, null, 'json');
            dfd.done(function(resp) {
                if (resp.errors) {
                    var errors = resp.errors;
                    if (errors.timeout) {
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

    app.send_msg = function(msg, cid) {
        $.post(app.script_prefix + '/omchat/send', {
            cid: cid,
            msg: JSON.stringify(msg)
        });
    };

    app.broadcast = function(msg) {
        $.post(app.script_prefix + '/omchat/broadcast', {
            msg: JSON.stringify(msg)
        });
    };

    $(function() {
        var chat_list = $('#chat-list');
        var cutoff = function() {
            while (chat_list.children().length > 10)
                chat_list.children().eq(-1).remove();
        };

        var form = $('#chat-form');
        form.find('button').click(function() {
            app.broadcast({
                type: 'broadcast',
                content: form.find('textarea').val(),
                timestamp: new Date
            });
        });

        $.post(app.script_prefix + '/omchat/getcid', {}, function(resp) {
            var ch = app.ch = new Channel({
                endpoint: app.script_prefix + '/omchat/bind',
                cid: resp.cid
            });

            ch.bind('msg', function(msg) {
                $(tmpls.chat.simple_display({
                    msg: JSON.parse(msg)
                })).prependTo(chat_list);
                cutoff();
            });

            ch.bind('error', function(errors) {
                $(tmpls.chat.simple_err({
                    errors: errors
                })).prependTo(chat_list);
                cutoff();
            });

            ch.connect();

        }, 'json');
    });
});
