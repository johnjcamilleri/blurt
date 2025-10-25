#!/usr/bin/env sh

# Serve Docker image
docker run \
  --name "blurt" \
  --rm \
  --detach \
  --publish 3000:3000 \
  blurt:latest
