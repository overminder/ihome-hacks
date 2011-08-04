
from django.contrib.admin import site, ModelAdmin
from omchat.models import Chat

class ChatAdmin(ModelAdmin):
    list_display = ('author', 'pub_time', 'content')

site.register(Chat, ChatAdmin)
