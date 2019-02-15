FROM ubuntu:18.04

# Copy our dependency scripts and build scripts into the image
WORKDIR /tmp
COPY ./server/languages/python/requirements.txt /tmp/deps/requirements.txt
COPY ./docker/production/deps /tmp/deps/
COPY ./docker/production/build /tmp/build/
RUN chmod +x /tmp/deps/*.sh /tmp/build/*.sh

# Install the dependencies for the server core and each of the language modules
RUN /tmp/deps/deps-all.sh
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1

# Copy the source directory from the repository into the image
COPY . /opt/toolbox

# If we are building from a git repo (as opposed to a source tarball),
# clean any existing build files so we can perform a clean build
WORKDIR /opt/toolbox
RUN test -d ./.git && git clean --force -x -d; exit 0

# Build the server core and each of the language modules from source
RUN /tmp/build/build-all.sh

# Remove the dependency scripts and build scripts from the image
RUN rm -R /tmp/deps /tmp/build

# Create a non-root user for running our language module subprocesses
RUN useradd --home /tmp --shell /bin/bash --uid 1000 module

WORKDIR /opt/toolbox/server/core
ENTRYPOINT ["node", "."]
EXPOSE 50051