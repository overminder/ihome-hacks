# Create your views here.

import json
from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response

from comet.api import (create_channel, send_message, broadcast_message,
        get_appchannel)

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

def index(request):
    return render_to_response('omchat/index.html', {
        }, context_instance=RequestContext(request)
    )

def only_allow_post(func):
    def call(req, *argl, **kw):
        return func(req, *argl, **kw)
        if req.method == 'POST': # only allows post
            return func(req, *argl, **kw)
        else:
            return err_resp(method=['only POST is allowed'])
    return call

@only_allow_post
def getcid(request):
    return json_resp({
        'cid': create_channel('omchat'),
        'nfds': len(get_appchannel('omchat'))
    })

@only_allow_post
def broadcast(request):
    broadcast_message('omchat', request.POST.get('msg'))
    return json_resp()

