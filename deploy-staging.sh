#!/bin/bash
set -e

echo "🚀 Deploying Heirloom to Staging..."

cd /home/ubuntu/Heirloom

echo "📥 Pulling latest changes from main branch..."
git fetch origin
git checkout main
git pull origin main

echo "📦 Installing backend dependencies..."
cd backend-node
npm install
npx prisma generate
npx prisma migrate deploy

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
npm run build

echo "🔄 Restarting Docker services..."
cd ..
docker-compose down
docker-compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

echo "🏥 Checking service health..."
docker-compose ps

echo "🔍 Checking backend health..."
curl -f http://localhost:3001/api/health || echo "⚠️  Backend health check failed"

echo "🔍 Checking frontend..."
curl -f http://localhost:3000 || echo "⚠️  Frontend check failed"

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://loom.vantax.co.za"
echo "🔧 Backend: https://loom.vantax.co.za/api"
