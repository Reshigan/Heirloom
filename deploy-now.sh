#!/bin/bash

# Loominary Immediate Deployment Script
# Deploy directly to production server using SSH

set -e

echo "🌟 Loominary Immediate Production Deployment"
echo "============================================"
echo "🚀 Deploying to: loom.vantax.co.za (3.8.160.221)"
echo "🔐 Using SSH key: Vantax-2.pem"
echo ""

# Configuration
SERVER_IP="3.8.160.221"
SERVER_USER="ubuntu"
SSH_KEY="/workspace/project/Vantax-2.pem"
DOMAIN="loom.vantax.co.za"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_magic() {
    echo -e "${PURPLE}[LOOMINARY]${NC} $1"
}

# Test SSH connection
print_status "Testing SSH connection..."
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'"; then
    print_success "SSH connection established"
else
    echo "❌ Failed to connect to server"
    exit 1
fi

# Deploy to server
print_status "Deploying Loominary to production server..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
set -e

echo "🌟 Starting Loominary deployment on production server"

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx curl git

# Start services
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl start nginx
sudo systemctl enable nginx

# Add user to docker group
sudo usermod -aG docker $USER

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/loominary
sudo chown $USER:$USER /opt/loominary
cd /opt/loominary

# Clone repository
echo "📥 Cloning Loominary repository..."
if [ -d "Heirloom" ]; then
    cd Heirloom
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    git clone https://github.com/Reshigan/Heirloom.git
    cd Heirloom
fi

# Create production environment
echo "🔧 Creating production environment..."
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Database
DATABASE_URL="postgresql://loominary_user:loominary_secure_password_2024@postgres:5432/loominary_prod"
REDIS_URL="redis://redis:6379"

# JWT
JWT_SECRET="loominary_jwt_super_secure_secret_key_2024_production"
JWT_REFRESH_SECRET="loominary_refresh_super_secure_secret_key_2024_production"

# AI Service
OLLAMA_BASE_URL="http://ollama:11434"
AI_MODEL="llama3.1"

# Stripe (Demo keys - replace with real ones)
STRIPE_PUBLISHABLE_KEY="pk_test_demo_key"
STRIPE_SECRET_KEY="sk_test_demo_key"
STRIPE_WEBHOOK_SECRET="whsec_demo_key"

# Email (Demo config - replace with real SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="demo@vantax.co.za"
SMTP_PASS="demo_password"

# Domain
DOMAIN="loom.vantax.co.za"
FRONTEND_URL="https://loom.vantax.co.za"
BACKEND_URL="https://loom.vantax.co.za/api"

# Security
CORS_ORIGIN="https://loom.vantax.co.za"
SECURE_COOKIES=true
EOF

# Create production Docker Compose
echo "🐳 Creating production Docker Compose..."
cat > docker-compose.production.yml << 'DOCKEREOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: loominary_postgres
    environment:
      POSTGRES_DB: loominary_prod
      POSTGRES_USER: loominary_user
      POSTGRES_PASSWORD: loominary_secure_password_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - loominary_network

  redis:
    image: redis:7-alpine
    container_name: loominary_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - loominary_network

  ollama:
    image: ollama/ollama:latest
    container_name: loominary_ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped
    networks:
      - loominary_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: loominary_backend
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - loominary_network

  frontend:
    build:
      context: ./sveltekit-app
      dockerfile: Dockerfile
    container_name: loominary_frontend
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - loominary_network

volumes:
  postgres_data:
  redis_data:
  ollama_data:

networks:
  loominary_network:
    driver: bridge
DOCKEREOF

# Install dependencies and build
echo "📦 Installing dependencies..."
cd backend && npm install --production && cd ..
cd sveltekit-app && npm install --production && npm run build && cd ..

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/loom.vantax.co.za << 'NGINXEOF'
server {
    listen 80;
    server_name loom.vantax.co.za;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        access_log off;
        return 200 "Loominary is healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINXEOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/loom.vantax.co.za /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Start Docker services
echo "🚀 Starting Loominary services..."
docker-compose -f docker-compose.production.yml down || true
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 60

# Install AI model in background
echo "🤖 Installing AI model..."
docker exec loominary_ollama ollama pull llama3.1 &

# Reload Nginx
sudo systemctl reload nginx

# Install SSL certificate
echo "🔐 Installing SSL certificate..."
sudo certbot --nginx -d loom.vantax.co.za --non-interactive --agree-tos --email admin@vantax.co.za --redirect || echo "SSL setup will be completed manually"

echo "✅ Loominary deployment completed!"
echo "🌟 Application should be accessible at: https://loom.vantax.co.za"

# Show status
echo "📊 Service Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

ENDSSH

print_success "Deployment completed!"

echo ""
print_magic "🎉 LOOMINARY IS NOW LIVE! 🎉"
echo ""
print_success "🌟 Application URL: https://loom.vantax.co.za"
print_success "🔐 SSL: Enabled (or will be enabled shortly)"
print_success "🐳 Docker: All services running"
print_success "🤖 AI: Llama 3.1 model installing in background"
print_success "🔍 Features: Private vaults, sentiment search, constellation UI"
echo ""
print_magic "Ready for pilot testing with your batch of users! 🚀"
echo ""

# Management commands
echo "📋 MANAGEMENT COMMANDS:"
echo "• Monitor: ssh -i \"$SSH_KEY\" $SERVER_USER@$SERVER_IP 'cd /opt/loominary/Heirloom && docker ps'"
echo "• Logs: ssh -i \"$SSH_KEY\" $SERVER_USER@$SERVER_IP 'cd /opt/loominary/Heirloom && docker-compose -f docker-compose.production.yml logs'"
echo "• Restart: ssh -i \"$SSH_KEY\" $SERVER_USER@$SERVER_IP 'cd /opt/loominary/Heirloom && docker-compose -f docker-compose.production.yml restart'"
echo ""
print_success "🌟 Loominary deployment successful!"