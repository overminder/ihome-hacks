#!/bin/bash

./ensure-ssh.sh

RNAME=ch_jyx
RHOST=ihome.ust.hk
RPORT="3389"

ssh -p$RPORT $RNAME@$RHOST '~/s/fcgid stop'
ssh -p$RPORT $RNAME@$RHOST '~/s/fcgid stop'
ssh -p$RPORT $RNAME@$RHOST '~/s/fcgid start'

