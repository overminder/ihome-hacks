# Create your views here.
from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response

def index(req):
    return render_to_response('frontpage/index.html', {
            
        }, context_instance=RequestContext(req)
    )
    
