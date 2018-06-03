#!/usr/bin/env bash
set -e

cd /opt/toolbox/server/core && npm install . && npm run build
