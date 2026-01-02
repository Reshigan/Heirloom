# Heirloom

**Preserve your memories for generations**

Heirloom is a digital legacy platform with end-to-end encryption, dead man's switch, and multi-currency support. Capture photos, record your voice, and write letters to loved ones — delivered on your terms, even after you're gone.

## 🌟 Features

### Core Features
- **Photo Memories** — Upload and organize photos with stories (encrypted at rest)
- **Voice Recordings** — Record your voice with guided prompts
- **Letters** — Write heartfelt letters with multiple delivery options
- **Family Constellation** — Visual representation of your family connections

### Security & Privacy
- **End-to-End Encryption** — Content encrypted in browser before upload
- **Zero-Knowledge Architecture** — Server never sees unencrypted content
- **Key Escrow** — Encryption keys released to beneficiaries after death verification

### Dead Man's Switch
- **Configurable Check-ins** — Weekly, bi-weekly, monthly, or quarterly
- **Grace Periods** — Customizable grace period before triggering
- **Multi-Contact Verification** — Requires 2+ legacy contacts to verify passing
- **48-Hour Cooldown** — Safety period before content release

### Billing & Subscriptions
- **14-Day Free Trial** — Full access, content deleted on expiration
- **Multi-Currency Support** — USD, EUR, GBP, ZAR, AUD, CAD, INR
- **Stripe Integration** — Secure payment processing
- **Usage-Based Limits** — Per-tier memory, voice, and storage limits

## 🏗️ Architecture

```
heirloom-production/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages (9 pages)
│   │   ├── services/         # API client
│   │   ├── stores/           # Zustand state management
│   │   ├── utils/            # Encryption utilities
│   │   └── styles/           # Global CSS + Tailwind
│   └── ...
├── backend/                  # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── config/           # Environment, database, redis
│   │   ├── middleware/       # Auth, validation, errors
│   │   ├── routes/           # API routes (9 route files)
│   │   ├── services/         # Business logic (6 services)
│   │   └── utils/            # Helpers, cron jobs
│   └── prisma/               # Database schema
└── docker-compose.yml        # Local development setup
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- AWS S3 bucket (or MinIO for local dev)

### Local Development

1. **Clone and install**
```bash
cd heirloom-production

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# Frontend  
cd ../frontend
npm install
```

2. **Start with Docker Compose** (recommended)
```bash
docker-compose up -d
```

3. **Run migrations and seed**
```bash
cd backend
npx prisma migrate dev
npm run db:seed
npm run dev

# In another terminal
cd frontend
npm run dev
```

4. **Access**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- MinIO: http://localhost:9001

### Demo Mode
Demo mode is available for testing. Contact support@heirloom.blue for demo access credentials.

## 📦 API Endpoints

### Authentication
```
POST /api/auth/register     POST /api/auth/login
POST /api/auth/logout       POST /api/auth/refresh
GET  /api/auth/me
```

### Dead Man's Switch
```
GET  /api/deadman/status           - Get switch status
POST /api/deadman/configure        - Configure switch
POST /api/deadman/checkin          - Check in (reset timer)
POST /api/deadman/cancel           - Cancel triggered switch
POST /api/deadman/verify/:token    - Legacy contact verifies passing
```

### Encryption
```
POST /api/encryption/setup         - Initialize E2E encryption
GET  /api/encryption/params        - Get key derivation params
POST /api/encryption/escrow        - Set up key escrow
```

### Billing
```
GET  /api/billing/subscription     - Get subscription status
GET  /api/billing/limits           - Get usage limits
GET  /api/billing/pricing          - Get pricing in user currency
POST /api/billing/checkout         - Create Stripe checkout
PATCH /api/billing/currency        - Update preferred currency
```

### Content
```
/api/family     - Family members CRUD
/api/memories   - Photos/videos with encryption
/api/letters    - Letters with delivery options
/api/voice      - Voice recordings
/api/settings   - Profile, password, legacy contacts
```

## 💳 Subscription Tiers

| Feature | Free Trial | Essential | Family | Legacy |
|---------|-----------|-----------|--------|--------|
| Duration | 14 days | Ongoing | Ongoing | Ongoing |
| Price | Free | $2.99/mo | $11.99/mo | $299/yr |
| Memories | 10 | 100 | ∞ | ∞ |
| Voice | 5 min | 30 min | 60 min | ∞ |
| Letters | 3 | 20 | ∞ | ∞ |
| Storage | 100MB | 1GB | 10GB | 100GB |
| **On expiry** | Content deleted | Downgrade | Downgrade | Downgrade |

**Multi-Currency Support:** USD, EUR, GBP, ZAR, AUD, CAD, INR, JPY, CNY, BRL

## 🔐 Security Architecture

### End-to-End Encryption
1. User creates account → master key generated in browser
2. Master key encrypted with password-derived key (PBKDF2)
3. All content encrypted client-side with AES-256-GCM
4. Server stores only encrypted blobs
5. On death verification → escrowed keys released to beneficiaries

### Dead Man's Switch Flow
1. User configures check-in interval (7-90 days)
2. System sends reminders at 7, 3, 1 days before due
3. Missed check-in → warning status, urgent emails
4. Second miss → switch triggers, legacy contacts notified
5. 2+ contacts verify passing → 48-hour cooldown
6. After cooldown → keys released, content delivered

### Key Escrow
- Master key encrypted with server's master key
- Stored per-beneficiary in database
- Released only after multi-contact verification
- 48-hour safety period allows cancellation

## 🎨 Design System

### Colors
- **Void**: `#050505` (background)
- **Paper**: `#f8f5ef` (text)
- **Gold**: `#c9a959` (primary)
- **Blood**: `#8b2942` (danger/accent)

### Typography
- **Serif**: Cormorant Garamond
- **Handwritten**: Caveat

## 📄 Environment Variables

```env
# Server
NODE_ENV=production
PORT=3001
API_URL=https://api.heirloom.app
FRONTEND_URL=https://heirloom.app

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=...
EMAIL_FROM=noreply@heirloom.app

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
ENCRYPTION_MASTER_KEY=...
```

## 🚀 Production Deployment

### Recommended Stack
- **Compute**: Railway, Render, or AWS ECS
- **Database**: AWS RDS PostgreSQL or Supabase
- **Cache**: AWS ElastiCache or Upstash Redis
- **Storage**: AWS S3
- **CDN**: CloudFront
- **Payments**: Stripe

### Deploy Commands
```bash
# Database migrations
npx prisma migrate deploy

# Build
cd backend && npm run build
cd frontend && npm run build
```

## 📜 License

Copyright © 2025 Heirloom. All rights reserved.
