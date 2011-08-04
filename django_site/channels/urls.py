
from django.conf.urls.defaults import patterns, include, url

urlpatterns = patterns('channels.views',
    url(r'^$', 'create_ch'),
    url(r'^get/(?P<cid>\d+)', 'get_data'),
    url(r'^pub/(?P<cid>\d+)', 'publish_data'),
    url(r'^clean', 'clean_up'),
)
