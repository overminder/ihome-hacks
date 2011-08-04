/* general javascript librarys.
 *
 * includes jQuery, Backbone and friends, underscore
 */
(function() {
    /* what do i depend on */
    var dependencies = [
        'backbone-relational',
        'backbone-tastypie'
    ];

    /* module defination */
    return define(dependencies, function() {

    /* what do i provide */
    var make_module = function() {

        /* to make sure csrf is sent when posting.
           source: django.com, 2011 Feb */
        var regex1 = /^http:.*/;
        var regex2 = /^https:.*/;
        var csrf_token = (function() {
            var cookies = document.cookie.split('; ');
            for (var i = 0; i < cookies.length; ++i) {
                var kv = cookies[i].split('=');
                if (kv.length == 2 && kv[0] == 'csrftoken')
                    return kv[1];
            }
        })();
        $.ajaxSetup({
            beforeSend: function(xhr, settings) {
                if (!(regex1.test(settings.url) || regex2.test(settings.url)))
                    /* Only send the token to relative URLs i.e. locally. */
                    xhr.setRequestHeader("X-CSRFToken", csrf_token);
            }
        });

        return {
            $: jQuery,
            _: _,
            Backbone: Backbone
        };
    };

    return make_module();

    });  /* \define */

})();
