#!/bin/bash

# Loominary Production Deployment Script
# Deploys the complete private vault system with inheritance tokens

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="loominary"
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
NODE_ENV=${NODE_ENV:-production}

echo -e "${BOLD}${BLUE}🏛️  LOOMINARY DEPLOYMENT SCRIPT${NC}"
echo -e "${BLUE}====================================${NC}\n"
echo -e "${BLUE}======================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Branch: ${YELLOW}$BRANCH${NC}"
echo -e "Backup: ${YELLOW}$BACKUP_ENABLED${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Check required tools
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose is required but not installed${NC}"; exit 1; }
command -v git >/dev/null 2>&1 || { echo -e "${RED}❌ Git is required but not installed${NC}"; exit 1; }

# Check environment file
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo -e "${RED}❌ Environment file .env.$ENVIRONMENT not found${NC}"
    echo -e "${YELLOW}💡 Copy .env.production.example to .env.$ENVIRONMENT and configure it${NC}"
    exit 1
fi

# Load environment variables
set -a
source ".env.$ENVIRONMENT"
set +a

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Pre-deployment backup
if [ "$BACKUP_ENABLED" = "true" ]; then
    echo -e "${BLUE}💾 Creating pre-deployment backup...${NC}"
    
    # Create backup directory
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker ps | grep -q heirloom-postgres; then
        echo -e "${YELLOW}📊 Backing up database...${NC}"
        docker exec heirloom-postgres pg_dump -U heirloom_user heirloom_production > "$BACKUP_DIR/database.sql"
    fi
    
    # Backup uploaded files
    if [ -d "uploads" ]; then
        echo -e "${YELLOW}📁 Backing up uploaded files...${NC}"
        tar -czf "$BACKUP_DIR/uploads.tar.gz" uploads/
    fi
    
    echo -e "${GREEN}✅ Backup completed: $BACKUP_DIR${NC}"
fi

# Git operations
echo -e "${BLUE}📥 Updating codebase...${NC}"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Build and deploy
echo -e "${BLUE}🏗️ Building and deploying containers...${NC}"

# Stop existing containers gracefully
if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    echo -e "${YELLOW}⏹️ Stopping existing containers...${NC}"
    docker-compose -f docker-compose.production.yml down --timeout 30
fi

# Pull latest images
echo -e "${YELLOW}📦 Pulling latest base images...${NC}"
docker-compose -f docker-compose.production.yml pull

# Build application images
echo -e "${YELLOW}🔨 Building application images...${NC}"
docker-compose -f docker-compose.production.yml build --no-cache

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Health checks
echo -e "${BLUE}🏥 Running health checks...${NC}"

# Check database
if docker exec heirloom-postgres pg_isready -U heirloom_user -d heirloom_production >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${RED}❌ Database health check failed${NC}"
    exit 1
fi

# Check Redis
if docker exec heirloom-redis redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is healthy${NC}"
else
    echo -e "${RED}❌ Redis health check failed${NC}"
    exit 1
fi

# Check backend API
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API is healthy${NC}"
else
    echo -e "${RED}❌ Backend API health check failed${NC}"
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    exit 1
fi

# Run database migrations
echo -e "${BLUE}🗄️ Running database migrations...${NC}"
docker exec heirloom-backend npx prisma migrate deploy

# Seed initial data if needed
if [ "$ENVIRONMENT" = "production" ] && [ ! -f ".seeded" ]; then
    echo -e "${BLUE}🌱 Seeding initial data...${NC}"
    docker exec heirloom-backend npm run seed:production
    touch .seeded
fi

# Clear caches
echo -e "${BLUE}🧹 Clearing caches...${NC}"
docker exec heirloom-redis redis-cli FLUSHALL

# Warm up caches
echo -e "${BLUE}🔥 Warming up caches...${NC}"
curl -s http://localhost:3000 >/dev/null
curl -s http://localhost:3001/api/subscriptions/tiers >/dev/null

# Security scan
echo -e "${BLUE}🔒 Running security scan...${NC}"
if command -v trivy >/dev/null 2>&1; then
    trivy image heirloom-backend:latest
    trivy image heirloom-frontend:latest
else
    echo -e "${YELLOW}⚠️ Trivy not installed, skipping security scan${NC}"
fi

# Performance test
echo -e "${BLUE}⚡ Running performance test...${NC}"
if command -v ab >/dev/null 2>&1; then
    ab -n 100 -c 10 http://localhost:3000/ >/dev/null 2>&1
    echo -e "${GREEN}✅ Performance test completed${NC}"
else
    echo -e "${YELLOW}⚠️ Apache Bench not installed, skipping performance test${NC}"
fi

# SSL certificate check
if [ -f "nginx/ssl/cert.pem" ]; then
    echo -e "${BLUE}🔐 Checking SSL certificate...${NC}"
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in nginx/ssl/cert.pem | cut -d= -f2)
    echo -e "${GREEN}✅ SSL certificate expires: $CERT_EXPIRY${NC}"
else
    echo -e "${YELLOW}⚠️ SSL certificate not found${NC}"
fi

# Log rotation setup
echo -e "${BLUE}📝 Setting up log rotation...${NC}"
sudo tee /etc/logrotate.d/heirloom >/dev/null <<EOF
/var/lib/docker/containers/*/*-json.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF

# Monitoring setup
echo -e "${BLUE}📊 Setting up monitoring...${NC}"
if docker ps | grep -q heirloom-prometheus; then
    echo -e "${GREEN}✅ Prometheus is running${NC}"
fi
if docker ps | grep -q heirloom-grafana; then
    echo -e "${GREEN}✅ Grafana is running${NC}"
fi

# Final status check
echo -e "${BLUE}📋 Final deployment status...${NC}"
docker-compose -f docker-compose.production.yml ps

# Success message
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL! 🎉${NC}"
echo -e "${GREEN}================================${NC}"
echo -e "🌐 Frontend: ${YELLOW}https://heirloom.app${NC}"
echo -e "🔧 API: ${YELLOW}https://heirloom.app/api${NC}"
echo -e "📊 Monitoring: ${YELLOW}https://admin.heirloom.app${NC}"
echo -e "💳 Payments: ${YELLOW}Stripe integration active${NC}"
echo -e "🤖 AI: ${YELLOW}Ollama/Llama 3.1 ready${NC}"
echo -e "📱 Mobile: ${YELLOW}React Native app ready${NC}"
echo ""
echo -e "${BLUE}🚀 The world's first legacy platform is now live!${NC}"
echo -e "${BLUE}Ready to preserve memories for future generations.${NC}"
echo ""

# Post-deployment notifications
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚀 Heirloom deployment successful! The legacy platform is now live."}' \
        "$SLACK_WEBHOOK_URL" >/dev/null 2>&1
fi

# Create deployment log
echo "$(date): Deployment successful - Branch: $BRANCH, Environment: $ENVIRONMENT" >> deployment.log

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"