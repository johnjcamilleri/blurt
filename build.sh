#!/usr/bin/env sh

# Build inside Docker
# (note that node_modules is mapped from outside container)
docker run \
  --name "build-blurt" \
  --rm \
  --volume "$PWD":/app \
  --workdir /app \
  node:22.21-alpine3.22 \
  sh -c "npm install && npm run build && npm run build:client"
