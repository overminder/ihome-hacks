# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Changing field 'Chat.is_reply_to'
        db.alter_column('omchat_chat', 'is_reply_to_id', self.gf('django.db.models.fields.related.ForeignKey')(null=True, to=orm['omchat.Chat']))


    def backwards(self, orm):
        
        # User chose to not deal with backwards NULL issues for 'Chat.is_reply_to'
        raise RuntimeError("Cannot reverse this migration. 'Chat.is_reply_to' and its values cannot be restored.")


    models = {
        'omchat.chat': {
            'Meta': {'object_name': 'Chat'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '63'}),
            'content': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_reply_to': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'replies'", 'null': 'True', 'to': "orm['omchat.Chat']"}),
            'pub_time': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['omchat']
