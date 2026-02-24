
#!/bin/bash

# Heirloom Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying Heirloom to $ENVIRONMENT..."

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    source ".env.$ENVIRONMENT"
elif [ -f ".env" ]; then
    source ".env"
fi

# Validate required variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN is required"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ CLOUDFLARE_ACCOUNT_ID is required"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci
npm run build
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci
npm run build
cd ..

# Install worker dependencies
echo "Installing worker dependencies..."
cd cloudflare/worker
npm ci
npm run build
cd ../..

echo "🔐 Deploying Cloudflare Worker..."
cd cloudflare/worker
npx wrangler deploy --env $ENVIRONMENT
cd ../..

echo "🌐 Deploying Frontend to Cloudflare Pages..."
cd frontend
npx wrangler pages deploy ./dist --project-name=heirloom-frontend --branch=$ENVIRONMENT
cd ..

echo "✅ Deployment completed successfully!"

# Run database migrations if needed
if [ "$ENVIRONMENT" = "production" ]; then
    echo "📊 Running database migrations..."
    cd backend
    npx prisma migrate deploy
    cd ..
fi

echo "🎉 Heirloom successfully deployed to $ENVIRONMENT!"
