#!/usr/bin/env python
"""copied from http://nedbatchelder.com/blog/201103/\
quick_and_dirty_multithreaded_django_dev_server.html"""

from django.core.management import execute_manager
import imp
try:
    imp.find_module('settings') # Assumed to be in the same directory.
except ImportError:
    import sys
    sys.stderr.write("Error: Can't find the file 'settings.py' in the directory containing %r. It appears you've customized things.\nYou'll have to run django-admin.py, passing it your settings module.\n" % __file__)
    sys.exit(1)

import settings

def monkey_patch_for_multi_threaded():
    # This monkey-patches BaseHTTPServer to create a base HTTPServer class that 
    # supports multithreading 
    import BaseHTTPServer, SocketServer  
    OriginalHTTPServer = BaseHTTPServer.HTTPServer

    class ThreadedHTTPServer(SocketServer.ThreadingMixIn, OriginalHTTPServer):  
        def __init__(self, server_address, RequestHandlerClass=None):  
            OriginalHTTPServer.__init__(self, server_address, RequestHandlerClass)  

    BaseHTTPServer.HTTPServer = ThreadedHTTPServer

if __name__ == "__main__":
    monkey_patch_for_multi_threaded()
    execute_manager(settings)

