#/bin/bash
echo "" | nc ihome.ust.hk 3389 2>/dev/null 1>/dev/null
NOT_RUNNING=$?

if [ $NOT_RUNNING == 1 ]; then
    echo "remote start sshd..."
    echo "~/usr/sbin/sindex.php" | ihomesh 2>/dev/null 1>/dev/null
#else
    #echo "sshd already running."
fi

