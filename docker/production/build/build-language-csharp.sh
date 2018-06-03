#!/usr/bin/env bash
set -e

export HOME=/opt/toolbox/server/languages/csharp
cd /opt/toolbox/server/languages/csharp && \
	dotnet restore && \
	./run-protoc.sh && \
	dotnet publish -c Release -f netcoreapp2.0
