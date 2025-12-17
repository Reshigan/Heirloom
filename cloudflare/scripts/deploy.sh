#!/bin/bash

# Heirloom Cloudflare Deploy Script
# Deploys both worker and frontend to production

set -e

echo "🚀 Heirloom Deployment"
echo "======================"
echo ""

# Check environment
ENV=${1:-production}
echo "📍 Deploying to: $ENV"
echo ""

# Deploy Worker
echo "☁️  Deploying Worker API..."
cd worker

if [ "$ENV" = "staging" ]; then
    npx wrangler deploy --env staging
else
    npx wrangler deploy
fi

WORKER_URL=$(npx wrangler deployments list --json 2>/dev/null | head -1 | grep -o 'https://[^"]*' || echo "https://heirloom-api.workers.dev")
echo "   ✅ Worker deployed: $WORKER_URL"

cd ..
echo ""

# Build Frontend
echo "🏗️  Building Frontend..."
cd frontend

# Set API URL based on environment
if [ "$ENV" = "staging" ]; then
    export VITE_API_URL="https://api-staging.heirloom.blue"
else
    export VITE_API_URL="https://api.heirloom.blue"
fi

npm run build
echo "   ✅ Frontend built"
echo ""

# Deploy Frontend
echo "📄 Deploying Frontend..."
if [ "$ENV" = "staging" ]; then
    npx wrangler pages deploy dist --project-name=heirloom-staging
else
    npx wrangler pages deploy dist --project-name=heirloom
fi

echo "   ✅ Frontend deployed"

cd ..
echo ""

echo "======================"
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "URLs:"
echo "  Frontend: https://heirloom.blue (or .pages.dev)"
echo "  API:      https://api.heirloom.blue (or .workers.dev)"
echo ""
echo "Monitor logs:"
echo "  wrangler tail"
echo ""
