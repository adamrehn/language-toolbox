#!/usr/bin/env bash
set -e

apt-get update && apt-get install -y --no-install-recommends apt-transport-https ca-certificates curl gpg unzip wget
wget -qO- https://packages.microsoft.com/keys/microsoft.asc -O - | gpg --dearmor > /etc/apt/trusted.gpg.d/microsoft.gpg
wget -q https://packages.microsoft.com/config/ubuntu/18.04/prod.list -O /etc/apt/sources.list.d/microsoft-prod.list
apt-get update
apt-get install -y --no-install-recommends dotnet-sdk-2.1
