#!/usr/bin/env bash
set -euo pipefail

# Resume deploy script - skip Docker install and build, go straight to nginx + SSL
# Usage: sudo ./resume-deploy.sh --domain example.com --email admin@example.com

WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$WORKDIR/.env.production"
NGINX_SITE="/etc/nginx/sites-available/8ehradioitb"
CERTBOT_WEBROOT="/var/www/certbot"

print_usage(){
  cat <<EOF
Usage: sudo $0 --domain <domain> --email <email>

This script assumes Docker containers are already running and only:
 - installs nginx if missing
 - creates nginx site config
 - obtains SSL certificate

EOF
}

# Parse args
DOMAIN=""
EMAIL=""
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2;;
    --email) EMAIL="$2"; shift 2;;
    -h|--help) print_usage; exit 0;;
    *) echo "Unknown arg: $1"; print_usage; exit 1;;
  esac
done

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Domain and email are required."; print_usage; exit 1
fi

# ensure running as root for nginx and apt actions
if [[ $EUID -ne 0 ]]; then
  echo "This script should be run as root or via sudo."; exit 1
fi

# Install nginx if missing
if ! command -v nginx >/dev/null 2>&1; then
  echo "Installing nginx..."
  apt-get update && apt-get install -y nginx
fi

# Check if app container is running
if ! docker compose ps | grep -q "app.*running"; then
  echo "Warning: App container not running. You may need to run docker compose up first."
fi

# Setup nginx site
echo "Setting up nginx configuration..."
mkdir -p "$CERTBOT_WEBROOT"
cat > "$NGINX_SITE" <<NGCONF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90;
    }
}
NGCONF

# enable site
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/8ehradioitb

# test nginx config and reload
if nginx -t; then
  systemctl reload nginx
  echo "nginx configuration updated and reloaded"
else
  echo "nginx config test failed; check $NGINX_SITE"; exit 1
fi

# Install certbot and obtain cert
if ! command -v certbot >/dev/null 2>&1; then
  echo "Installing certbot..."
  apt-get update
  apt-get install -y certbot python3-certbot-nginx
fi

echo "Obtaining SSL certificate..."
certbot --nginx -d "$DOMAIN" -m "$EMAIL" --non-interactive --agree-tos || {
  echo "certbot failed. You may need to run certbot manually.";
  echo "Try: sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN";
}

# Final status
echo "Resume deployment finished. Visit https://$DOMAIN"
echo "If app not running: docker compose --env-file .env.production up -d"
echo "To view logs: docker compose logs -f app"