# Veltria App Deployment Guide

Deployment configuration for veltria.ai VM.

## Quick Setup

### 1. Create deployment directory

```bash
sudo mkdir -p /opt/veltria
sudo chown $USER:$USER /opt/veltria
```

### 2. Copy files

```bash
cd ~/workspace/veltria-app/deploy
cp docker-compose.prod.yml /opt/veltria/docker-compose.yml
cp .env.example /opt/veltria/.env
```

### 3. Configure environment

```bash
cd /opt/veltria

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 48)
sed -i "s/change-this-to-secure-random-string/$JWT_SECRET/" .env

# Verify
cat .env
```

### 4. Set up nginx

```bash
# Copy nginx config
sudo cp ~/workspace/veltria-app/deploy/nginx-veltria-app.conf /etc/nginx/sites-available/veltria-app

# Enable site
sudo ln -sf /etc/nginx/sites-available/veltria-app /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Set up SSL (after DNS is configured)

```bash
# Get certificates
sudo certbot --nginx -d app.veltria.ai -d api.veltria.ai
```

### 6. Login to GitHub Container Registry

```bash
# Create a Personal Access Token at https://github.com/settings/tokens
# with `read:packages` scope
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 7. Deploy

```bash
cd /opt/veltria
docker compose pull
docker compose up -d
```

### 8. Verify

```bash
# Check containers
docker compose ps

# Check logs
docker compose logs -f

# Test endpoints
curl http://localhost:3001/api/health
curl -I http://localhost:5173/health
```

## DNS Requirements

Create A records pointing to the VM IP:
- `app.veltria.ai` → VM IP
- `api.veltria.ai` → VM IP

## GitHub Actions Secrets

For CI/CD to work, set these secrets in GitHub:
- `DEPLOY_HOST`: `veltria.ai`
- `DEPLOY_USER`: `epadmin`  
- `DEPLOY_SSH_KEY`: (SSH private key with access to VM)

## Common Operations

```bash
cd /opt/veltria

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart

# Update to latest
docker compose pull
docker compose up -d

# Database backup
docker compose exec mongodb mongodump --out /data/backup
docker cp veltria-mongodb:/data/backup ./backup-$(date +%Y%m%d)
```

## Architecture

```
Internet → Nginx (SSL) → Docker Containers
                ├── app.veltria.ai → frontend:5173
                └── api.veltria.ai → backend:3001 → mongodb
```

## Ports

| Service   | Internal | External (localhost only) |
|-----------|----------|---------------------------|
| Frontend  | 80       | 5173                      |
| Backend   | 3001     | 3001                      |
| MongoDB   | 27017    | -                         |

All external ports are bound to 127.0.0.1 - only nginx can access them.
