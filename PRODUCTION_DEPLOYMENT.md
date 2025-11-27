# Production Deployment Guide

## Prerequisites

1. **Server Requirements**
   - Ubuntu 20.04+ or similar Linux distribution
   - Docker and Docker Compose installed
   - SSL certificate configured (Let's Encrypt recommended)
   - Domain name pointing to server IP

2. **Required Services**
   - PostgreSQL 15+ (via Docker or managed service)
   - Ollama (for NLP sentiment analysis)
   - Nginx (for reverse proxy and SSL termination)

3. **External Services**
   - Stripe account (for payments)
   - Resend account (for email notifications)
   - Twilio account (for SMS check-in reminders)
   - Sentry account (for error monitoring)

## Environment Variables

Copy `.env.production.example` to `.env.production` and fill in all values:

```bash
cp .env.production.example .env.production
nano .env.production
```

### Critical Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Generate with `openssl rand -base64 32`
- `STRIPE_SECRET_KEY`: From Stripe dashboard
- `RESEND_API_KEY`: From Resend dashboard
- `TWILIO_*`: From Twilio dashboard
- `SENTRY_DSN`: From Sentry project settings

## Deployment Steps

### 1. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/Reshigan/Heirloom.git heirloom-production
cd heirloom-production
git checkout main
```

### 2. Configure Environment

```bash
# Backend
cp .env.production.example backend-node/.env
nano backend-node/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local
nano frontend/.env.local
```

### 3. Install Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull phi3:mini
```

### 4. Run Database Migrations

```bash
cd backend-node
npm install
npx prisma generate
npx prisma migrate deploy
```

### 5. Build and Start Services

```bash
cd ..
docker-compose -f docker-compose.yml up -d --build
```

### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/heirloom
```

Add configuration:

```nginx
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name loom.vantax.co.za;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name loom.vantax.co.za;

    ssl_certificate /etc/letsencrypt/live/loom.vantax.co.za/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/loom.vantax.co.za/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API routes
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/heirloom /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Setup SSL Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Certbot should automatically renew certificates. Verify cron job exists:

```bash
sudo systemctl status certbot.timer
```

### 8. Setup Database Backups

Create backup script:

```bash
sudo nano /usr/local/bin/backup-heirloom-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec heirloom_db pg_dump -U heirloom heirloom > $BACKUP_DIR/heirloom_$DATE.sql

# Keep only last 30 days of backups
find $BACKUP_DIR -name "heirloom_*.sql" -mtime +30 -delete

echo "Backup completed: heirloom_$DATE.sql"
```

Make executable and add to cron:

```bash
sudo chmod +x /usr/local/bin/backup-heirloom-db.sh
sudo crontab -e
```

Add line:

```
0 2 * * * /usr/local/bin/backup-heirloom-db.sh
```

### 9. Verify Deployment

```bash
# Check all containers are running
docker ps

# Check backend health
curl https://loom.vantax.co.za/api/health

# Check frontend
curl -I https://loom.vantax.co.za

# Check logs
docker logs heirloom_backend_node
docker logs heirloom_frontend
```

### 10. Monitor Services

```bash
# View real-time logs
docker-compose logs -f

# Check resource usage
docker stats

# Monitor Ollama
curl http://localhost:11434/api/version
```

## Post-Deployment

1. **Test Critical Flows**
   - User registration and login
   - Vault upload (PRIVATE and POSTHUMOUS)
   - Search functionality
   - Check-in system
   - Notifications

2. **Monitor Sentry**
   - Check for any errors in Sentry dashboard
   - Set up alerts for critical errors

3. **Performance Testing**
   - Run load tests to verify rate limiting
   - Monitor database query performance
   - Check API response times

4. **Security Audit**
   - Verify all environment variables are set
   - Check SSL certificate is valid
   - Test rate limiting on auth endpoints
   - Verify CORS configuration

## Rollback Procedure

If issues occur:

```bash
# Stop services
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Restore database backup
docker exec -i heirloom_db psql -U heirloom heirloom < /path/to/backup.sql

# Rebuild and restart
docker-compose up -d --build
```

## Maintenance

### Update Application

```bash
cd /home/ubuntu/heirloom-production
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Update Dependencies

```bash
# Backend
cd backend-node
npm update
npm audit fix

# Frontend
cd ../frontend
npm update
npm audit fix
```

### Database Migrations

```bash
cd backend-node
npx prisma migrate deploy
```

## Troubleshooting

### Backend Not Starting

```bash
docker logs heirloom_backend_node
# Check for missing environment variables or database connection issues
```

### Frontend Not Loading

```bash
docker logs heirloom_frontend
# Check NEXT_PUBLIC_API_BASE_URL is set correctly
```

### Database Connection Issues

```bash
docker exec -it heirloom_db psql -U heirloom heirloom
# Verify database is accessible
```

### Ollama Not Working

```bash
curl http://localhost:11434/api/version
# If not running: sudo systemctl start ollama
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/Reshigan/Heirloom/issues
- Email: reshigan@gonxt.tech
