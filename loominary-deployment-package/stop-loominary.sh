#!/bin/bash

# 🌟 LOOMINARY STOP SCRIPT 🌟
# Stops all Loominary services

echo "🛑 Stopping Loominary Services"
echo "=============================="

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}[1/2]${NC} Stopping Backend API..."
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    kill $BACKEND_PID 2>/dev/null && echo -e "${RED}✅ Backend stopped${NC}" || echo "Backend not running"
    rm -f logs/backend.pid
else
    pkill -f "production-server" && echo -e "${RED}✅ Backend stopped${NC}" || echo "Backend not running"
fi

echo -e "${YELLOW}[2/2]${NC} Stopping Frontend..."
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo -e "${RED}✅ Frontend stopped${NC}" || echo "Frontend not running"
    rm -f logs/frontend.pid
else
    pkill -f "vite preview" && echo -e "${RED}✅ Frontend stopped${NC}" || echo "Frontend not running"
fi

echo ""
echo -e "${RED}🛑 Loominary services stopped${NC}"