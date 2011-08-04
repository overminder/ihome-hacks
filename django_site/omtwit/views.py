# Create your views here.

import json
import urllib
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth import (authenticate, login as auth_login,
        logout as auth_logout)
from omtwit.api import TwitRc, dump_rc
from omtwit.models import Twit


def index(request):
    return render_to_response('omtwit/index.html', {
            'initdata': dump_rc(TwitRc, Twit.objects.all()),
        }, context_instance=RequestContext(request)
    )


def make_json_resp(text=None):
    if text is None:
        text = {}
    return HttpResponse(json.dumps(text), mimetype='application/json')

def make_iframe_resp(text=None):
    """in case there is some bad things... we must encode uri"""
    if text is None:
        text = {}
    return HttpResponse('<div class="result">%s</div>' % urllib.quote(
        json.dumps(text)))

def login(request):
    if request.method == 'POST':
        user = authenticate(username=request.POST.get('username'),
                password=request.POST.get('password'))
        if user is not None:
            auth_login(request, user)
        else:
            return make_json_resp({
                'errors': {
                    '__all__': ['authentication failed']
                }
            })
    return make_json_resp()

def logout(request):
    if request.method == 'POST':
        auth_logout(request)
    return make_json_resp()

