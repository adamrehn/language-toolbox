FROM ubuntu:18.04

# Install Python 3
RUN apt-get update && apt-get install -y --no-install-recommends python3

# Create a non-root user for running sandboxed code
RUN useradd --home /tmp --shell /bin/bash --uid 1000 sandbox
USER sandbox
