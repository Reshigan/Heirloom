#!/bin/bash

# Heirloom Cloudflare Setup Script
# Run this to set up all Cloudflare resources

set -e

echo "🌟 Heirloom Cloudflare Setup"
echo "============================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in
echo "📋 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare..."
    wrangler login
fi

echo "✅ Authenticated with Cloudflare"
echo ""

# Create D1 Database
echo "📊 Creating D1 Database..."
D1_OUTPUT=$(wrangler d1 create heirloom-db 2>&1 || true)

if echo "$D1_OUTPUT" | grep -q "already exists"; then
    echo "   Database 'heirloom-db' already exists"
else
    echo "$D1_OUTPUT"
    echo "   ✅ Database created"
fi

# Extract database ID
D1_ID=$(wrangler d1 list --json 2>/dev/null | grep -A2 '"name": "heirloom-db"' | grep '"uuid"' | sed 's/.*: "\(.*\)".*/\1/' || echo "")

if [ -n "$D1_ID" ]; then
    echo "   Database ID: $D1_ID"
fi

echo ""

# Create KV Namespace
echo "🗄️  Creating KV Namespace..."
KV_OUTPUT=$(wrangler kv:namespace create KV 2>&1 || true)

if echo "$KV_OUTPUT" | grep -q "already exists"; then
    echo "   KV namespace already exists"
else
    echo "$KV_OUTPUT" | grep -E "(id|Success)" || true
    echo "   ✅ KV namespace created"
fi

echo ""

# Create R2 Bucket
echo "📦 Creating R2 Bucket..."
R2_OUTPUT=$(wrangler r2 bucket create heirloom-uploads 2>&1 || true)

if echo "$R2_OUTPUT" | grep -q "already exists"; then
    echo "   Bucket 'heirloom-uploads' already exists"
else
    echo "   ✅ R2 bucket created"
fi

echo ""

# Run migrations
echo "🔧 Running database migrations..."
wrangler d1 execute heirloom-db --file=./migrations/0001_initial.sql 2>&1 || echo "   (Migrations may have already been applied)"
echo "   ✅ Migrations complete"

echo ""

# Install dependencies
echo "📥 Installing dependencies..."
echo "   Installing worker dependencies..."
cd worker && npm install --silent && cd ..
echo "   Installing frontend dependencies..."
cd frontend && npm install --silent && cd ..
echo "   ✅ Dependencies installed"

echo ""
echo "============================"
echo "🎉 Setup Complete!"
echo "============================"
echo ""
echo "Next steps:"
echo ""
echo "1. Update wrangler.toml with your resource IDs:"
echo "   - D1 database_id"
echo "   - KV namespace id"
echo ""
echo "2. Set secrets:"
echo "   wrangler secret put JWT_SECRET"
echo "   wrangler secret put STRIPE_SECRET_KEY"
echo "   wrangler secret put RESEND_API_KEY"
echo ""
echo "3. Deploy:"
echo "   ./scripts/deploy.sh"
echo ""
echo "Or for local development:"
echo "   cd worker && npm run dev"
echo "   cd frontend && npm run dev"
echo ""
