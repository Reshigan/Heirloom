

# Heirloom Deployment Guide

## Overview

This guide covers deploying Heirloom - a digital legacy platform with end-to-end encryption, dead man's switch functionality, and subscription billing.

## Architecture

- **Frontend**: React + Vite + TypeScript (deployed to Cloudflare Pages)
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Worker**: Cloudflare Worker for API routes and edge computing
- **Database**: D1 (SQLite at the edge) + PostgreSQL for main data
- **Storage**: R2 for file storage
- **CDN**: Cloudflare global CDN

## Prerequisites

- Cloudflare account with Workers & Pages enabled
- PostgreSQL database
- AWS S3 bucket (or Cloudflare R2)
- Stripe account for billing
- Domain name configured in Cloudflare

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Reshigan/Heirloom.git
cd Heirloom
```

### 2. Set up Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Required Environment Variables

#### Core Configuration
```env
NODE_ENV=production
PORT=3001
API_URL=https://api.heirloom.app
FRONTEND_URL=https://heirloom.app
```

#### Database
```env
DATABASE_URL=postgresql://username:password@hostname:5432/heirloom
```

#### JWT Secrets (generate with: `openssl rand -base64 64`)
```env
JWT_SECRET=your-jwt-secret-here-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-jwt-secret-here-minimum-32-characters
```

#### Cloudflare Configuration
```env
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_API_KEY=21fff817fa4a851d0ddc3975c7f8c1a31fbc4
CLOUDFLARE_EMAIL=reshigan@vantax.co.za
```

#### Storage Configuration
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=heirloom-production
```

#### Payment Configuration
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### Email Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

The repository includes a comprehensive CI/CD pipeline:

1. **Push to main branch** → Automatic deployment to production
2. **Push to develop branch** → Automatic deployment to staging
3. **Pull requests** → Security audit and build validation

#### GitHub Secrets Required

Set these secrets in your GitHub repository:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_KEY`
- `CLOUDFLARE_EMAIL`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SMTP_USER`
- `SMTP_PASS`

### Method 2: Manual Deployment

#### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm ci
npm run build

# Install frontend dependencies
cd ../frontend
npm ci
npm run build

# Install worker dependencies
cd ../cloudflare/worker
npm ci
npm run build
```

#### Step 2: Deploy Worker

```bash
cd cloudflare/worker
npx wrangler deploy
```

#### Step 3: Deploy Frontend

```bash
cd frontend
npx wrangler pages deploy ./dist --project-name=heirloom-frontend
```

#### Step 4: Deploy Backend (if using separate hosting)

```bash
cd backend
npm start
```

#### Step 5: Database Migrations

```bash
cd backend
npx prisma migrate deploy
```

## Security Checklist

Before deploying to production:

- [ ] All dependencies updated and audited (`npm audit`)
- [ ] Environment variables secured and not committed
- [ ] JWT secrets properly generated (>32 characters)
- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Error handling prevents information disclosure
- [ ] Input validation implemented
- [ ] File upload restrictions configured

## Monitoring & Maintenance

### Health Checks

- API Health: `https://api.heirloom.app/health`
- Worker Status: Check Cloudflare Workers dashboard
- Database: Monitor connection pool and query performance

### Backup Strategy

1. **Database**: Automated PostgreSQL backups
2. **Files**: R2 versioning enabled
3. **Configurations**: Version controlled in Git

### Updates

1. **Dependencies**: Regular `npm audit` and updates
2. **Security patches**: Immediate application of critical fixes
3. **Database migrations**: Tested in staging before production

## Troubleshooting

### Common Issues

**Frontend deployment fails**
- Check if dist directory exists
- Verify Cloudflare Pages project configuration

**Worker deployment fails**
- Check wrangler.toml configuration
- Verify environment variables

**Database connection issues**
- Check DATABASE_URL format
- Verify network accessibility

**JWT authentication fails**
- Verify JWT secrets match across services
- Check token expiration configuration

### Logs

- **Frontend**: Cloudflare Pages logs
- **Worker**: Cloudflare Workers logs
- **Backend**: Application logs + error tracking

## Security Enhancements Implemented

✅ **Dependency Security**
- Regular npm audit integration
- Automated vulnerability scanning in CI/CD
- Latest secure versions of all dependencies

✅ **Input Validation**
- Zod schema validation for all endpoints
- File type and size restrictions
- XSS protection through sanitization

✅ **Authentication Security**
- JWT with refresh tokens
- bcrypt password hashing (salt rounds: 12)
- Rate limiting on authentication endpoints

✅ **Data Protection**
- End-to-end encryption for sensitive data
- Secure file storage with access controls
- Database encryption at rest

✅ **Infrastructure Security**
- HTTPS/TLS enforced
- CSP headers configured
- DDoS protection via Cloudflare

## Support

For deployment issues:
1. Check Cloudflare dashboard for error logs
2. Review GitHub Actions workflow runs
3. Ensure all environment variables are set correctly
4. Verify domain DNS configuration

---
*Last updated: 2025-02-24*

