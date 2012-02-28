#!/bin/bash

./ensure-ssh.sh

RSYNC=/usr/local/bin/rsync
SSH=/usr/bin/ssh
RNAME=ch_jyx
RHOST=ihome.ust.hk
RPORT="3389"
RPATH=/home/ch_jyx/src/django_site/
RPATH_STATIC=/home/ch_jyx/s/static/

USER_SELF=overmind
HOST_SELF=`./get-my-ip.sh`
LPATH="`pwd`/django_site/"
LPATH_STATIC="`pwd`/django_site/static/"

# sync app files
REMOTE_CMD="$RSYNC -e ssh -avz --exclude 'static' --exclude 'static/*' --exclude '*.sqlite3' --exclude '*.pyc' --exclude '.*.swp' --delete $USER_SELF@$HOST_SELF:$LPATH $RPATH"

# sync static files
REMOTE_CMD2="$RSYNC -e ssh -avz --exclude 'admin' --exclude '.*.swp' $USER_SELF@$HOST_SELF:$LPATH_STATIC $RPATH_STATIC"

ssh -p$RPORT $RNAME@$RHOST $REMOTE_CMD
ssh -p$RPORT $RNAME@$RHOST $REMOTE_CMD2

