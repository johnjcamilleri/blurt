#!/usr/bin/env sh

# Build inside Docker
docker run \
  --name "build-blurt" \
  --rm \
  --volume "$PWD":/app \
  --workdir /app \
  node:22.21-alpine3.22 \
  npm run build && npm run build:client
