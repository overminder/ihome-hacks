require(['jslib'], function() {

    /* app.js */
    if (location.pathname.search('/~ch_jyx') == 0) {
        var script_prefix = '/~ch_jyx';
    }
    else {
        var script_prefix = '';
    }

    /* models.js */
    var OmUser = Backbone.RelationalModel.extend({
        relations: [
            {
                key: 'following',
                type: Backbone.HasMany,
                relatedModel: 'OmUser',
                relatedCollection: 'OmUserColl',
                includeInJSON: false,
                reversedRelation: {
                    key: 'followers',
                    type: Backbone.HasMany,
                    includeInJSON: false
                }
            }
        ]
    });
    window.OmUser = OmUser;

    var OmUserColl = Backbone.Collection.extend({
        model: OmUser,
        url: script_prefix + '/omtwit/api/v1/omuser/'
    });
    window.OmUserColl = OmUserColl;

    var Twit = Backbone.RelationalModel.extend({
        relations: [
            {
                key: 'author',
                type: Backbone.HasOne,
                relatedModel: OmUser,
                relatedCollection: OmUserColl,
                includeInJSON: Backbone.Model.prototype.idAttribute
            },
            {
                key: 'is_reply_to',
                type: Backbone.HasOne,
                relatedModel: 'Twit',
                relatedCollection: 'TwitColl',
                includeInJSON: Backbone.Model.prototype.idAttribute,
                reverseRelation: {
                    key: 'replies',
                    type: Backbone.HasMany,
                    includeInJSON: Backbone.Model.prototype.idAttribute
                }
            },
        ]
    });
    window.Twit = Twit;
    var TwitColl = Backbone.Collection.extend({
        model: Twit,
        url: script_prefix + '/omtwit/api/v1/twit/'
    });
    window.TwitColl = TwitColl;

    var twit_coll = window.twit_coll = new TwitColl;
    twit_coll.reset(twit_coll.parse(app.initdata));

    var first_twit = twit_coll.models[0];
    $.when.apply(null, first_twit.fetchRelated('author')).done(function() {
        first_twit.save({
            'content': 'current length = ' + twit_coll.length
        });
        twit_coll.create({
            'author': first_twit.get('author'),
            'content': String(new Date),
            'is_reply_to': first_twit
        });
    });

    $(function() {
        $('body').append($('<h1>Hello world!</h1>'));
    });
});
