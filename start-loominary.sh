#!/bin/bash

# 🌟 LOOMINARY START SCRIPT 🌟
# Starts all Loominary services

echo "🌟 Starting Loominary Services"
echo "=============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
GOLD='\033[1;33m'
NC='\033[0m'

# Create logs directory
mkdir -p logs

echo -e "${GOLD}[1/4]${NC} Starting Backend API..."
cd backend
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

echo -e "${GOLD}[2/4]${NC} Starting Frontend..."
cd sveltekit-app
npm run preview -- --port 3000 --host 0.0.0.0 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

echo -e "${GOLD}[3/4]${NC} Waiting for services to start..."
sleep 10

echo -e "${GOLD}[4/4]${NC} Checking service health..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API${NC} - Running on port 3001"
else
    echo -e "❌ Backend API - Failed to start"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend${NC} - Running on port 3000"
else
    echo -e "❌ Frontend - Failed to start"
fi

echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo ""
echo -e "${GREEN}🚀 Loominary is running!${NC}"