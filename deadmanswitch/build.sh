#!/bin/bash
set -e
set +x

trap "cd $(pwd -P)" EXIT
cd $(dirname "$0")

rm -rf ./bin
mkdir bin

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/deadmanswitch_linux_x86_64
CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o bin/deadmanswitch_linux_aarch64

# https://upx.github.io/ - 30% less file size.
upx --best --ultra-brute bin/*
