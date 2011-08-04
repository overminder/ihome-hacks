
from django.http import HttpResponse
from channels.api import ChannelManager

# for test only.
ch_manager = ChannelManager()

def create_ch(request):
    return HttpResponse(str(ch_manager.create_one()))

def get_data(request, cid):
    cid = int(cid)
    return HttpResponse(str(ch_manager.get_channel(cid).fetch_data()))

def publish_data(request, cid):
    cid = int(cid)
    ch_manager.get_channel(cid).publish_data(request.GET.get('data'))
    return HttpResponse('ok')

def clean_up(request):
    ncleans = ch_manager.clean_up()
    return HttpResponse(str(ncleans))

