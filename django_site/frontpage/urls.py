from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('frontpage.views',
    url(r'^$', 'index'),
)

