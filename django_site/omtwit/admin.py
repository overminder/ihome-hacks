from django.contrib.admin import site, ModelAdmin
from omtwit.models import OmUser, Twit, InfoStream
from django.contrib.contenttypes import generic

class OmUserAdmin(ModelAdmin):
    model = OmUser
    list_display = ('nickname', 'base')

class InfoStreamInline(generic.GenericInlineModelAdmin):
    model = InfoStream

class TwitAdmin(ModelAdmin):
    model = Twit
    list_display = ('author', 'content', 'pub_time', 'is_reply_to')
    list_filter = ('pub_time',)

site.register(OmUser, OmUserAdmin)
site.register(Twit, TwitAdmin)
site.register(InfoStream)

