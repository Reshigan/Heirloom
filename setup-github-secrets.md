# 🔐 GitHub Secrets Setup for Loominary Production Deployment

To enable automated deployment to your production server, you need to configure the following GitHub secrets in your repository settings.

## 📋 Required GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### 🔑 SSH Access
- **SSH_PRIVATE_KEY**: Your private SSH key content (Vantax-2.pem file content)

### 🔐 Security Keys
- **JWT_SECRET**: `loominary_jwt_super_secure_secret_key_2024_production`
- **JWT_REFRESH_SECRET**: `loominary_refresh_super_secure_secret_key_2024_production`

### 💳 Stripe Configuration (Production)
- **STRIPE_PUBLISHABLE_KEY**: Your Stripe publishable key (pk_live_...)
- **STRIPE_SECRET_KEY**: Your Stripe secret key (sk_live_...)
- **STRIPE_WEBHOOK_SECRET**: Your Stripe webhook secret (whsec_...)

### 📧 Email Configuration
- **SMTP_USER**: Your SMTP username (e.g., noreply@vantax.co.za)
- **SMTP_PASS**: Your SMTP password

## 🚀 How to Set Up

### 1. Add SSH Private Key
```bash
# Copy your SSH private key content
cat /path/to/Vantax-2.pem
```
- Copy the entire content (including -----BEGIN and -----END lines)
- Add as `SSH_PRIVATE_KEY` secret in GitHub

### 2. Generate JWT Secrets (if you want different ones)
```bash
# Generate secure JWT secrets
openssl rand -base64 64
```

### 3. Configure Stripe
- Get your production keys from Stripe Dashboard
- Add webhook endpoint: `https://loom.vantax.co.za/api/webhooks/stripe`

### 4. Setup Email
- Configure your SMTP provider (Gmail, SendGrid, etc.)
- Add credentials as secrets

## 🔧 Manual Deployment Trigger

After setting up secrets, you can trigger deployment:

1. **Automatic**: Push to `main` branch
2. **Manual**: Go to Actions → Deploy Production → Run workflow

## 📊 Monitoring After Deployment

Once deployed, you can monitor your application:

```bash
# SSH into server
ssh -i "Vantax-2.pem" ubuntu@3.8.160.221

# Check status
/opt/loominary/monitor.sh

# View logs
cd /opt/loominary/Heirloom
docker-compose -f docker-compose.production.yml logs

# Restart services if needed
docker-compose -f docker-compose.production.yml restart
```

## 🌟 Access Your Application

After successful deployment:
- **Frontend**: https://loom.vantax.co.za
- **Backend API**: https://loom.vantax.co.za/api
- **Health Check**: https://loom.vantax.co.za/health
- **Admin Panel**: https://loom.vantax.co.za/admin

## 🔒 Security Features Enabled

- ✅ HTTPS with Let's Encrypt SSL
- ✅ Rate limiting on API endpoints
- ✅ Security headers
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection

## 🎯 Next Steps

1. Set up the GitHub secrets above
2. Push to main branch or trigger manual deployment
3. Wait for deployment to complete (~10-15 minutes)
4. Access https://loom.vantax.co.za
5. Start your pilot testing!

## 🆘 Troubleshooting

If deployment fails:
1. Check GitHub Actions logs
2. SSH into server and check Docker logs
3. Verify all secrets are correctly set
4. Ensure domain DNS points to your server IP

## 📞 Support

For deployment issues, check:
- GitHub Actions logs
- Server logs: `docker-compose -f docker-compose.production.yml logs`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`