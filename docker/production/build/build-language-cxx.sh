#!/usr/bin/env bash
set -e

cd /opt/toolbox/server/languages/cxx && test -d build || mkdir build
cd /opt/toolbox/server/languages/cxx/build && \
	cmake -DCMAKE_BUILD_TYPE=Release .. && \
	cmake --build . && cmake --build . --target install
