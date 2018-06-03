#!/usr/bin/env bash
set -e

apt-get install -y --no-install-recommends python3 python3-pip
pip3 install -r /tmp/deps/requirements.txt
