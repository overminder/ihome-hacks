from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'django_site.views.home', name='home'),
    url(r'^omtwit/', include('django_site.omtwit.urls')),
    url(r'^omchat/', include('django_site.omchat.urls')),

    url(r'^channels/', include('django_site.channels.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)

from comet.api import start_server
start_server(8443)

