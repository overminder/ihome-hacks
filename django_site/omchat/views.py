# Create your views here.

import json
from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response

from channels.api import (ChannelManager, NoSuchChannel, FetchTimeout,
        ChannelOccupied)

chman = ChannelManager()

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
        if req.method == 'POST': # only allows post
            return func(req, *argl, **kw)
        else:
            return err_resp(method=['only POST is allowed'])
    return call

@only_allow_post
def getcid(request):
    chman.clean_up()
    return json_resp({
        'cid': chman.create_one(),
        'nchannels': len(chman)
    })

@only_allow_post
def binder(request):
    cid = request.POST.get('cid', None)
    if cid is None:
        return err_resp(cid=['have\'nt received a channel id'])
    try:
        ch = chman.get_channel(int(cid))
    except (ValueError, NoSuchChannel):
        return err_resp(cid=['no such channel id -- %s' % cid])
    try:
        return json_resp({
            'msg': ch.fetch_data()
        })
    except FetchTimeout:
        return err_resp(timeout=True)
    except ChannelOccupied:
        return err_resp(occupied=True)

@only_allow_post
def sendto(request):
    cid = request.POST.get('cid')
    try:
        ch = chman.get_channel(int(cid))
    except (ValueError, NoSuchChannel):
        return err_resp(cid=['no such channel id -- %s' % cid])
    ch.publish_data(request.POST.get('msg'))
    return json_resp()

@only_allow_post
def broadcast(request):
    chman.broadcast(request.POST.get('msg'))
    return json_resp()

