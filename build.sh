#!/usr/bin/env sh

# Build using Node inside Docker
# current directory is mapped inside container (including node_modules)
docker run \
  --name "build-blurt" \
  --rm \
  --volume "$PWD":/app \
  --workdir /app \
  node:22.21-alpine3.22 \
  sh -c "npm install && npm run build && npm run build:client"
