from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('omchat.views',
    url(r'^$', 'index'),
    url(r'^getcid', 'getcid'),
    url(r'^bind', 'binder'),
    url(r'^send', 'sendto'),
    url(r'^broadcast', 'broadcast'),
)

