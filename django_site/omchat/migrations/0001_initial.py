# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Chat'
        db.create_table('omchat_chat', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('author', self.gf('django.db.models.fields.CharField')(max_length=63)),
            ('content', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('is_reply_to', self.gf('django.db.models.fields.related.ForeignKey')(related_name='replies', to=orm['omchat.Chat'])),
            ('pub_time', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('omchat', ['Chat'])


    def backwards(self, orm):
        
        # Deleting model 'Chat'
        db.delete_table('omchat_chat')


    models = {
        'omchat.chat': {
            'Meta': {'object_name': 'Chat'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '63'}),
            'content': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_reply_to': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'replies'", 'to': "orm['omchat.Chat']"}),
            'pub_time': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['omchat']
