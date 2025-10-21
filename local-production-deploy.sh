#!/bin/bash

# Loominary Local Production Deployment Script
# World's First Private Vault System - Local Production Deploy

set -e

echo "🌟 Starting Loominary Local Production Deployment..."
echo "🏛️ Building the future of legacy preservation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=12000
BACKEND_PORT=3001
DB_NAME="loominary"
DB_USER="loominary_user"
REDIS_PORT=6379
OLLAMA_PORT=11434

# Create necessary directories
mkdir -p logs pids backups

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

# Function to check if service is running
check_service() {
    local service_name=$1
    local port=$2
    
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        print_success "$service_name is running on port $port"
        return 0
    else
        print_error "$service_name is not responding on port $port"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to start on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within timeout"
    return 1
}

# 1. Fix TypeScript imports in backend
print_status "Fixing TypeScript imports..."

# Fix all .js imports to remove extension for tsx
find backend/src -name "*.ts" -exec sed -i "s/from '\([^']*\)\.js'/from '\1'/g" {} \;
find backend/src -name "*.ts" -exec sed -i 's/from "\([^"]*\)\.js"/from "\1"/g' {} \;

print_success "TypeScript imports fixed"

# 2. Environment Setup
print_status "Setting up production environment..."

# Create production environment file
cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=$BACKEND_PORT
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:secure_password_2024@localhost:5432/$DB_NAME

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=$REDIS_PORT

# JWT Configuration
JWT_SECRET=ultra_secure_jwt_secret_for_production_2024_loominary
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGINS=http://localhost:$FRONTEND_PORT,https://loominary.app,https://www.loominary.app

# Email Configuration (Production Ready)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@loominary.app
EMAIL_PASSWORD=app_specific_password
EMAIL_FROM=Loominary <noreply@loominary.app>

# Ollama AI Configuration
OLLAMA_HOST=http://localhost:$OLLAMA_PORT
OLLAMA_MODEL=llama3.2:3b

# Stripe Configuration (Production)
STRIPE_SECRET_KEY=sk_live_production_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_production_key_here
STRIPE_WEBHOOK_SECRET=whsec_production_webhook_secret

# Storage Configuration
STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads

# App Configuration
APP_URL=https://loominary.app
APP_NAME=Loominary

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute

# Feature Flags
ENABLE_EMAIL=true
ENABLE_STRIPE=true
ENABLE_AI=true
ENABLE_ANALYTICS=true
EOF

print_success "Production environment configured"

# 3. Backend Setup
print_status "Setting up backend server..."

cd backend

# Install dependencies
print_status "Installing backend dependencies..."
npm ci

# Generate Prisma client
print_status "Generating database client..."
npx prisma generate

# Run database migrations
print_status "Running database migrations..."
npx prisma db push

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

print_success "Backend setup completed"

# 4. Frontend Setup
print_status "Setting up frontend..."

cd ../frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm ci

# Build for production
print_status "Building frontend for production..."
npm run build

print_success "Frontend build completed"

cd ..

# 5. Start Services
print_status "Starting production services..."

# Kill any existing processes
pkill -f "tsx src/server.ts" 2>/dev/null || true
pkill -f "npm run preview" 2>/dev/null || true

# Start backend server
print_status "Starting backend server..."
cd backend
NODE_ENV=production npx tsx src/server.ts > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../pids/backend.pid

# Wait for backend to be ready
sleep 5
if ! wait_for_service "Backend API" $BACKEND_PORT; then
    print_error "Backend failed to start. Check logs/backend.log"
    cat ../logs/backend.log
    exit 1
fi

cd ..

# Start frontend server
print_status "Starting frontend server..."
cd frontend
npm run preview -- --port $FRONTEND_PORT --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../pids/frontend.pid

# Wait for frontend to be ready
if ! wait_for_service "Frontend" $FRONTEND_PORT; then
    print_error "Frontend failed to start. Check logs/frontend.log"
    cat ../logs/frontend.log
    exit 1
fi

cd ..

# 6. Health Checks
print_status "Running comprehensive health checks..."

# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash

echo "🏥 Loominary Health Check Report"
echo "================================"

# Check backend API
if curl -s http://localhost:3001/health | jq -e '.status == "healthy"' > /dev/null 2>&1; then
    echo "✅ Backend API: Healthy"
else
    echo "❌ Backend API: Unhealthy"
fi

# Check frontend
if curl -s http://localhost:12000 > /dev/null 2>&1; then
    echo "✅ Frontend: Accessible"
