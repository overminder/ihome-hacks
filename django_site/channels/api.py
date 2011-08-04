
from collections import OrderedDict
import Queue
import time

class ChannelException(Exception):
    pass

class FetchTimeout(ChannelException):
    pass

class NoSuchChannel(ChannelException):
    pass

class ChannelOccupied(ChannelException):
    pass

class Channel(object):
    """although semaphore is much more efficient, blocking queue has a nice
    trait that it can pass data *while* being synchorized"""
    def __init__(self):
        self.timestamp = time.time()
        self.data_queue = Queue.Queue()
        self.occupied = False

    def publish_data(self, data):
        self.data_queue.put(data)

    def fetch_data(self, block=True, timeout=60):
        if self.occupied:
            raise ChannelOccupied
        self.occupied = True

        try: # synchornize?
            return self.data_queue.get(block, timeout)
        except Queue.Empty:
            raise FetchTimeout
        finally:
            self.occupied = False


class ChannelManager(object):
    def __init__(self):
        self.channels = OrderedDict()
        self.next_cid = 1

    def __len__(self):
        return len(self.channels)

    def clean_up(self, time_diff=30 * 60):
        # clean up those with time_diff > 30 minutes
        # this can be done using cron
        to_del = []
        t = time.time()
        for cid, ch in self.channels.iteritems():
            if t - ch.timestamp < time_diff:
                break
            else:
                to_del.append((cid, ch))
        for cid, ch in to_del:
            del self.channels[cid]
            ch.publish_data(None) # in case someone is listening
        return len(to_del)

    def create_one(self):
        cid = self.next_cid
        self.next_cid += 1
        self.channels[cid] = Channel()
        return cid

    def get_channel(self, cid):
        try:
            return self.channels[cid]
        except KeyError:
            raise NoSuchChannel(cid)

    def has_channel(self, cid):
        return cid in self.channels

    def broadcast(self, data):
        """send message to everyone"""
        for ch in self.channels.itervalues():
            ch.publish_data(data)

