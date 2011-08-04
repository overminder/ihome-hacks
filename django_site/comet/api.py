
from comet.exposer import ChannelManager, app_managers, factory

def create_channel(app_name):
    if app_name not in app_managers:
        cm = app_managers[app_name] = ChannelManager
    else:
        cm = app_managers[app_name]
    cid = cm.create()
    return cid

def send_message(app_name, cid, message):
    app_managers[app_name].get(cid).put(message)

def once(func):
    retval = []
    def call(*argl, **kw):
        if not retval:
            retval.append(func(*argl, **kw))
        return retval[0]
    return call

@once
def start_server(port):
    from threading import Thread
    def call():
        from twisted.internet import reactor
        reactor.listenTCP(port, factory)
        reactor.run(installSignalHandlers=0) # we are in thread
    th = Thread(target=call)
    th.start()

