#!/usr/bin/env bash
set -e

cd /opt/toolbox/server/languages/javascript && npm install . && npm run build
