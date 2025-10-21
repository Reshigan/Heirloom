#!/bin/bash

echo "🚀 LOOMINARY QUICK DEPLOYMENT"
echo "============================="

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm ci --production
cd ../sveltekit-app && npm ci && npm run build
cd ..

# Setup database
echo "🗄️ Setting up database..."
cd backend
npx prisma generate
npx prisma db push
cd ..

# Create directories
mkdir -p logs uploads
chmod 755 uploads

# Start with PM2
echo "🚀 Starting services..."
pm2 start ecosystem.config.js
pm2 save

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "📊 Health: http://localhost:3001/health"
