#!/bin/bash

# 🌟 LOOMINARY RESTART SCRIPT 🌟
# Restarts all Loominary services

echo "🔄 Restarting Loominary Services"
echo "==============================="

# Stop services
./stop-loominary.sh

# Wait a moment
sleep 3

# Start services
./start-loominary.sh