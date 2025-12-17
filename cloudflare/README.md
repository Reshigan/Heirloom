# Heirloom - Cloudflare Edition

> **Your memories. Your voice. Your legacy. Forever.**

A globally distributed digital legacy platform running on Cloudflare's edge network.

## 🌍 Why Cloudflare?

| Benefit | Details |
|---------|---------|
| **Global Performance** | Code runs in 300+ cities, <50ms latency worldwide |
| **Zero Cold Starts** | Workers are always warm, instant response |
| **Zero Egress Fees** | R2 storage has no download charges |
| **Automatic Scaling** | Handles 0 to millions of requests seamlessly |
| **Built-in Security** | DDoS protection, WAF, SSL included |
| **Cost Effective** | ~$5-25/month for most applications |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   PAGES     │    │   WORKERS   │    │    R2       │     │
│  │  (Frontend) │───▶│   (API)     │───▶│  (Storage)  │     │
│  │  React SPA  │    │   Hono.js   │    │  S3-compat  │     │
│  └─────────────┘    └──────┬──────┘    └─────────────┘     │
│                            │                                │
│         ┌──────────────────┼──────────────────┐            │
│         ▼                  ▼                  ▼            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │     D1      │    │     KV      │    │   Durable   │     │
│  │  (Database) │    │  (Sessions) │    │   Objects   │     │
│  │   SQLite    │    │  Key-Value  │    │  (Realtime) │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
heirloom-cloudflare/
├── frontend/                # React SPA (deploy to Pages)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
│
├── worker/                  # Cloudflare Worker API
│   ├── src/
│   │   ├── index.ts        # Main entry point
│   │   └── routes/         # API route handlers
│   └── package.json
│
├── migrations/             # D1 database migrations
│   └── 0001_initial.sql
│
└── wrangler.toml           # Cloudflare configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account (free tier works!)
- Wrangler CLI: `npm install -g wrangler`

### 1. Login to Cloudflare

```bash
wrangler login
```

### 2. Create Resources

```bash
# Create D1 database
wrangler d1 create heirloom-db
# Copy the database_id to wrangler.toml

# Create KV namespace
wrangler kv:namespace create KV
# Copy the id to wrangler.toml

# Create R2 bucket
wrangler r2 bucket create heirloom-uploads
```

### 3. Update Configuration

Edit `wrangler.toml` with your resource IDs:

```toml
[[d1_databases]]
binding = "DB"
database_name = "heirloom-db"
database_id = "your-database-id-here"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-id-here"
```

### 4. Run Migrations

```bash
# Local development
wrangler d1 execute heirloom-db --local --file=./migrations/0001_initial.sql

# Production
wrangler d1 execute heirloom-db --file=./migrations/0001_initial.sql
```

### 5. Set Secrets

```bash
# JWT secret for authentication
wrangler secret put JWT_SECRET
# Enter a secure random string

# Stripe for payments
wrangler secret put STRIPE_SECRET_KEY

# Resend for emails
wrangler secret put RESEND_API_KEY
```

### 6. Deploy

```bash
# Deploy Worker API
cd worker
npm install
npm run deploy

# Deploy Frontend (via Pages)
cd ../frontend
npm install
npm run build
wrangler pages deploy dist
```

## 💻 Local Development

```bash
# Terminal 1: Worker API
cd worker
npm install
npm run dev
# API running at http://localhost:8787

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Frontend at http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `ENVIRONMENT` | dev/staging/production | wrangler.toml |
| `APP_URL` | Frontend URL | wrangler.toml |
| `JWT_SECRET` | Auth token secret | `wrangler secret` |
| `STRIPE_SECRET_KEY` | Stripe API key | `wrangler secret` |
| `RESEND_API_KEY` | Email service key | `wrangler secret` |

### Custom Domains

```bash
# Add custom domain to Worker
wrangler route add api.heirloom.blue/* heirloom-api

# Add custom domain to Pages
# Do this in the Cloudflare dashboard under Pages > Custom domains
```

## 📊 Monitoring

```bash
# Real-time logs
wrangler tail

# With filters
wrangler tail --search "error"
wrangler tail --status error
```

## 💰 Pricing Estimate

| Resource | Free Tier | Paid Tier | Heirloom Usage |
|----------|-----------|-----------|----------------|
| Workers | 100K req/day | $5/10M req | ~$5/mo |
| D1 | 5GB storage | $0.75/GB | ~$2/mo |
| R2 | 10GB storage | $0.015/GB | ~$5/mo |
| KV | 100K reads/day | $0.50/M reads | ~$1/mo |
| Pages | Unlimited | Free | $0 |

**Estimated Total: $5-25/month** (vs $50-200+ on AWS)

## 🔒 Security Features

- **Edge Security**: All traffic goes through Cloudflare's security
- **DDoS Protection**: Automatic, included free
- **WAF Rules**: Custom rules available
- **Rate Limiting**: Built into Durable Objects
- **mTLS**: Available for API authentication
- **Encryption**: All data encrypted at rest

## 🔄 CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd worker && npm install
          cd ../frontend && npm install
      
      - name: Deploy Worker
        run: cd worker && npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      
      - name: Build & Deploy Frontend
        run: |
          cd frontend
          npm run build
          npx wrangler pages deploy dist --project-name=heirloom
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

## 🔗 Useful Commands

```bash
# Development
wrangler dev                    # Start local dev server
wrangler dev --remote           # Use remote resources locally

# Database
wrangler d1 execute DB --command "SELECT * FROM users"
wrangler d1 export DB --output backup.sql

# Storage
wrangler r2 object list heirloom-uploads
wrangler r2 object get heirloom-uploads/path/to/file

# Debugging
wrangler tail                   # Stream logs
wrangler deployments list       # View deployments
wrangler rollback               # Rollback to previous version
```

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [Hono Framework](https://hono.dev/)

---

Built with ❤️ for preserving what matters most.
