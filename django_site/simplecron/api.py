
from comet.api import once

jobs = []

def register(job):
    jobs.append(job)

@once
def start_cron():
    from threading import Thread
    import time
    def call():
        while True:
            time.sleep(300) # each 5 minuts
            for job in jobs:
                job()
    Thread(target=call).start()            

