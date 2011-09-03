
from comet.api import once

sleep_time = [300] # each 5 minuts
def set_interval(n):
    sleep_time[0] = n

jobs = []

def register(job):
    jobs.append(job)

@once
def start_cron():
    from threading import Thread
    import time
    def call():
        while True:
            time.sleep(sleep_time[0])
            for job in jobs:
                job()

    Thread(target=call).start()            

