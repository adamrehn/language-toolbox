#!/usr/bin/env bash
set -e

cd /opt/toolbox/server/languages/java && gradle deploy --gradle-user-home ./.gradle-home