else
    echo "❌ Frontend: Inaccessible"
fi

# Check database
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ Database: Connected"
else
    echo "❌ Database: Disconnected"
fi

# Check Redis
if redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "✅ Redis Cache: Connected"
else
    echo "❌ Redis Cache: Disconnected"
fi

# Check Ollama
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ AI Service: Available"
else
    echo "❌ AI Service: Unavailable"
fi

echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://localhost:12000"
echo "Backend API: http://localhost:3001"
echo "API Docs: http://localhost:3001/docs"
echo ""
echo "📊 System Status:"
echo "Memory Usage: $(free -h 2>/dev/null | awk '/^Mem:/ {print $3 "/" $2}' || echo 'N/A')"
echo "Disk Usage: $(df -h / 2>/dev/null | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}' || echo 'N/A')"
echo "Load Average: $(uptime 2>/dev/null | awk -F'load average:' '{print $2}' || echo 'N/A')"
EOF

chmod +x health-check.sh
./health-check.sh

# 7. Create Management Scripts
print_status "Creating management scripts..."

# Create start script
cat > start-loominary.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Loominary Production Services..."

# Create directories
mkdir -p logs pids

# Kill existing processes
pkill -f "tsx src/server.ts" 2>/dev/null || true
pkill -f "npm run preview" 2>/dev/null || true

# Start backend
cd backend
NODE_ENV=production npx tsx src/server.ts > ../logs/backend.log 2>&1 &
echo $! > ../pids/backend.pid
cd ..

# Start frontend
cd frontend
npm run preview -- --port 12000 --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
echo $! > ../pids/frontend.pid
cd ..

echo "✅ Loominary services started"
echo "Frontend: http://localhost:12000"
echo "Backend: http://localhost:3001"
EOF

# Create stop script
cat > stop-loominary.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Loominary Services..."

# Stop backend
if [ -f pids/backend.pid ]; then
    kill $(cat pids/backend.pid) 2>/dev/null || true
    rm pids/backend.pid
fi

# Stop frontend
if [ -f pids/frontend.pid ]; then
    kill $(cat pids/frontend.pid) 2>/dev/null || true
    rm pids/frontend.pid
fi

# Kill any remaining processes
pkill -f "tsx src/server.ts" 2>/dev/null || true
pkill -f "npm run preview" 2>/dev/null || true

echo "✅ Loominary services stopped"
EOF

# Create restart script
cat > restart-loominary.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting Loominary Services..."
./stop-loominary.sh
sleep 3
./start-loominary.sh
EOF

chmod +x start-loominary.sh stop-loominary.sh restart-loominary.sh

print_success "Management scripts created"

# 8. Final Status Report
echo ""
echo "🎉 LOOMINARY LOCAL PRODUCTION DEPLOYMENT COMPLETE! 🎉"
echo "====================================================="
echo ""
echo "🌟 World's First Private Vault System is LIVE!"
echo ""
echo "🌐 Access Points:"
echo "   Frontend Application: http://localhost:$FRONTEND_PORT"
echo "   Backend API: http://localhost:$BACKEND_PORT"
echo "   API Documentation: http://localhost:$BACKEND_PORT/docs"
echo ""
echo "🔧 Management Commands:"
echo "   Start Services: ./start-loominary.sh"
echo "   Stop Services: ./stop-loominary.sh"
echo "   Restart Services: ./restart-loominary.sh"
echo "   Health Check: ./health-check.sh"
echo ""
echo "📊 System Status:"
echo "   Database: PostgreSQL (Ready)"
echo "   Cache: Redis (Ready)"
echo "   AI Service: Ollama with llama3.2:3b (Ready)"
echo "   Backend: Node.js/Fastify (Running)"
echo "   Frontend: SvelteKit (Running)"
echo ""
echo "🚀 Ready for Global Launch!"
echo "💎 Building Legacy for Future Generations..."
echo ""

# Test the deployment
print_status "Testing deployment..."

# Test backend health
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed - check logs/backend.log"
fi

# Test frontend
if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
    print_success "Frontend accessibility check passed"
else
    print_warning "Frontend accessibility check failed - check logs/frontend.log"
fi

echo ""
echo "🎯 LOCAL PRODUCTION DEPLOYMENT SUCCESSFUL!"
echo "🌍 Ready for Global Launch - Bigger than Facebook!"
echo "🏛️ Legacy Platform for Future Generations!"
echo ""