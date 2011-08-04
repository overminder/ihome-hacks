
from comet.exposer import ChannelManager, app_managers, create_server_factory

def get_appchannel(app_name):
    if app_name not in app_managers:
        cm = app_managers[app_name] = ChannelManager()
    else:
        cm = app_managers[app_name]
    return cm

def create_channel(app_name):
    cm = get_appchannel(app_name)
    cid = cm.create()
    return cid

def cleanup_channel(app_name):
    cm = get_appchannel(app_name)
    cm.clean_up()

def send_message(app_name, cid, message):
    get_appchannel(app_name).get(cid).put(message)

def broadcast_message(app_name, message): # huh..
    for ch in list(get_appchannel(app_name).iterchannels()):
        ch.put(message)

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
        from twisted.internet import pollreactor
        pollreactor.install()
        from twisted.internet import reactor
        reactor.listenTCP(port, create_server_factory())
        reactor.run(installSignalHandlers=0) # we are in thread
    th = Thread(target=call)
    th.start()

