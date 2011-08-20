
# i expose channels

import time
import json
from collections import deque, OrderedDict

def jsonp_resp(request, data=None, nofinish=False):
    """response with the given data.
    if nofinish is True, don't finish request.

    Note that json.dumps will return a bytearray, which is very good."""
    func_name = ''.join(request.args.get('callback', []))
    response = '%s(%s);' % (func_name, json.dumps(data))
    if nofinish:
        return response
    else:
        if not request._disconnected:
            request.setHeader('Content-Type', 'application/javascript; charset=utf-8')
            request.write(response)
            request.finish()

def stream_resp(request, data=None):
    func_name = ''.join(request.args.get('callback', []))
    #response = '<script type="text/javascript">%s(%s);</script>' % (
    #        func_name, json.dumps(data))
    response = '%s(%s);' % (func_name, json.dumps(data))
    if not request._disconnected:
        request.write(response)
        request.write('\r\n')


def format_err(*argl, **kw):
    err = {}
    if argl:
        err['__all__'] = argl
    err.update(kw)
    return {
        'errors': err
    }


class ChannelException(Exception):
    def make_request(self, req):
        jsonp_resp(req, format_err('ChannelException'))

class ChannelOccupied(ChannelException):
    def make_request(self, req):
        jsonp_resp(req, format_err('ChannelOccupied'))

class ChannelTimeout(ChannelException):
    def make_request(self, req):
        jsonp_resp(req, format_err('ChannelTimeout'))

class ChannelDead(ChannelException):
    def make_request(self, req):
        jsonp_resp(req, format_err('ChannelDead'))


class Channel(object):
    def __init__(self, cid, parent):
        self.cid = cid
        self.parent = parent
        self.data_queue = deque()
        self.timestamp = time.time()
        self.client_d = None # used to callback
        self.d_call = None   # the timeout canceller

    def put(self, data):
        """data must be a json-encodable object.
        will be wrapped in {msg: data} when doing response
        
        TODO: lock."""
        self.parent.refresh(self)
        if self.client_d:
            self.client_d.callback(data)
            if self.d_call:
                self.d_call.cancel()
                self.d_call = None
            self.client_d = None
        else:
            self.data_queue.append(data)

    def get(self, timeout=60):
        self.parent.refresh(self)
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

            if timeout:
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

        try:
            from simplecron.api import register, start_cron
            register(self.clean_up)
            start_cron()
        except ImportError:
            pass

    def iterchannels(self):
        return self.channels.itervalues()

    def __len__(self):
        return len(self.channels)

    def create(self):
        cid = self.cid_gen()
        self.channels[cid] = Channel(cid, parent=self)
        return cid

    def refresh(self, ch):
        cid = ch.cid
        del self.channels[cid]
        self.channels[cid] = ch
        ch.timestamp = time.time()

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
            if ch.client_d:
                ch.client_d.errback(ChannelDead())
        return len(to_del)


app_managers = {} # singleton mapper

def create_server_factory():
    from twisted.web import resource, server

    class ChannelHandler(resource.Resource):
        """we have two kinds of listening request:
        /app_ns/cid/once?callback=cb
        /app_ns/cid/bind?callback=cb
        ...i think maybe we just use 'once' only.
        """
        isLeaf = True
        def __init__(self, managers):
            self.managers = managers
            resource.Resource.__init__(self)

        def handle_once(self, request, ch):
            d = ch.get()

            def on_msg_recvd(msg):
                jsonp_resp(request, {'msg': msg})

            def on_err_caught(reason):
                if isinstance(reason.value, ChannelException):
                    reason.value.make_request(request)
                else:
                    import traceback
                    jsonp_resp(request, format_err('UnknownError',
                        traceback.format_exc()))

            d.addCallback(on_msg_recvd)
            d.addErrback(on_err_caught)
            return server.NOT_DONE_YET

        def handle_bind(self, request, ch):
            def send_once():
                d = ch.get(0) # no timeout
                def on_msg_recvd(msg):
                    stream_resp(request, {'msg': msg})
                    send_once()

                def on_err_caught(reason):
                    if isinstance(reason.value, ChannelException):
                        reason.value.make_request(request)
                    else:
                        import traceback
                        jsonp_resp(request, format_err('UnknownError',
                            traceback.format_exc()))

                d.addCallback(on_msg_recvd)
                d.addErrback(on_err_caught)
            send_once()
            return server.NOT_DONE_YET

        def render_GET(self, request):
            try:
                _, app_ns, cid, action = request.path.split('/')
            except ValueError:
                return jsonp_resp(request,
                        format_err('invalid url'), True)

            if app_ns not in self.managers:
                return jsonp_resp(request,
                        format_err(app=['no such app']), True)

            if action not in ('once',):
                return jsonp_resp(request,
                        format_err(action=[
                        'supported actions are: ["once"]']))

            channels = self.managers[app_ns]
            if not channels.has(cid):
                return jsonp_resp(request,
                        format_err(app=['no such cid']), True)

            ch = channels.get(cid)
            return getattr(self, 'handle_' + action)(request, ch)


    comet_resource = ChannelHandler(app_managers)
    return server.Site(comet_resource)


def test():
    port = 8443
    from twisted.internet import pollreactor
    pollreactor.install()
    from twisted.internet import reactor
    reactor.listenTCP(port, create_server_factory())

    cm = app_managers['x'] = ChannelManager()
    cid = cm.create()
    ch = cm.get(cid)
    print 'cid = %s' % cid

    # and add some things
    def add_one():
        import time
        msg = {
            'time': time.time()
        }
        print 'put %r' % msg
        ch.put(msg)
        reactor.callLater(1, add_one)
    reactor.callLater(1, add_one)

    reactor.run()

if __name__ == '__main__':
    test()

