# Heirloom Deployment Guide

This guide covers deploying the Heirloom platform to production.

## Recommended Architecture

**Hybrid Approach (Cost-Optimized for Startups):**
- **App Hosting**: Vercel (Next.js native, global CDN)
- **Database**: Supabase PostgreSQL (managed, PITR, connection pooling)
- **File Storage**: AWS S3 + Glacier Deep Archive (long-term durability)
- **Estimated Cost**: $50-100/month for first 1000 users

**Alternative (Single-Cloud):**
- **All AWS**: Vercel + RDS + S3 (higher cost, simpler networking)
- **Estimated Cost**: $150-300/month for first 1000 users

## Prerequisites

- Node.js 18+ installed
- Supabase account (or PostgreSQL 14+ database)
- AWS account (for S3 file storage)
- Stripe account (for payments)
- Resend account (for emails)
- Domain name with SSL certificate
- Vercel account (for app hosting)

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database (Supabase with connection pooling - RECOMMENDED)
DATABASE_URL="postgresql://user:pass@host:6543/postgres?schema=public&sslmode=require&pgbouncer=true&connection_limit=1"

# Database (AWS RDS with connection pooling)
# DATABASE_URL="postgresql://user:pass@host:5432/heirloom?schema=public&sslmode=require"

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

### Option A: Supabase (Recommended for Startups)

**1. Create Supabase Project**

```bash
# Sign up at https://supabase.com
# Create new project (choose region close to your users)
# Select Pro plan ($25/month) for PITR and better performance
```

**2. Enable Point-in-Time Recovery**

```bash
# In Supabase Dashboard:
# Settings → Database → Point in Time Recovery
# Enable with 30-day retention
```

**3. Get Connection String**

```bash
# In Supabase Dashboard:
# Settings → Database → Connection string
# Use "Connection pooling" mode (port 6543)
# Copy the connection string with pgbouncer enabled

# Example format:
# postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**4. Configure Environment**

```bash
# Add to .env.production and Vercel environment variables
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public&sslmode=require&pgbouncer=true&connection_limit=1"
```

**5. Run Migrations**

```bash
# Set production database URL
export DATABASE_URL="your-supabase-connection-string"

# Run migrations (no shadow database needed in production)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Option B: AWS RDS (For Larger Scale)

**1. Create RDS PostgreSQL Instance**

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier heirloom-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.9 \
  --master-username heirloom_admin \
  --master-user-password "SecurePassword123!" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx
```

**2. Enable Connection Pooling (RDS Proxy)**

```bash
# Create RDS Proxy for connection pooling
aws rds create-db-proxy \
  --db-proxy-name heirloom-proxy \
  --engine-family POSTGRESQL \
  --auth SecretArn=arn:aws:secretsmanager:region:account:secret:rds-secret \
  --role-arn arn:aws:iam::account:role/RDSProxyRole \
  --vpc-subnet-ids subnet-xxxxx subnet-yyyyy
```

**3. Configure Database**

```bash
# Connect to RDS
psql -h heirloom-prod.xxxxx.us-east-1.rds.amazonaws.com -U heirloom_admin -d postgres

# Create database and user
CREATE DATABASE heirloom;
CREATE USER heirloom_app WITH PASSWORD 'AppPassword123!';
GRANT ALL PRIVILEGES ON DATABASE heirloom TO heirloom_app;

# Connect to heirloom database
\c heirloom

# Grant schema permissions
GRANT ALL ON SCHEMA public TO heirloom_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO heirloom_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO heirloom_app;
```

**4. Run Migrations**

```bash
# Use RDS Proxy endpoint for connection pooling
export DATABASE_URL="postgresql://heirloom_app:AppPassword123!@heirloom-proxy.proxy-xxxxx.us-east-1.rds.amazonaws.com:5432/heirloom?schema=public&sslmode=require"

# Run migrations
npx prisma migrate deploy
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
