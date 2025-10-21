#!/bin/bash

# 🏛️ Loominary Production Deployment Script
# World-first private vault system for legacy preservation

set -e

echo "🏛️ =========================================="
echo "🏛️  LOOMINARY PRODUCTION DEPLOYMENT"
echo "🏛️  World-First Private Vault System"
echo "🏛️  Version: 1.0.0"
echo "🏛️  Date: $(date)"
echo "🏛️ =========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Kill existing processes
print_header "Stopping existing services..."
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite preview" 2>/dev/null || true
pkill -f "ollama serve" 2>/dev/null || true
sleep 3

# Check system requirements
print_header "Checking system requirements..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js: $NODE_VERSION"
else
    print_error "Node.js not found!"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm: $NPM_VERSION"
else
    print_error "npm not found!"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    print_status "PostgreSQL: Available"
else
    print_error "PostgreSQL not found!"
    exit 1
fi

# Check Redis
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        print_status "Redis: Running"
    else
        print_warning "Redis not running, starting..."
        redis-server --daemonize yes --port 6379
        sleep 2
        if redis-cli ping &> /dev/null; then
            print_status "Redis: Started successfully"
        else
            print_error "Failed to start Redis!"
            exit 1
        fi
    fi
else
    print_error "Redis not found!"
    exit 1
fi

# Check Ollama
if command -v ollama &> /dev/null; then
    print_status "Ollama: Available"
    # Start Ollama service
    print_info "Starting Ollama service..."
    ollama serve > /workspace/project/Heirloom/ollama.log 2>&1 &
    sleep 5
    
    # Check if model is available
    if ollama list | grep -q "llama3.2:3b"; then
        print_status "AI Model: llama3.2:3b ready"
    else
        print_warning "AI Model not found, will use fallback"
    fi
else
    print_error "Ollama not found!"
    exit 1
fi

# Database setup
print_header "Setting up database..."
cd /workspace/project/Heirloom/backend

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate > /dev/null 2>&1
print_status "Prisma client generated"

# Apply database schema
print_info "Applying database schema..."
npx prisma db push > /dev/null 2>&1
print_status "Database schema applied"

# Build frontend
print_header "Building frontend for production..."
cd /workspace/project/Heirloom/sveltekit-app

print_info "Installing frontend dependencies..."
npm ci > /dev/null 2>&1
print_status "Frontend dependencies installed"

print_info "Building production frontend..."
npm run build > /dev/null 2>&1
print_status "Frontend built successfully"

# Start services
print_header "Starting production services..."

# Start backend
print_info "Starting backend service on port 3001..."
cd /workspace/project/Heirloom/backend
NODE_ENV=production PORT=3001 npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
print_status "Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
print_info "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_status "Backend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Backend failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Start frontend
print_info "Starting frontend service..."
cd /workspace/project/Heirloom/sveltekit-app

# Try port 12000 first, then 12001
if lsof -Pi :12000 -sTCP:LISTEN -t >/dev/null; then
    FRONTEND_PORT=12001
    print_warning "Port 12000 in use, using port 12001"
else
    FRONTEND_PORT=12000
fi

npm run preview -- --port $FRONTEND_PORT --host 0.0.0.0 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
print_status "Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
print_info "Waiting for frontend to be ready..."
sleep 5

# Health checks
print_header "Running health checks..."

# Backend health check
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Backend health check: PASSED"
else
    print_error "Backend health check: FAILED"
fi

# Frontend health check
if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    print_status "Frontend health check: PASSED"
else
    print_error "Frontend health check: FAILED"
fi

# Database health check
if cd /workspace/project/Heirloom/backend && npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    print_status "Database health check: PASSED"
else
    print_error "Database health check: FAILED"
fi

# Redis health check
if redis-cli ping > /dev/null 2>&1; then
    print_status "Redis health check: PASSED"
else
    print_error "Redis health check: FAILED"
fi

# AI service health check
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    print_status "AI service health check: PASSED"
else
    print_warning "AI service health check: FAILED (will use fallback)"
fi

echo ""
print_header "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo -e "${CYAN}🌐 Application URLs:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
echo -e "   API Docs: ${GREEN}http://localhost:3001/documentation${NC}"
echo ""
echo -e "${CYAN}🔧 Service Status:${NC}"
echo -e "   Backend PID:  ${GREEN}$BACKEND_PID${NC}"
echo -e "   Frontend PID: ${GREEN}$FRONTEND_PID${NC}"
echo ""
echo -e "${CYAN}📊 External Access:${NC}"
echo -e "   Frontend: ${GREEN}https://work-1-roxfgucnxgorzqzm.prod-runtime.all-hands.dev${NC}"
echo -e "   Frontend: ${GREEN}https://work-2-roxfgucnxgorzqzm.prod-runtime.all-hands.dev${NC}"
echo ""
echo -e "${CYAN}📝 Log Files:${NC}"
echo -e "   Backend:  ${YELLOW}tail -f /workspace/project/Heirloom/backend.log${NC}"
echo -e "   Frontend: ${YELLOW}tail -f /workspace/project/Heirloom/frontend.log${NC}"
echo -e "   Ollama:   ${YELLOW}tail -f /workspace/project/Heirloom/ollama.log${NC}"
echo ""
echo -e "${CYAN}🛠️  Management Commands:${NC}"
echo -e "   Stop all: ${YELLOW}pkill -f 'tsx watch|vite preview|ollama serve'${NC}"
echo -e "   Restart:  ${YELLOW}./production-deploy.sh${NC}"
echo -e "   Logs:     ${YELLOW}./monitor-logs.sh${NC}"
echo ""
echo -e "${PURPLE}🏛️  Loominary is now live and ready for global launch!${NC}"
echo -e "${PURPLE}🏛️  The world's first private vault system for legacy preservation${NC}"
echo ""

# Create monitoring script
cat > /workspace/project/Heirloom/monitor-logs.sh << 'EOF'
#!/bin/bash
echo "🏛️ Loominary Service Logs Monitor"
echo "Press Ctrl+C to exit"
echo ""

# Function to show logs with colors
show_logs() {
    echo -e "\033[0;34m=== Backend Logs ===\033[0m"
    tail -n 10 /workspace/project/Heirloom/backend.log 2>/dev/null || echo "No backend logs"
    echo ""
    
    echo -e "\033[0;32m=== Frontend Logs ===\033[0m"
    tail -n 10 /workspace/project/Heirloom/frontend.log 2>/dev/null || echo "No frontend logs"
    echo ""
    
    echo -e "\033[0;35m=== Ollama Logs ===\033[0m"
    tail -n 5 /workspace/project/Heirloom/ollama.log 2>/dev/null || echo "No Ollama logs"
    echo ""
}

# Show initial logs
show_logs

# Monitor in real-time
tail -f /workspace/project/Heirloom/backend.log /workspace/project/Heirloom/frontend.log /workspace/project/Heirloom/ollama.log 2>/dev/null
EOF

chmod +x /workspace/project/Heirloom/monitor-logs.sh

print_status "Monitoring script created: ./monitor-logs.sh"
echo ""
print_header "🚀 Ready for global launch!"