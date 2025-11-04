# Heirloom Deployment Guide

This guide covers deploying the Heirloom platform to production.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ database
- AWS S3 or Cloudflare R2 account (for file storage)
- Stripe account (for payments)
- Resend account (for emails)
- Domain name with SSL certificate

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/heirloom?schema=public"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"

# AWS S3 / Cloudflare R2
STORAGE_ENDPOINT="https://your-endpoint.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY="your-access-key"
STORAGE_SECRET_KEY="your-secret-key"
STORAGE_BUCKET="heirloom-vault"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
EMAIL_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID="G-XXXXXXXXXX"

# Error Tracking (Optional)
SENTRY_DSN="https://..."
```

## Database Setup

### 1. Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE heirloom_production;
CREATE USER heirloom_prod WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE heirloom_production TO heirloom_prod;
ALTER USER heirloom_prod CREATEDB;

# Grant schema permissions
\c heirloom_production
GRANT ALL ON SCHEMA public TO heirloom_prod;
```

### 2. Run Migrations

```bash
# Set production database URL
export DATABASE_URL="postgresql://heirloom_prod:secure-password@localhost:5432/heirloom_production"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## File Storage Setup

### Option A: AWS S3

1. Create an S3 bucket
2. Enable versioning and encryption
3. Create IAM user with S3 access
4. Set CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Option B: Cloudflare R2

1. Create R2 bucket
2. Generate API token with R2 permissions
3. Set CORS policy in R2 dashboard
4. Use endpoint: `https://<account-id>.r2.cloudflarestorage.com`

## Payment Setup (Stripe)

### 1. Create Products and Prices

```bash
# Essential Plan - $9.99/month
stripe products create --name="Essential Plan" --description="5GB storage, 500 memories"
stripe prices create --product=prod_xxx --unit-amount=999 --currency=usd --recurring[interval]=month

# Premium Plan - $19.99/month
stripe products create --name="Premium Plan" --description="50GB storage, 5000 memories"
stripe prices create --product=prod_xxx --unit-amount=1999 --currency=usd --recurring[interval]=month

# Unlimited Plan - $49.99/month
stripe products create --name="Unlimited Plan" --description="Unlimited storage and memories"
stripe prices create --product=prod_xxx --unit-amount=4999 --currency=usd --recurring[interval]=month

# Dynasty Plan - $99.99/month
stripe products create --name="Dynasty Plan" --description="Multi-vault, priority support"
stripe prices create --product=prod_xxx --unit-amount=9999 --currency=usd --recurring[interval]=month
```

### 2. Configure Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Email Setup (Resend)

1. Sign up at resend.com
2. Verify your domain
3. Create API key
4. Set `EMAIL_API_KEY` and `EMAIL_FROM`

## Build and Deploy

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Option 2: Docker

```bash
# Build Docker image
docker build -t heirloom:latest .

# Run container
docker run -d \
  --name heirloom \
  -p 3000:3000 \
  --env-file .env.production \
  heirloom:latest
```

### Option 3: Traditional Server

```bash
# Build application
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start npm --name "heirloom" -- start
pm2 save
pm2 startup
```

## Post-Deployment Checklist

### Security

- [ ] Enable HTTPS/SSL
- [ ] Set secure NEXTAUTH_SECRET (min 32 characters)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Configure security headers

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (Google Analytics)
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up database monitoring
- [ ] Configure alerts for critical errors

### Performance

- [ ] Enable CDN for static assets
- [ ] Configure image optimization
- [ ] Set up database connection pooling
- [ ] Enable caching (Redis recommended)
- [ ] Configure compression

### Legal

- [ ] Update Terms of Service with company details
- [ ] Update Privacy Policy with data locations
- [ ] Set up cookie consent banner (if EU users)
- [ ] Configure GDPR compliance tools

## Backup Strategy

### Database Backups

```bash
# Daily automated backup
pg_dump -U heirloom_prod heirloom_production > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U heirloom_prod heirloom_production < backup_20251104.sql
```

### File Storage Backups

- Enable versioning on S3/R2
- Set up cross-region replication
- Configure lifecycle policies for old versions

## Scaling Considerations

### Database

- Use connection pooling (PgBouncer)
- Set up read replicas for heavy read workloads
- Consider managed database (AWS RDS, Supabase)

### Application

- Use horizontal scaling with load balancer
- Configure auto-scaling based on CPU/memory
- Use CDN for static assets (Cloudflare, CloudFront)

### Storage

- Use CDN for file delivery
- Configure image optimization pipeline
- Set up multi-region storage for global users

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check Prisma client
npx prisma db pull
npx prisma generate
```

### File Upload Issues

- Check CORS configuration
- Verify storage credentials
- Check bucket permissions
- Verify file size limits

## Support

For deployment issues, contact:
- Email: support@heirloom.com
- Documentation: https://docs.heirloom.com

## License

Copyright © 2025 Vantax Limited. All rights reserved.
