
# i expose channels

import time
import json
from collections import deque, OrderedDict

def jsonp_resp(req, data='', nofinish=False):
    func_name = ''.join(req.args.get('callback', []))
    resp = '%s(%s);' % (func_name, data)
    if isinstance(resp, unicode):
        resp = resp.encode('utf-8')
    if nofinish:
        return resp
    else:
        req.setHeader('Content-Type', 'application/javascript')
        req.write(resp)
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
        from twisted.internet import defer
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
                self.client_d.errback(ChannelTimeout())
                self.d_call = None
                self.client_d = None

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

    def iterchannels(self):
        return self.channels.itervalues()

    def __len__(self):
        return len(self.channels)

    def create(self):
        cid = self.cid_gen()
        self.channels[cid] = Channel()
        return cid

    def get(self, cid):
        return self.channels[cid]

    def has(self, cid):
        return cid in self.channels

    def clean_up(self, time_diff=30 * 60):
        to_del = []
        t = time.time()
        for cid, ch in self.channels.iteritems():
            if t - ch.timestamp < time_diff:
                break
            else:
                to_del.append((cid, ch))
        for cid, ch in to_del:
            del self.channels[cid]
            ch.put(None) # in case someone is listening
        return len(to_del)


app_managers = {} # singleton mapper

def create_server_factory():
    from twisted.web import resource, server

    class ChannelHandler(resource.Resource):
        isLeaf = True
        def __init__(self, managers):
            self.managers = managers
            resource.Resource.__init__(self)

        def render_GET(self, request):
            try:
                _, app_ns, cid = request.path.split('/')
            except ValueError:
                return jsonp_resp(request,
                        format_err('invalid url'), True)

            if app_ns not in self.managers:
                return jsonp_resp(request,
                        format_err(app=['no such app']), True)

            channels = self.managers[app_ns]
            if not channels.has(cid):
                return jsonp_resp(request,
                        format_err(app=['no such cid']), True)

            def on_msg_recvd(msg):
                if isinstance(msg, unicode):
                    msg = msg.encode('utf-8')
                jsonp_resp(request, {'msg': msg})

            def on_err_caught(reason):
                if isinstance(reason.value, ChannelException):
                    reason.value.make_request(request)
                else:
                    import traceback
                    jsonp_resp(request, format_err('UnknownError',
                        traceback.format_exc()))

            ch = channels.get(cid)
            d = ch.get()
            d.addCallback(on_msg_recvd)
            d.addErrback(on_err_caught)
            return server.NOT_DONE_YET

    comet_resource = ChannelHandler(app_managers)
    return server.Site(comet_resource)


def init_comet():
    from twisted.internet import reactor
    cm = app_managers['omchat'] = ChannelManager()
    cid = cm.create()
    print cid
    reactor.callLater(5, lambda: cm.get(cid).put('HEHEHE'))

def test():
    from twisted.internet import reactor
    reactor.listenTCP(8080, create_server_factory())
    init_comet()
    reactor.run()

if __name__ == '__main__':
    test()

