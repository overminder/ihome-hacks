
from ompkg.ihomerpc.rpc_master import decor_remote

@decor_remote
def main():
    import os
    os.system('/home/ch_jyx/fcgid stop')

main()
print 'done'
