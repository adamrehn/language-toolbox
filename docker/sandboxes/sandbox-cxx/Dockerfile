FROM ubuntu:18.04

# Create a non-root user for running sandboxed code
RUN useradd --home /tmp --shell /bin/bash --uid 1000 sandbox
USER sandbox
