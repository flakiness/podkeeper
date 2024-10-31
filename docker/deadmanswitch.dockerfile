ARG BASE_IMAGE
ARG ORIGINAL_ENTRYPOINT
ARG ORIGINAL_CMD

FROM $BASE_IMAGE

COPY ./deb_setup_23.x /tmp/deb_setup_23.x
COPY ./rpm_setup_23.x /tmp/rpm_setup_23.x
COPY ./install_nodejs.sh /tmp/install_nodejs.sh
RUN bash /tmp/install_nodejs.sh && \
    rm -rf /tmp/deb_setup_23.x && \
    rm -rf /tmp/rpm_setup_23.x && \
    rm -rf /tmp/install_nodejs.sh && \
    npm i -g deadmanswitch

# Store original entrypoint and cmd as environment variables
ENV ORIGINAL_ENTRYPOINT=$ORIGINAL_ENTRYPOINT
ENV ORIGINAL_CMD=$ORIGINAL_CMD

# Set new entrypoint to our wrapper
ENTRYPOINT ["deadmanswitch", "${ORIGINAL_ENTRYPOINT}", "${ORIGINAL_CMD}"]
