#!/bin/bash

# 🌟 LOOMINARY HEALTH CHECK 🌟
# Checks the health of all Loominary services

echo "🏥 Loominary Health Check"
echo "========================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

HEALTHY=0
UNHEALTHY=0

echo -e "${BLUE}Checking services...${NC}"
echo ""

# Check Backend API
echo -n "Backend API (port 3001): "
if curl -s --max-time 5 http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HEALTHY${NC}"
    HEALTHY=$((HEALTHY + 1))
else
    echo -e "${RED}❌ UNHEALTHY${NC}"
    UNHEALTHY=$((UNHEALTHY + 1))
fi

# Check Frontend
echo -n "Frontend (port 3000): "
if curl -s --max-time 5 http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HEALTHY${NC}"
    HEALTHY=$((HEALTHY + 1))
else
    echo -e "${RED}❌ UNHEALTHY${NC}"
    UNHEALTHY=$((UNHEALTHY + 1))
fi

# Check Database (if available)
echo -n "Database Connection: "
if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
        HEALTHY=$((HEALTHY + 1))
    else
        echo -e "${RED}❌ UNHEALTHY${NC}"
        UNHEALTHY=$((UNHEALTHY + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED (pg_isready not available)${NC}"
fi

# Check Redis (if available)
echo -n "Redis Cache: "
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping 2>/dev/null | grep -q PONG; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
        HEALTHY=$((HEALTHY + 1))
    else
        echo -e "${RED}❌ UNHEALTHY${NC}"
        UNHEALTHY=$((UNHEALTHY + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIPPED (redis-cli not available)${NC}"
fi

# Check Ollama AI (if available)
echo -n "Ollama AI Service: "
if curl -s --max-time 5 http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HEALTHY${NC}"
    HEALTHY=$((HEALTHY + 1))
else
    echo -e "${RED}❌ UNHEALTHY${NC}"
    UNHEALTHY=$((UNHEALTHY + 1))
fi

echo ""
echo "📊 Health Summary:"
echo -e "   Healthy: ${GREEN}$HEALTHY${NC}"
echo -e "   Unhealthy: ${RED}$UNHEALTHY${NC}"

if [ $UNHEALTHY -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All services are healthy!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some services need attention${NC}"
    exit 1
fi