FROM ubuntu:18.04

# Install Node.js
RUN apt-get update && apt-get install -y --no-install-recommends curl
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash - && apt-get install -y --no-install-recommends nodejs

# Create a non-root user for running sandboxed code
RUN useradd --home /tmp --shell /bin/bash --uid 1000 sandbox
USER sandbox
