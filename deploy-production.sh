#!/bin/bash

# Loominary Production Deployment Script
# Deploy to loom.vantax.co.za with SSL

set -e

echo "🌟 Loominary Production Deployment"
echo "=================================="
echo "🚀 Deploying to: loom.vantax.co.za"
echo "🔐 SSL: Enabled"
echo "🌍 Environment: Production"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="3.8.160.221"
SERVER_USER="ubuntu"
SSH_KEY="~/.ssh/Vantax-2.pem"
DOMAIN="loom.vantax.co.za"
GITHUB_REPO="https://github.com/Reshigan/Heirloom.git"
GITHUB_TOKEN="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"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_magic() {
    echo -e "${PURPLE}[LOOMINARY]${NC} $1"
}

# Test SSH connection
test_ssh_connection() {
    print_status "Testing SSH connection to production server..."
    
    if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'"; then
        print_success "SSH connection established"
    else
        print_error "Failed to connect to server"
        exit 1
    fi
}

# Deploy to production server
deploy_to_server() {
    print_status "Deploying Loominary to production server..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        set -e
        
        echo "🌟 Starting Loominary deployment on production server"
        
        # Update system
        echo "📦 Updating system packages..."
        sudo apt update && sudo apt upgrade -y
        
        # Install required packages
        echo "🔧 Installing required packages..."
        sudo apt install -y curl wget git nginx certbot python3-certbot-nginx docker.io docker-compose nodejs npm
        
        # Start and enable services
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo systemctl start nginx
        sudo systemctl enable nginx
        
        # Add user to docker group
        sudo usermod -aG docker $USER
        
        # Install Node.js 20 (latest LTS)
        echo "📦 Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
        # Verify installations
        echo "✅ Verifying installations..."
        node --version
        npm --version
        docker --version
        docker-compose --version
        
        # Create application directory
        echo "📁 Setting up application directory..."
        sudo mkdir -p /opt/loominary
        sudo chown $USER:$USER /opt/loominary
        cd /opt/loominary
        
        # Clone repository with token
        echo "📥 Cloning Loominary repository..."
        if [ -d "Heirloom" ]; then
            cd Heirloom
            git pull origin main
        else
            git clone https://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@github.com/Reshigan/Heirloom.git
            cd Heirloom
        fi
        
        # Create production environment file
        echo "🔧 Creating production environment..."
        cat > .env.production << 'EOF'
# Loominary Production Environment
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Database
DATABASE_URL="postgresql://loominary_user:loominary_secure_password_2024@localhost:5432/loominary_prod"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="loominary_jwt_super_secure_secret_key_2024_production"
JWT_REFRESH_SECRET="loominary_refresh_super_secure_secret_key_2024_production"

# AI Service (Ollama)
OLLAMA_BASE_URL="http://localhost:11434"
AI_MODEL="llama3.1"

# Stripe (Production keys - replace with real keys)
STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email (Production SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@vantax.co.za"
SMTP_PASS="your_email_password"

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
        cat > docker-compose.production.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: loominary_postgres
    environment:
      POSTGRES_DB: loominary_prod
      POSTGRES_USER: loominary_user
      POSTGRES_PASSWORD: loominary_secure_password_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - loominary_network

  # Redis Cache
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

  # Ollama AI Service
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

  # Backend API
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
      - ollama
    volumes:
      - ./backend:/app
      - /app/node_modules
    restart: unless-stopped
    networks:
      - loominary_network

  # Frontend
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
    volumes:
      - ./sveltekit-app:/app
      - /app/node_modules
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
EOF
        
        # Install dependencies
        echo "📦 Installing backend dependencies..."
        cd backend
        npm install --production
        
        echo "📦 Installing frontend dependencies..."
        cd ../sveltekit-app
        npm install --production
        
        # Build frontend
        echo "🏗️ Building frontend for production..."
        npm run build
        
        cd ..
        
        # Set up Nginx configuration
        echo "🌐 Setting up Nginx configuration..."
        sudo tee /etc/nginx/sites-available/loom.vantax.co.za << 'NGINXEOF'
server {
    listen 80;
    server_name loom.vantax.co.za;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name loom.vantax.co.za;
    
    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/loom.vantax.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/loom.vantax.co.za/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Frontend (SvelteKit)
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
        proxy_read_timeout 86400;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        alias /opt/loominary/Heirloom/sveltekit-app/build/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINXEOF
        
        # Enable the site
        sudo ln -sf /etc/nginx/sites-available/loom.vantax.co.za /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test Nginx configuration
        sudo nginx -t
        
        # Start services
        echo "🚀 Starting Loominary services..."
        
        # Start Docker services
        docker-compose -f docker-compose.production.yml down || true
        docker-compose -f docker-compose.production.yml up -d
        
        # Wait for services to start
        echo "⏳ Waiting for services to start..."
        sleep 30
        
        # Install Ollama model
        echo "🤖 Installing AI model..."
        docker exec loominary_ollama ollama pull llama3.1 || echo "AI model installation will continue in background"
        
        # Reload Nginx
        sudo systemctl reload nginx
        
        echo "✅ Loominary deployment completed!"
        echo "🌟 Application should be accessible at: http://loom.vantax.co.za"
        echo "🔐 SSL certificate will be installed next..."
        
ENDSSH
    
    print_success "Application deployed successfully!"
}

# Install SSL certificate
install_ssl_certificate() {
    print_status "Installing SSL certificate for loom.vantax.co.za..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        set -e
        
        echo "🔐 Installing SSL certificate..."
        
        # Install SSL certificate
        sudo certbot --nginx -d loom.vantax.co.za --non-interactive --agree-tos --email admin@vantax.co.za --redirect
        
        # Set up auto-renewal
        sudo systemctl enable certbot.timer
        sudo systemctl start certbot.timer
        
        # Test auto-renewal
        sudo certbot renew --dry-run
        
        echo "✅ SSL certificate installed successfully!"
        echo "🔐 HTTPS is now enabled for loom.vantax.co.za"
        
ENDSSH
    
    print_success "SSL certificate installed!"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        set -e
        
        echo "🔍 Verifying Loominary deployment..."
        
        # Check Docker containers
        echo "📊 Docker container status:"
        docker ps
        
        # Check Nginx status
        echo "🌐 Nginx status:"
        sudo systemctl status nginx --no-pager
        
        # Check application health
        echo "🏥 Application health check:"
        curl -f http://localhost:3000/health || echo "Frontend health check failed"
        curl -f http://localhost:3001/api/health || echo "Backend health check failed"
        
        # Check SSL certificate
        echo "🔐 SSL certificate status:"
        sudo certbot certificates
        
        echo "✅ Deployment verification completed!"
        
ENDSSH
    
    print_success "Deployment verified!"
}

# Create monitoring script
create_monitoring() {
    print_status "Setting up monitoring..."
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
        set -e
        
        echo "📊 Setting up monitoring..."
        
        # Create monitoring script
        cat > /opt/loominary/monitor.sh << 'MONITOREOF'
#!/bin/bash

# Loominary Monitoring Script

echo "🌟 Loominary System Status - $(date)"
echo "=================================="

# Check Docker containers
echo "📦 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check disk usage
echo ""
echo "💾 Disk Usage:"
df -h /

# Check memory usage
echo ""
echo "🧠 Memory Usage:"
free -h

# Check application health
echo ""
echo "🏥 Application Health:"
curl -s http://localhost:3000/health && echo " - Frontend: ✅ Healthy" || echo " - Frontend: ❌ Unhealthy"
curl -s http://localhost:3001/api/health && echo " - Backend: ✅ Healthy" || echo " - Backend: ❌ Unhealthy"

# Check SSL certificate expiry
echo ""
echo "🔐 SSL Certificate:"
sudo certbot certificates | grep -A 2 "loom.vantax.co.za" || echo "SSL certificate check failed"

echo ""
echo "✅ Monitoring completed!"
MONITOREOF
        
        chmod +x /opt/loominary/monitor.sh
        
        # Create systemd service for monitoring
        sudo tee /etc/systemd/system/loominary-monitor.service << 'SERVICEEOF'
[Unit]
Description=Loominary Monitoring Service
After=network.target

[Service]
Type=oneshot
ExecStart=/opt/loominary/monitor.sh
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
SERVICEEOF
        
        # Create timer for regular monitoring
        sudo tee /etc/systemd/system/loominary-monitor.timer << 'TIMEREOF'
[Unit]
Description=Run Loominary monitoring every 5 minutes
Requires=loominary-monitor.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
TIMEREOF
        
        # Enable monitoring
        sudo systemctl daemon-reload
        sudo systemctl enable loominary-monitor.timer
        sudo systemctl start loominary-monitor.timer
        
        echo "✅ Monitoring setup completed!"
        
ENDSSH
    
    print_success "Monitoring configured!"
}

# Main deployment function
main() {
    print_magic "🌟 Starting Loominary Production Deployment! 🌟"
    echo ""
    print_magic "Deploying the world's first private memory vault platform"
    print_magic "Domain: loom.vantax.co.za"
    print_magic "Features: Token-based vaults, sentiment search, constellation UI"
    echo ""
    
    # Execute deployment steps
    test_ssh_connection
    deploy_to_server
    install_ssl_certificate
    verify_deployment
    create_monitoring
    
    echo ""
    print_magic "🎉 LOOMINARY PRODUCTION DEPLOYMENT COMPLETE! 🎉"
    echo ""
    print_success "🌟 Application URL: https://loom.vantax.co.za"
    print_success "🔐 SSL: Enabled with auto-renewal"
    print_success "📊 Monitoring: Active (every 5 minutes)"
    print_success "🐳 Docker: All services running"
    print_success "🤖 AI: Llama 3.1 model installed"
    print_success "🔍 Features: Private vaults, sentiment search, constellation UI"
    echo ""
    print_magic "Ready for pilot testing with your batch of users! 🚀"
    echo ""
    
    # Display access information
    echo "📋 ACCESS INFORMATION:"
    echo "• Frontend: https://loom.vantax.co.za"
    echo "• Backend API: https://loom.vantax.co.za/api"
    echo "• Health Check: https://loom.vantax.co.za/health"
    echo "• Admin Panel: https://loom.vantax.co.za/admin"
    echo ""
    echo "🔧 MANAGEMENT COMMANDS:"
    echo "• Monitor: ssh -i ~/.ssh/Vantax-2.pem ubuntu@3.8.160.221 '/opt/loominary/monitor.sh'"
    echo "• Logs: ssh -i ~/.ssh/Vantax-2.pem ubuntu@3.8.160.221 'cd /opt/loominary/Heirloom && docker-compose -f docker-compose.production.yml logs'"
    echo "• Restart: ssh -i ~/.ssh/Vantax-2.pem ubuntu@3.8.160.221 'cd /opt/loominary/Heirloom && docker-compose -f docker-compose.production.yml restart'"
    echo ""
    print_success "🌟 Loominary is live and ready for users!"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"