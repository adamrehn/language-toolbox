#!/usr/bin/env bash
set -e

# Install common packages
apt-get update && apt-get install -y --no-install-recommends \
	apt-transport-https \
	ca-certificates \
	curl \
	git \
	gpg \
	gpg-agent \
	software-properties-common

# Install Docker CE (use the Ubuntu 17.10 package until 18.04 is officially supported)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu artful stable"
apt-get update && apt-get install -y --no-install-recommends docker-ce

# Install Node.js and update NPM
curl -sL https://deb.nodesource.com/setup_9.x | bash - && apt-get install -y --no-install-recommends nodejs
npm install -g npm
