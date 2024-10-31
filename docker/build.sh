#!/bin/bash
set -e
set +x

trap "cd $(pwd -P)" EXIT
cd "$(dirname $0)"

# Check if image name is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <docker-image-name>"
    exit 1
fi

ORIGINAL_IMAGE="$1"
NEW_IMAGE="${ORIGINAL_IMAGE}-deadsmanswitch"

# Check if wrapped image already exists
# if docker image inspect "${NEW_IMAGE}" >/dev/null 2>&1; then
#     echo "Image $NEW_IMAGE already exists. Skipping build."
#     exit 0
# fi

docker pull "${ORIGINAL_IMAGE}"
# Get original entrypoint and cmd
ENTRYPOINT=$(docker inspect --format='{{json .Config.Entrypoint}}' "${ORIGINAL_IMAGE}")
CMD=$(docker inspect --format='{{json .Config.Cmd}}' "${ORIGINAL_IMAGE}")

# Build new image
docker build \
  -t "$NEW_IMAGE" \
  --build-arg ORIGINAL_ENTRYPOINT=${ENTRYPOINT} \
  --build-arg ORIGINAL_CMD=${CMD} \
  --build-arg BASE_IMAGE="${ORIGINAL_IMAGE}" \
  -f deadmanswitch.dockerfile .

echo "Created new image: $NEW_IMAGE"
echo "Original entrypoint: $ENTRYPOINT"
echo "Original cmd: $CMD"
echo "Run with: docker run $NEW_IMAGE [args]"
