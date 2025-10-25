#!/usr/bin/env sh

# SWAG = Secure Web Application Gateway
# Nginx webserver with reverse proxy and Chatbot for SSL renewal
docker run -d \
  --name=swag \
  --cap-add=NET_ADMIN \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Etc/UTC \
  -e URL=blurt.cse.chalmers.se \
  -e VALIDATION=http \
  -e EXTRA_DOMAINS=blurt.lol \
  -p 443:443 \
  -p 80:80 \
  -v "$PWD"/swag/config:/config \
  --restart unless-stopped \
  lscr.io/linuxserver/swag:5.1.0
