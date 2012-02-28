#!/bin/bash

ifconfig | grep -o "inet addr:\([0-9\.]\+\)" | grep -v "127.0.0.1" | \
    sed "s/inet addr://g"

