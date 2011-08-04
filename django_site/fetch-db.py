import os
import sys
from ompkg.ihomerpc.rpc_master import decor_remote

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    remote = '/home/ch_jyx/src/django_site'

    @decor_remote
    def main():
        with open(os.path.join(remote, 'db.sqlite3')) as f:
            return f.read()
    with open(os.path.join(here, 'db.sqlite3'), 'w') as f:
        f.write(main())

want = raw_input('Do you want to fetch remote db? (y/N)')
if want in ('y', 'Y'):
    main()
    print 'done fetching'
else:
    print 'cancelled'

