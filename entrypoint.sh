#!/bin/sh
readonly CACHE_BREAKER=$(date +%s)
[ -z "$PORT" ] && echo "Need to set PORT" && exit 1;

pushstate-server -d build -p $PORT