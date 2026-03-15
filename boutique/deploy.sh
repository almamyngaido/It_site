#!/bin/bash
# ─── IntelligTech Production Deploy Script ───────────────────────────────────
# Usage: ./deploy.sh
# Builds the Angular app and syncs files to the server.
# Run from the boutique/ directory on your local machine.

set -e

SERVER_USER="root"                          # SSH user on your VPS
SERVER_HOST="intelligtech.sn"              # Your server IP or domain
REMOTE_DIR="/var/www/intelligtech/boutique" # Must match nginx.conf root
NGINX_CONF="/etc/nginx/sites-available/intelligtech"

echo "▶ Building Angular (production)..."
npm run build -- --configuration production

echo "▶ Syncing dist to server..."
rsync -avz --delete dist/boutique/ "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/"

echo "▶ Copying nginx config..."
scp nginx.conf "$SERVER_USER@$SERVER_HOST:$NGINX_CONF"

echo "▶ Enabling site and reloading nginx..."
ssh "$SERVER_USER@$SERVER_HOST" "
  ln -sf $NGINX_CONF /etc/nginx/sites-enabled/intelligtech
  nginx -t && systemctl reload nginx
"

echo "✅ Deploy complete → https://intelligtech.sn"
