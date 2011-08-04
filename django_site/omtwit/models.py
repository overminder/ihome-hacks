from django.db import models
from django.db.models import signals
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic

# Create your models here.

class OmUser(models.Model):
    base = models.OneToOneField(User, related_name='omuser')
    nickname = models.CharField('verbose name', max_length=63)
    following = models.ManyToManyField('self', related_name='followers',
            symmetrical=False, blank=True)

    def __unicode__(self):
        return self.nickname


class Twit(models.Model):
    author = models.ForeignKey(OmUser, related_name='twits_published')
    content = models.CharField(max_length=255)
    pub_time = models.DateTimeField('publish time', auto_now_add=True)
    is_reply_to = models.ForeignKey('self', related_name='replies',
            null=True, blank=True)

    def __unicode__(self):
        return u'#<Twit author=%s content=%s>' % (self.author, self.content)

twit_type = ContentType.objects.get_for_model(Twit)

class InfoStream(models.Model):
    owner = models.ForeignKey(OmUser, related_name='streams')
    pub_time = models.DateTimeField('publish time', auto_now_add=True)
    content_type = models.ForeignKey(ContentType)
    content_object = generic.GenericForeignKey('content_type', 'object_id')
    object_id = models.PositiveIntegerField()

    def __unicode__(self):
        return unicode(self.content_object)

def twit_created_callback(sender, instance, **kw):
    if kw.get('created'):
        for follower in instance.author.followers.all():
            InfoStream.objects.create(owner=follower, content_object=instance)
signals.post_save.connect(twit_created_callback, sender=Twit)

def twit_deleted_callback(sender, instance, **kw):
    for stream in InfoStream.objects.filter(content_type=twit_type,
            object_id=instance.pk):
        stream.delete()
signals.pre_delete.connect(twit_deleted_callback, sender=Twit)

