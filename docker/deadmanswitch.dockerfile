ARG BASE_IMAGE

FROM $BASE_IMAGE

ARG DEADMANSWITCH_VERSION

COPY ./deb_setup_23.x /tmp/deb_setup_23.x
COPY ./rpm_setup_23.x /tmp/rpm_setup_23.x
COPY ./install_nodejs.sh /tmp/install_nodejs.sh
RUN bash /tmp/install_nodejs.sh && \
    rm -rf /tmp/deb_setup_23.x && \
    rm -rf /tmp/rpm_setup_23.x && \
    rm -rf /tmp/install_nodejs.sh && \
    npm i -g deadmanswitch@$DEADMANSWITCH_VERSION
