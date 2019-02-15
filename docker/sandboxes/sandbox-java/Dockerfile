FROM ubuntu:18.04

# Install the JRE (use Java 8 since Java 9+ causes issues with the libraries we use)
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-8-jre openjdk-8-jre-headless

# Create a non-root user for running sandboxed code
RUN useradd --home /tmp --shell /bin/bash --uid 1000 sandbox
USER sandbox
