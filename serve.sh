#!/usr/bin/env sh

# Serve from Docker
docker run \
  --name "serve-blurt" \
  --rm \
  --volume "$PWD":/app \
  --workdir /app \
  --publish 3000:3000 \
  node:22.21-alpine3.22 \
  npm start
