#!/bin/bash

# Loominary Services Startup Script
echo "🏛️  Starting Loominary Services..."

# Kill any existing processes
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite preview" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Start backend (without Redis dependency for now)
echo "🔧 Starting backend on port 3001..."
cd /workspace/project/Heirloom/backend
PORT=3001 npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🌐 Starting frontend on port 12000..."
cd /workspace/project/Heirloom/sveltekit-app
npm run preview -- --port 12000 --host 0.0.0.0 > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for services to start
sleep 3

echo "✅ Services started!"
echo "📊 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:12000 (or next available port)"
echo ""
echo "📋 Process IDs:"
echo "   Backend: $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f /workspace/project/Heirloom/backend.log"
echo "   Frontend: tail -f /workspace/project/Heirloom/frontend.log"
echo ""
echo "🔍 Health check: curl http://localhost:3001/health"