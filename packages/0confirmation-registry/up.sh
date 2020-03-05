#!/bin/bash -x

source ./lib/functions.sh
source ./lib/digitalocean.sh

create_machine npm-registry
docker-machine scp ./nginx.conf npm-registry:nginx.conf
target npm-registry
