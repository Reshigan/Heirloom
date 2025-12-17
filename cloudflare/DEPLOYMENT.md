# Heirloom Deployment Guide - Cloudflare

This guide walks you through deploying Heirloom on Cloudflare's global edge network.

## 📋 Prerequisites

1. **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)
2. **Node.js 18+** - [Download](https://nodejs.org/)
3. **Wrangler CLI** - `npm install -g wrangler`
4. **Domain** (optional) - For custom domain like `heirloom.blue`

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone and enter directory
cd heirloom-cloudflare

# 2. Login to Cloudflare
wrangler login

# 3. Run setup script
./scripts/setup.sh

# 4. Deploy
./scripts/deploy.sh
```

## 📖 Step-by-Step Guide

### Step 1: Login to Cloudflare

```bash
wrangler login
```

This opens a browser window to authenticate with your Cloudflare account.

### Step 2: Create D1 Database

```bash
# Create the database
wrangler d1 create heirloom-db

# You'll see output like:
# ✅ Successfully created DB 'heirloom-db'
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "heirloom-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id` and update `wrangler.toml`:**

```toml
[[d1_databases]]
binding = "DB"
database_name = "heirloom-db"
database_id = "YOUR-DATABASE-ID-HERE"  # ← Paste here
```

### Step 3: Create KV Namespace

```bash
# Create KV for sessions
wrangler kv:namespace create KV

# You'll see:
# 🌀 Creating namespace with title "heirloom-api-KV"
# ✅ Success!
# Add the following to your configuration file:
# [[kv_namespaces]]
# binding = "KV"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Update `wrangler.toml` with the KV id.**

### Step 4: Create R2 Bucket

```bash
# Create storage bucket
wrangler r2 bucket create heirloom-uploads

# Verify it was created
wrangler r2 bucket list
```

### Step 5: Run Database Migrations

```bash
# Apply schema to D1
wrangler d1 execute heirloom-db --file=./migrations/0001_initial.sql

# Verify tables were created
wrangler d1 execute heirloom-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

### Step 6: Set Secrets

```bash
# JWT Secret (generate a random string)
wrangler secret put JWT_SECRET
# Enter: (paste a 64-character random string)

# Stripe API Key
wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_live_... or sk_test_...

# Stripe Webhook Secret
wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter: whsec_...

# Email Service (Resend)
wrangler secret put RESEND_API_KEY
# Enter: re_...
```

**Generate a secure JWT secret:**
```bash
openssl rand -hex 32
```

### Step 7: Deploy Worker API

```bash
cd worker
npm install
npm run deploy

# You'll see:
# ✨ Successfully deployed to:
# https://heirloom-api.YOUR-SUBDOMAIN.workers.dev
```

### Step 8: Deploy Frontend

```bash
cd frontend
npm install

# Update API URL in .env
echo "VITE_API_URL=https://heirloom-api.YOUR-SUBDOMAIN.workers.dev" > .env

# Build and deploy
npm run deploy

# You'll see:
# ✨ Deployed to:
# https://heirloom.pages.dev
```

## 🌐 Custom Domain Setup

### For API (Workers)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select **Workers & Pages** → **heirloom-api**
3. Click **Settings** → **Triggers** → **Add Custom Domain**
4. Enter: `api.heirloom.blue`
5. Click **Add Custom Domain**

### For Frontend (Pages)

1. Go to **Workers & Pages** → **heirloom**
2. Click **Custom domains** → **Set up a custom domain**
3. Enter: `heirloom.blue` and `www.heirloom.blue`
4. Follow DNS setup instructions

## 🔧 Configuration Reference

### wrangler.toml

```toml
name = "heirloom-api"
main = "worker/src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "heirloom-db"
database_id = "YOUR-ID"

# R2 Storage
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "heirloom-uploads"

# KV Sessions
[[kv_namespaces]]
binding = "KV"
id = "YOUR-ID"

# Cron Jobs
[triggers]
crons = ["0 9 * * *", "0 0 * * 0"]

# Environment Variables
[vars]
ENVIRONMENT = "production"
APP_URL = "https://heirloom.blue"
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Runtime environment | `production` |
| `APP_URL` | Frontend URL | `https://heirloom.blue` |
| `JWT_SECRET` | Auth token signing key | (64 char random) |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | `whsec_...` |
| `RESEND_API_KEY` | Email service API key | `re_...` |

## 📊 Monitoring & Logs

### Real-time Logs

```bash
# Stream all logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by search term
wrangler tail --search "auth"
```

### Analytics

1. Go to Cloudflare Dashboard
2. Select **Workers & Pages** → **heirloom-api**
3. Click **Analytics** tab

View:
- Request count
- Error rates
- CPU time usage
- Geographic distribution

## 🔄 Updates & Rollbacks

### Deploy Update

```bash
# Deploy new worker version
cd worker && npm run deploy

# Deploy new frontend
cd frontend && npm run deploy
```

### Rollback

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback
```

## 🧪 Local Development

```bash
# Terminal 1: Worker with local D1/R2/KV
cd worker
npm run dev
# API at http://localhost:8787

# Terminal 2: Frontend
cd frontend
npm run dev
# App at http://localhost:3000
```

### Local Database

```bash
# Apply migrations locally
wrangler d1 execute heirloom-db --local --file=./migrations/0001_initial.sql

# Query local database
wrangler d1 execute heirloom-db --local --command "SELECT * FROM users"
```

## 🛠️ Troubleshooting

### "Database not found"

```bash
# Verify database exists
wrangler d1 list

# Check wrangler.toml has correct database_id
```

### "KV namespace not found"

```bash
# List KV namespaces
wrangler kv:namespace list

# Update wrangler.toml with correct id
```

### "R2 bucket not found"

```bash
# List buckets
wrangler r2 bucket list

# Verify bucket_name in wrangler.toml
```

### Worker deployment fails

```bash
# Check for TypeScript errors
cd worker && npx tsc --noEmit

# Check wrangler config
wrangler whoami
```

## 📈 Scaling

Cloudflare automatically scales to handle traffic. No configuration needed!

| Traffic Level | Automatic Handling |
|---------------|-------------------|
| 100 req/min | ✅ |
| 10,000 req/min | ✅ |
| 1,000,000 req/min | ✅ |
| 50,000,000 req/sec | ✅ (Cloudflare's proven capacity) |

## 💰 Cost Optimization

### Free Tier Limits

| Resource | Free Tier |
|----------|-----------|
| Workers requests | 100,000/day |
| D1 reads | 5M/day |
| D1 writes | 100K/day |
| D1 storage | 5 GB |
| R2 storage | 10 GB |
| R2 operations | 10M/month |
| KV reads | 100K/day |
| KV writes | 1K/day |

### Paid Plan ($5/month)

Removes most limits and adds:
- 10M+ Worker requests
- More D1/R2/KV capacity
- Cron Triggers
- Durable Objects

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET (64+ characters)
- [ ] Stripe webhook signature verification enabled
- [ ] CORS configured for your domains only
- [ ] Rate limiting enabled
- [ ] All secrets stored via `wrangler secret`
- [ ] Custom domain with SSL (automatic)

## 📞 Support

- **Cloudflare Docs**: https://developers.cloudflare.com
- **Discord**: https://discord.gg/cloudflaredev
- **Heirloom Support**: support@heirloom.blue
