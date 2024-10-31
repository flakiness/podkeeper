ARG BASE_IMAGE

FROM $BASE_IMAGE

COPY ./setup_23.x /tmp/setup_23.x
RUN bash /tmp/setup_23.x && npm i -g deadmanswitch

# Store original entrypoint and cmd as environment variables
ENV ORIGINAL_ENTRYPOINT=$ENTRYPOINT
ENV ORIGINAL_CMD=$CMD

# Set new entrypoint to our wrapper
ENTRYPOINT ["deadmanswitch", "${ORIGINAL_ENTRYPOINT}", "${ORIGINAL_CMD}"]
