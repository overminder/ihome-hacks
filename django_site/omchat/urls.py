from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('omchat.views',
    url(r'^$', 'index'),
    url(r'^comet-stat$', 'comet_stat'),
    url(r'^notify-editing$', 'notify_editing'),
    url(r'^api/', include('omchat.api')),
)

