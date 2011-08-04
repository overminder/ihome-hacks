
# i expose channels

import time
import json
from collections import deque, OrderedDict
from twisted.internet import defer
from twisted.web import resource, server

def jsonp_resp(req, data=''):
    func_name = ''.join(req.args.get('callback', []))
    req.write('%s(%s);' % (func_name, data))
    req.finish()

def format_err(*argl, **kw):
    err = {}
    if argl:
        err['__all__'] = argl
    err.update(kw)
    return json.dumps({
        'errors': err
    })

class ChannelException(Exception):
    def make_request(self, req):
        jsonp_resp(req, format_err('ChannelException'))

class ChannelOccupied(ChannelException):
    def make_request(self, req):
        jsonp_resp(req, format_err('ChannelOccupied'))

class ChannelTimeout(ChannelException):
    def make_request(self, req):
        jsonp_resp(req, format_err('ChannelTimeout'))

class Channel(object):
    def __init__(self):
        self.data_queue = deque()
        self.t_created = time.time()
        self.client_d = None
        self.d_call = None

    def put(self, data):
        if self.client_d:
            self.client_d.callback(data)
            self.d_call.cancel()
            self.d_call = None
            self.client_d = None
        else:
            self.data_queue.append(data)

    def get(self, timeout=60):
        if self.client_d:
            # one channel can only have one binding
            return defer.fail(ChannelOccupied())
        if self.data_queue:
            # data exists, callback now
            return defer.succeed(self.data_queue.popleft())
        else:
            # wait for timeout seconds.
            self.client_d = defer.Deferred()

            def on_timeout():
                self.d_call = None
                self.client_d = None
                return ChannelTimeout()

            from twisted.internet import reactor
            self.d_call = reactor.callLater(timeout, on_timeout)
            return self.client_d


class ChannelManager(object):
    def __init__(self, cid_gen=None):
        self.channels = OrderedDict()
        if not cid_gen:
            import random
            def cid_gen():
                gen = lambda: '%016x' % random.getrandbits(128)
                key = gen()
                while key in self.channels:
                    key = gen()
                return key
        self.cid_gen = cid_gen

    def create(self):
        cid = self.cid_gen()
        self.channels[cid] = Channel()
        return cid

    def get(self, cid):
        return self.channels[cid]

    def has(self, cid):
        return cid in self.channels


class ChannelHandler(resource.Resource):
    isLeaf = True
    def __init__(self, managers):
        self.managers = managers
        resource.Resource.__init__(self)

    def render_GET(self, request):
        try:
            _, app_ns, cid = request.path.split('/')
            if app_ns not in self.managers:
                raise ValueError
            channels = self.managers[app_ns]
            if not channels.has(cid):
                raise ValueError
            ch = channels.get(cid)
        except ValueError:
            return ''

        def on_msg_recvd(msg):
            jsonp_resp(request, msg)

        def on_err_caught(reason):
            if isinstance(reason, ChannelException):
                reason.make_request(request)
            else:
                jsonp_resp(request, format_err('UnknownError'))

        ch.get().addCallback(on_msg_recvd)
        return server.NOT_DONE_YET

app_managers = {}
comet_resource = ChannelHandler(app_managers)
factory = server.Site(comet_resource)

def init_comet():
    from twisted.internet import reactor
    cm = app_managers['omchat'] = ChannelManager()
    cid = cm.create()
    print cid
    reactor.callLater(5, lambda: cm.get(cid).put('HEHEHE'))

def test():
    from twisted.internet import reactor
    reactor.listenTCP(8080, factory)
    init_comet()
    reactor.run()

if __name__ == '__main__':
    test()

