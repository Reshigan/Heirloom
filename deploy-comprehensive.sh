#!/bin/bash

# Loominary Comprehensive Production Deployment Script
# This script deploys the Loominary platform to production with full error handling

set -e

echo "🚀 Starting Loominary Comprehensive Production Deployment..."

# Configuration
DEPLOY_DIR="/opt/loominary/Heirloom"
FRONTEND_DIR="$DEPLOY_DIR/sveltekit-app"
NGINX_CONFIG="/etc/nginx/sites-available/loom.vantax.co.za"
DOMAIN="loom.vantax.co.za"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Deploy frontend
deploy_frontend() {
    log "Deploying frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log "Installing frontend dependencies..."
    npm ci
    
    # Build frontend
    log "Building frontend..."
    npm run build
    
    # Stop existing frontend service
    log "Stopping existing frontend service..."
    pkill -f "vite preview" || true
    sleep 5
    
    # Start frontend service
    log "Starting frontend service..."
    nohup npm run preview -- --host 0.0.0.0 --port 3002 > /tmp/frontend.log 2>&1 &
    
    # Wait for frontend to start
    sleep 15
    
    # Check if frontend is running
    if curl -f http://localhost:3002 > /dev/null 2>&1; then
        success "Frontend is running on port 3002"
    else
        error "Frontend failed to start"
    fi
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Update Nginx configuration to use port 3002
    sudo sed -i 's/localhost:3001/localhost:3002/g' "$NGINX_CONFIG" || true
    sudo sed -i 's/localhost:3000/localhost:3002/g' "$NGINX_CONFIG" || true
    
    # Test Nginx configuration
    if sudo nginx -t; then
        success "Nginx configuration is valid"
        
        # Reload Nginx
        sudo systemctl reload nginx
        success "Nginx reloaded"
    else
        error "Nginx configuration is invalid"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if services are responding
    local checks_passed=0
    local total_checks=2
    
    # Check frontend
    if curl -f http://localhost:3002 > /dev/null 2>&1; then
        success "Frontend health check passed"
        ((checks_passed++))
    else
        warning "Frontend health check failed"
    fi
    
    # Check Nginx
    if curl -f -H "Host: $DOMAIN" https://localhost/health -k > /dev/null 2>&1; then
        success "Nginx health check passed"
        ((checks_passed++))
    else
        warning "Nginx health check failed"
    fi
    
    log "Health check results: $checks_passed/$total_checks checks passed"
    
    if [ $checks_passed -ge 1 ]; then
        success "Deployment health check passed"
    else
        error "Deployment health check failed"
    fi
}

# Main deployment function
main() {
    log "🌟 Loominary Comprehensive Deployment Starting..."
    
    deploy_frontend
    configure_nginx
    health_check
    
    success "🎉 Loominary deployment completed successfully!"
    log "🌐 Your application is now available at: https://$DOMAIN"
    log "📊 Health check: https://$DOMAIN/health"
    
    # Display service status
    log "📋 Service Status:"
    echo "Frontend: $(curl -s http://localhost:3002 > /dev/null && echo "✅ Running" || echo "❌ Not responding")"
    echo "Nginx: $(systemctl is-active nginx | grep -q "active" && echo "✅ Running" || echo "❌ Not running")"
    
    log "🔧 IMPORTANT: Fix AWS Security Group to allow HTTP/HTTPS traffic!"
    log "   1. Open AWS Console"
    log "   2. Go to EC2 → Security Groups"
    log "   3. Find security group for instance $(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo 'UNKNOWN')"
    log "   4. Add inbound rules:"
    log "      - HTTP (port 80) from 0.0.0.0/0"
    log "      - HTTPS (port 443) from 0.0.0.0/0"
}

# Run main function
main "$@"
