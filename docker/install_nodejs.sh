#!/bin/bash
set -e
set +x

trap "cd $(pwd -P)" EXIT
cd "$(dirname $0)"

# Function to check for command availability
command_exists() {
  command -v "$1" &> /dev/null
}

bash ./deb_setup_23.x || bash ./rpm_setup_23.x

if command_exists apt-get; then
  apt-get install -y nodejs
elif command_exists yum; then
  yum install nodejs -y
elif command_exists microdnf; then
  microdnf install nodejs -y
elif command_exists dnf; then
  dnf install nodejs -y
fi

