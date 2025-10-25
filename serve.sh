#!/usr/bin/env sh

# Serve using Node inside Docker
# current directory is mapped inside container (including node_modules)
docker run \
  --name "blurt" \
  --rm \
  --detach \
  --volume "$PWD":/app \
  --workdir /app \
  --publish 3000:3000 \
  node:22.21-alpine3.22 \
  npm start
