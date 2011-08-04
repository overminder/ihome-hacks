from django.db import models
from django.db.models import signals

# Create your models here.

class Chat(models.Model):
    author = models.CharField(max_length=63)
    content = models.CharField(max_length=255)
    is_reply_to = models.ForeignKey('self', related_name='replies',
            null=True, blank=True)
    pub_time = models.DateTimeField(auto_now_add=True)

def on_chat_saved(sender, instance, **kw):
    if kw.get('created'):
        from comet.api import broadcast_message
        from omchat.api import ChatRc, dump_rc
        broadcast_message('omchat', {
            'action': 'chat:created',
            'data': dump_rc(ChatRc, instance)
        })

signals.post_save.connect(on_chat_saved, sender=Chat)

