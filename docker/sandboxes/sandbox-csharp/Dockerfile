FROM ubuntu:18.04

# Install .NET Core
RUN apt-get update && apt-get install -y --no-install-recommends apt-transport-https ca-certificates curl gpg unzip wget
RUN wget -qO- https://packages.microsoft.com/keys/microsoft.asc -O - | gpg --dearmor > /etc/apt/trusted.gpg.d/microsoft.gpg
RUN wget -q https://packages.microsoft.com/config/ubuntu/18.04/prod.list -O /etc/apt/sources.list.d/microsoft-prod.list
RUN apt-get update && apt-get install -y --no-install-recommends dotnet-sdk-2.1
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1

# Create a non-root user for running sandboxed code
RUN useradd --home /tmp --shell /bin/bash --uid 1000 sandbox
USER sandbox
