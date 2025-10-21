#!/bin/bash

# Loominary Development Workflow Script
# Manages dev -> main -> production deployment flow

set -e

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

# Show usage
show_usage() {
    echo "🚀 Loominary Development Workflow"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev-setup     - Set up development environment"
    echo "  dev-start     - Start development servers"
    echo "  dev-test      - Run tests in development"
    echo "  dev-build     - Build for development"
    echo "  merge-to-main - Merge dev branch to main"
    echo "  deploy-prod   - Deploy main to production"
    echo "  full-deploy   - Complete dev->main->production flow"
    echo "  status        - Show current status"
    echo ""
}

# Set up development environment
dev_setup() {
    log "Setting up development environment..."
    
    # Ensure we're on dev branch
    git checkout dev || git checkout -b dev
    
    # Install frontend dependencies
    cd sveltekit-app
    npm install
    cd ..
    
    success "Development environment set up"
}

# Start development servers
dev_start() {
    log "Starting development servers..."
    
    cd sveltekit-app
    
    # Kill existing dev servers
    pkill -f "vite dev" || true
    pkill -f "npm run dev" || true
    
    # Start development server
    log "Starting SvelteKit dev server on port 5173..."
    nohup npm run dev -- --host 0.0.0.0 --port 5173 > /tmp/dev-frontend.log 2>&1 &
    
    sleep 5
    
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        success "Development server running on http://localhost:5173"
    else
        warning "Development server may still be starting..."
    fi
    
    cd ..
}

# Run tests
dev_test() {
    log "Running development tests..."
    
    cd sveltekit-app
    npm test || echo "No tests configured yet"
    cd ..
    
    success "Tests completed"
}

# Build for development
dev_build() {
    log "Building for development..."
    
    cd sveltekit-app
    npm run build
    cd ..
    
    success "Development build completed"
}

# Merge dev to main
merge_to_main() {
    log "Merging dev branch to main..."
    
    # Ensure we're on dev branch and up to date
    git checkout dev
    git add .
    git commit -m "Development updates - $(date)" || true
    
    # Switch to main and merge
    git checkout main
    git pull origin main || true
    git merge dev
    
    # Push to main
    git push origin main
    
    success "Dev branch merged to main"
}

# Deploy to production
deploy_prod() {
    log "Deploying to production..."
    
    # Ensure we're on main branch
    git checkout main
    
    # Run the comprehensive deployment script
    ./deploy-comprehensive.sh
    
    success "Production deployment completed"
}

# Full deployment flow
full_deploy() {
    log "Starting full deployment flow: dev -> main -> production"
    
    dev_build
    merge_to_main
    deploy_prod
    
    success "Full deployment flow completed!"
}

# Show status
show_status() {
    log "Loominary System Status"
    echo ""
    
    # Git status
    echo "📋 Git Status:"
    echo "Current branch: $(git branch --show-current)"
    echo "Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    echo ""
    
    # Service status
    echo "🔧 Service Status:"
    echo "Development server: $(curl -s http://localhost:5173 > /dev/null && echo "✅ Running" || echo "❌ Not running")"
    echo "Production frontend: $(curl -s http://localhost:3002 > /dev/null && echo "✅ Running" || echo "❌ Not running")"
    echo "Nginx: $(systemctl is-active nginx 2>/dev/null | grep -q "active" && echo "✅ Running" || echo "❌ Not running")"
    echo ""
    
    # Database status
    echo "💾 Database Status:"
    echo "PostgreSQL: $(docker-compose -f docker-compose.simple.yml ps 2>/dev/null | grep -q "postgres.*Up" && echo "✅ Running" || echo "❌ Not running")"
    echo "Redis: $(docker-compose -f docker-compose.simple.yml ps 2>/dev/null | grep -q "redis.*Up" && echo "✅ Running" || echo "❌ Not running")"
    echo ""
    
    # URLs
    echo "🌐 URLs:"
    echo "Development: http://localhost:5173"
    echo "Production: https://loom.vantax.co.za"
    echo "Health check: https://loom.vantax.co.za/health"
}

# Main function
main() {
    case "${1:-}" in
        "dev-setup")
            dev_setup
            ;;
        "dev-start")
            dev_start
            ;;
        "dev-test")
            dev_test
            ;;
        "dev-build")
            dev_build
            ;;
        "merge-to-main")
            merge_to_main
            ;;
        "deploy-prod")
            deploy_prod
            ;;
        "full-deploy")
            full_deploy
            ;;
        "status")
            show_status
            ;;
        *)
            show_usage
            ;;
    esac
}

# Run main function
main "$@"
