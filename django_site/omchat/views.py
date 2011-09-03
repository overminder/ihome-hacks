# Create your views here.

import json
from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response
from comet.api import (create_channel, broadcast_message, cleanup_channel,
        get_appchannel, app_managers)
from omchat.api import ChatRc, dump_rc
from omchat.models import Chat


def index(request):
    # prepare for channel id
    cid = create_channel('omchat')

    # prepare for list of chats
    chat_list = Chat.objects.order_by('-pub_time')[:20]

    return render_to_response('omchat/index.html', {
            'cid': cid,
            'initdata': dump_rc(ChatRc, chat_list),
            'closure_compiled': True
        }, context_instance=RequestContext(request)
    )
    

def comet_stat(request):
    if not request.user.is_authenticated():
        return HttpResponse('Login required.')
    return render_to_response('omchat/comet-stat.html', {
            "app_managers": app_managers
        }, context_instance=RequestContext(request)
    )
    

def json_resp(data=None):
    if data is None:
        data = {}
    return HttpResponse(json.dumps(data), mimetype='application/json')

def err_resp(*argl, **kw):
    errors = {}
    if argl:
        errors['__all__'] = argl
    errors.update(kw)

    return json_resp({
        'errors': errors
    })

def only_allow_post(func):
    def call(req, *argl, **kw):
        return func(req, *argl, **kw)
        if req.method == 'POST': # only allows post
            return func(req, *argl, **kw)
        else:
            return err_resp(method=['only POST is allowed'])
    return call

@only_allow_post
def notify_editing(request):
    """broad this to all channel listeners"""
    author = request.POST.get('author')
    if not author:
        author = request.META['REMOTE_ADDR']
    broadcast_message('omchat', {
        'action': 'chat-editing',
        'data': author
    })
    return json_resp()

@only_allow_post
def notify_editing_done(request):
    """broad this to all channel listeners"""
    author = request.POST.get('author')
    if not author:
        author = request.META['REMOTE_ADDR']
    broadcast_message('omchat', {
        'action': 'chat-editing-done',
        'data': author
    })
    return json_resp()

@only_allow_post
def getcid(request):
    cleanup_channel('omchat')
    return json_resp({
        'cid': create_channel('omchat'),
        'nfds': len(get_appchannel('omchat'))
    })


