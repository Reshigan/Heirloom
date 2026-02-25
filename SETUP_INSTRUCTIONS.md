

# Cloudflare Deployment Setup Instructions

## Required GitHub Secrets Configuration

To enable automatic deployments, configure the following secrets in your GitHub repository:

### 1. Cloudflare Credentials
- `CLOUDFLARE_API_TOKEN`: Use the Global API Key provided: `21fff817fa4a851d0ddc3975c7f8c1a31fbc4`
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID
- `CLOUDFLARE_API_KEY`: `21fff817fa4a851d0ddc3975c7f8c1a31fbc4`
- `CLOUDFLARE_EMAIL`: `reshigan@vantax.co.za`

### 2. Database & Storage
- `DATABASE_URL`: PostgreSQL connection string
- `AWS_ACCESS_KEY_ID`: S3/R2 access key
- `AWS_SECRET_ACCESS_KEY`: S3/R2 secret key
- `S3_BUCKET_NAME`: Storage bucket name

### 3. Authentication & Security
- `JWT_SECRET`: Generate with `openssl rand -base64 64`
- `JWT_REFRESH_SECRET`: Generate with `openssl rand -base64 64`

### 4. Payment Processing
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret

### 5. Email Service
- `SMTP_USER`: Email service username
- `SMTP_PASS`: Email service password

## Domain Configuration

Update the following files with your actual domain:

### wrangler.jsonc
Replace the routes section with your actual domain configuration:
```json
"routes": [
  {
    "pattern": "api.yourdomain.com/*",
    "zone_id": "your-cloudflare-zone-id"
  },
  {
    "pattern": "yourdomain.com/*", 
    "zone_id": "your-cloudflare-zone-id"
  }
]
```

### Environment Variables
Update URLs in `.env.example`:
```
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## Deployment Process

### Step 1: Configure GitHub Secrets
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add all required secrets listed above

### Step 2: Configure Cloudflare
1. Create Cloudflare Pages project for frontend
2. Configure Workers for API routes  
3. Set up R2 storage bucket
4. Configure D1 database

### Step 3: DNS Configuration
1. Add A records pointing to Cloudflare nameservers
2. Configure CNAME for API subdomain
3. Enable SSL/TLS encryption

### Step 4: Manual First Deployment (Optional)
```bash
# Build all components
cd backend && npm run build
cd ../frontend && npm run build
cd ../cloudflare/worker && npm run build

# Deploy worker
npx wrangler deploy

# Deploy frontend
npx wrangler pages deploy ./dist --project-name=heirloom-frontend
```

### Step 5: Verify Deployment
1. Check Cloudflare dashboard for successful deployments
2. Test API endpoints: `https://api.yourdomain.com/health`
3. Test frontend: `https://yourdomain.com`

## Security Verification

After deployment, verify:

✅ All dependency vulnerabilities resolved (0 vulnerabilities)
✅ HTTPS enforced via Cloudflare
✅ JWT authentication working
✅ File upload encryption functioning
✅ Error handling prevents information disclosure
✅ Rate limiting active on authentication endpoints

## Monitoring

- Check Cloudflare Workers logs for API errors
- Monitor Cloudflare Pages analytics
- Set up alerts for failed deployments
- Monitor database connection health

---
*Ready for production deployment with Cloudflare API key: 21fff817fa4a851d0ddc3975c7f8c1a31fbc4*
