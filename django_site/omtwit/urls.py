from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('omtwit.views',
    url(r'^$', 'index', name='index'),
    url(r'^api/', include('omtwit.api')),
)

