#!/usr/bin/env bash

# Determine if an instance of the development image is already running
EXISTING=`docker ps --filter "name=language-toolbox-dev" --format "{{.ID}}"`
if [ "$EXISTING" != "" ]; then
	
	# Attach an additional interactive shell to the running container
	docker exec -ti "language-toolbox-dev" "bash"
	
else
	
	# Spin up an instance of the development image and launch an interactive shell
	docker run -p 50051:50051 -v`pwd`/..:/opt/toolbox -v/var/run/docker.sock:/var/run/docker.sock -ti --rm --name "language-toolbox-dev" "adamrehn/language-toolbox-development"
	
fi
