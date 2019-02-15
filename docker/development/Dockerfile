FROM adamrehn/language-toolbox:latest

# Remove the production build so we can bind-mount the host filesystem in its place
RUN rm -R /opt/toolbox

# Copy our build scripts back into the image and make them accessible in the PATH
COPY ./docker/production/build/*.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh

# Create a non-root user for running our language module subprocesses
RUN useradd --home /tmp --shell /bin/bash --uid 1000 module

WORKDIR /opt/toolbox/server
ENTRYPOINT ["bash"]
EXPOSE 50051