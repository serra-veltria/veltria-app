# CI/CD Pipeline Documentation

This document describes the GitHub Actions CI/CD pipeline for the Veltria App.

## Overview

The pipeline consists of two workflows:

1. **CI (Continuous Integration)** - Runs on every push and PR
2. **CD (Continuous Deployment)** - Runs on push to `main` branch

## CI Workflow (`.github/workflows/ci.yml`)

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Jobs

#### 1. lint-and-test
- Checks out code
- Sets up pnpm and Node.js (version from `.nvmrc`)
- Installs dependencies
- Builds shared packages
- Runs linting (`pnpm lint`)
- Runs tests (`pnpm test`)

#### 2. build
- Depends on `lint-and-test`
- Builds all packages with Turborepo
- Uploads build artifacts for both frontend and backend

## CD Workflow (`.github/workflows/cd.yml`)

### Triggers
- Push to `main` branch
- Manual dispatch (workflow_dispatch) with environment selection

### Jobs

#### 1. build-and-push
- Builds Docker images for frontend and backend
- Pushes to GitHub Container Registry (ghcr.io)
- Tags images with SHA, branch name, and `latest` for main

#### 2. deploy
- SSHs into production VM (veltria.ai)
- Pulls latest Docker images
- Deploys with `docker compose up -d`
- Runs health check
- Cleans up old images

## Required GitHub Secrets

Set these in your repository Settings → Secrets and variables → Actions:

### For Docker Registry (auto-provided)
- `GITHUB_TOKEN` - Automatically provided, no setup needed

### For Deployment
- `DEPLOY_HOST` - Production VM hostname or IP (e.g., `veltria.ai`)
- `DEPLOY_USER` - SSH username (e.g., `epadmin`)
- `DEPLOY_SSH_KEY` - Private SSH key for authentication

## Setting Up Secrets

### 1. Generate SSH Key for Deployment

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github-deploy-key

# Copy the public key to the VM
ssh-copy-id -i ~/.ssh/github-deploy-key.pub epadmin@veltria.ai

# The private key content goes in DEPLOY_SSH_KEY secret
cat ~/.ssh/github-deploy-key
```

### 2. Add Secrets in GitHub

1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:
   - Name: `DEPLOY_HOST`, Value: `veltria.ai`
   - Name: `DEPLOY_USER`, Value: `epadmin`
   - Name: `DEPLOY_SSH_KEY`, Value: (paste private key content)

## VM Setup (veltria.ai)

### Prerequisites on the VM

1. **Docker and Docker Compose installed**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com | sudo sh
   sudo usermod -aG docker $USER
   
   # Docker Compose is included with Docker
   ```

2. **Create deployment directory**
   ```bash
   sudo mkdir -p /opt/veltria
   sudo chown epadmin:epadmin /opt/veltria
   ```

3. **Copy docker-compose.yml and .env**
   ```bash
   cd /opt/veltria
   # Copy docker-compose.yml from repo
   # Create .env with production values:
   cat > .env << 'EOF'
   MONGODB_URI=mongodb://localhost:27017/veltria
   JWT_SECRET=your-secure-jwt-secret-min-32-characters
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://veltria.ai
   EOF
   ```

4. **Login to GitHub Container Registry**
   ```bash
   # Create a Personal Access Token with `read:packages` scope
   echo $GITHUB_TOKEN | docker login ghcr.io -u serra-veltria --password-stdin
   ```

## Troubleshooting

### CI failing on lint
- Check that ESLint is properly configured
- Run `pnpm lint` locally to see errors

### Docker build failing
- Ensure Dockerfiles exist at:
  - `apps/backend/Dockerfile`
  - `apps/frontend/Dockerfile`
- Check that all dependencies are listed in package.json

### Deployment failing
- Check SSH key is correct
- Ensure VM is accessible from GitHub Actions
- Check that `/opt/veltria` exists and has correct permissions
- Check Docker is running on VM

### Health check failing
- Ensure backend has `/api/health` endpoint
- Check that MongoDB is accessible
- **Note:** Backend runs on port 3002 externally (3001 internally in container)
- Look at container logs: `sudo docker logs veltria-backend`

## Manual Deployment

If needed, you can deploy manually:

```bash
# On the VM
cd /opt/veltria
docker compose pull
docker compose up -d
docker compose logs -f
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │  CI: Lint   │ →  │  CI: Build  │ →  │  CD: Push   │    │
│   │   & Test    │    │             │    │  to GHCR    │    │
│   └─────────────┘    └─────────────┘    └──────┬──────┘    │
│                                                 │           │
└─────────────────────────────────────────────────┼───────────┘
                                                  │
                                                  │ SSH Deploy
                                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    veltria.ai VM                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐         ┌─────────────┐                  │
│   │  Frontend   │ :5173   │   Backend   │ :3001            │
│   │   (nginx)   │ ←─────→ │  (Node.js)  │                  │
│   └─────────────┘         └──────┬──────┘                  │
│                                  │                          │
│                                  ▼                          │
│                           ┌─────────────┐                  │
│                           │   MongoDB   │                  │
│                           └─────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

1. Set up GitHub Secrets
2. Configure VM with Docker
3. Set up reverse proxy (nginx/Caddy) for SSL
4. Configure domain DNS
5. Set up monitoring/alerts

---

*Pipeline created for VAI-18 - Veltria CI/CD*
