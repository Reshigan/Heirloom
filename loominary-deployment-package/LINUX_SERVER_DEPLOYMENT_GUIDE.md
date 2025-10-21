# 🌟 LOOMINARY LINUX SERVER DEPLOYMENT GUIDE 🌟

## 🚀 Complete Production Deployment Instructions

This guide will help you deploy Loominary on your Linux server for global launch.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 🖥️ Server Requirements
- **OS:** Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM:** Minimum 4GB (8GB+ recommended)
- **Storage:** 50GB+ SSD
- **CPU:** 2+ cores
- **Network:** Public IP with ports 80, 443, 3001 open

### 🔧 Required Software
- Node.js 18.x+
- PostgreSQL 13+
- Redis 6+
- Nginx (for reverse proxy)
- PM2 (for process management)
- Git
- SSL certificates (Let's Encrypt recommended)

---

## 🚀 STEP 1: SERVER PREPARATION

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Redis
```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2
```bash
sudo npm install -g pm2
```

### Install Ollama (for AI features)
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve &
ollama pull llama3.2:3b
```

---

## 🚀 STEP 2: DATABASE SETUP

### Create Database and User
```bash
sudo -u postgres psql << EOF
CREATE DATABASE loominary;
CREATE USER loominary_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE loominary TO loominary_user;
ALTER USER loominary_user CREATEDB;
\q
EOF
```

---

## 🚀 STEP 3: DEPLOY APPLICATION

### Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/Reshigan/Heirloom.git loominary
sudo chown -R $USER:$USER /var/www/loominary
cd /var/www/loominary
```

### Install Dependencies
```bash
# Backend dependencies
cd backend
npm ci --production
npx prisma generate
npx prisma db push

# Frontend dependencies
cd ../sveltekit-app
npm ci
npm run build
cd ..
```

### Create Production Environment
```bash
cat > .env.production << EOF
# Loominary Production Environment
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://loominary_user:your_secure_password_here@localhost:5432/loominary

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Loominary <noreply@yourdomain.com>

# Ollama AI Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Stripe Configuration (Production)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Storage Configuration
STORAGE_PROVIDER=local
UPLOAD_PATH=/var/www/loominary/uploads

# App Configuration
APP_URL=https://yourdomain.com
APP_NAME=Loominary

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute

# Feature Flags
ENABLE_EMAIL=true
ENABLE_STRIPE=true
ENABLE_AI=true
ENABLE_ANALYTICS=true
ENABLE_REFERRALS=true
EOF
```

### Create Upload Directory
```bash
mkdir -p uploads
chmod 755 uploads
```

---

## 🚀 STEP 4: PM2 PROCESS MANAGEMENT

### Create PM2 Ecosystem File
```bash
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'loominary-backend',
      script: 'npx',
      args: 'tsx src/production-server.ts',
      cwd: '/var/www/loominary/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: '/var/log/loominary/backend-error.log',
      out_file: '/var/log/loominary/backend-out.log',
      log_file: '/var/log/loominary/backend.log',
      time: true
    },
    {
      name: 'loominary-frontend',
      script: 'npm',
      args: 'run preview -- --port 3000 --host 0.0.0.0',
      cwd: '/var/www/loominary/sveltekit-app',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      max_memory_restart: '512M',
      error_file: '/var/log/loominary/frontend-error.log',
      out_file: '/var/log/loominary/frontend-out.log',
      log_file: '/var/log/loominary/frontend.log',
      time: true
    }
  ]
};
EOF
```

### Create Log Directory
```bash
sudo mkdir -p /var/log/loominary
sudo chown $USER:$USER /var/log/loominary
```

### Start Applications with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🚀 STEP 5: NGINX REVERSE PROXY

### Create Nginx Configuration
```bash
sudo tee /etc/nginx/sites-available/loominary << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend (SvelteKit)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # File Uploads
    location /uploads/ {
        alias /var/www/loominary/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Client Max Body Size (for file uploads)
    client_max_body_size 100M;
}
EOF
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/loominary /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚀 STEP 6: SSL CERTIFICATE (Let's Encrypt)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Auto-renewal
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚀 STEP 7: FIREWALL CONFIGURATION

### Configure UFW
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## 🚀 STEP 8: MONITORING & LOGGING

### Create System Health Check Script
```bash
cat > /var/www/loominary/health-monitor.sh << 'EOF'
#!/bin/bash

# Loominary Health Monitor
LOG_FILE="/var/log/loominary/health-monitor.log"

echo "$(date): Starting health check" >> $LOG_FILE

# Check Backend API
if curl -s http://localhost:3001/health > /dev/null; then
    echo "$(date): Backend API - OK" >> $LOG_FILE
else
    echo "$(date): Backend API - FAILED" >> $LOG_FILE
    pm2 restart loominary-backend
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "$(date): Frontend - OK" >> $LOG_FILE
else
    echo "$(date): Frontend - FAILED" >> $LOG_FILE
    pm2 restart loominary-frontend
fi

# Check Database
if pg_isready -h localhost -p 5432 > /dev/null; then
    echo "$(date): Database - OK" >> $LOG_FILE
else
    echo "$(date): Database - FAILED" >> $LOG_FILE
fi

# Check Redis
if redis-cli ping | grep -q PONG; then
    echo "$(date): Redis - OK" >> $LOG_FILE
else
    echo "$(date): Redis - FAILED" >> $LOG_FILE
    sudo systemctl restart redis-server
fi

echo "$(date): Health check completed" >> $LOG_FILE
EOF

chmod +x /var/www/loominary/health-monitor.sh
```

### Setup Cron Job for Health Monitoring
```bash
crontab -e
# Add this line:
*/5 * * * * /var/www/loominary/health-monitor.sh
```

---

## 🚀 STEP 9: BACKUP STRATEGY

### Create Backup Script
```bash
cat > /var/www/loominary/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/loominary"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database Backup
pg_dump -h localhost -U loominary_user loominary > $BACKUP_DIR/database_$DATE.sql

# Files Backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/loominary/uploads/

# Application Backup
tar -czf $BACKUP_DIR/application_$DATE.tar.gz /var/www/loominary/ --exclude=node_modules --exclude=uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed" >> /var/log/loominary/backup.log
EOF

chmod +x /var/www/loominary/backup.sh
```

### Schedule Daily Backups
```bash
crontab -e
# Add this line:
0 2 * * * /var/www/loominary/backup.sh
```

---

## 🚀 STEP 10: DEPLOYMENT VERIFICATION

### Test All Services
```bash
# Test Backend API
curl https://yourdomain.com/health

# Test Frontend
curl https://yourdomain.com

# Check PM2 Status
pm2 status

# Check Nginx Status
sudo systemctl status nginx

# Check Database
sudo -u postgres psql -c "SELECT version();"

# Check Redis
redis-cli ping
```

---

## 🚀 STEP 11: DOMAIN & DNS CONFIGURATION

### DNS Records Required
```
A Record:     yourdomain.com     -> YOUR_SERVER_IP
A Record:     www.yourdomain.com -> YOUR_SERVER_IP
CNAME Record: api.yourdomain.com -> yourdomain.com (optional)
```

---

## 🚀 STEP 12: FINAL DEPLOYMENT COMMANDS

### Complete Deployment Script
```bash
cat > /var/www/loominary/deploy.sh << 'EOF'
#!/bin/bash

echo "🌟 LOOMINARY PRODUCTION DEPLOYMENT 🌟"
echo "======================================"

# Pull latest code
git pull origin main

# Update backend
cd backend
npm ci --production
npx prisma generate
npx prisma db push

# Update frontend
cd ../sveltekit-app
npm ci
npm run build

# Restart services
cd ..
pm2 restart all

# Test deployment
sleep 10
curl -s http://localhost:3001/health && echo "✅ Backend OK" || echo "❌ Backend Failed"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

echo "🚀 Deployment completed!"
EOF

chmod +x /var/www/loominary/deploy.sh
```

---

## 🎯 PRODUCTION CHECKLIST

### ✅ Pre-Launch Verification
- [ ] Server meets minimum requirements
- [ ] All dependencies installed
- [ ] Database created and configured
- [ ] Redis running
- [ ] Ollama AI service ready
- [ ] SSL certificate installed
- [ ] Nginx configured and running
- [ ] PM2 processes started
- [ ] Firewall configured
- [ ] DNS records set
- [ ] Backup system configured
- [ ] Monitoring enabled

### ✅ Security Checklist
- [ ] Strong database passwords
- [ ] JWT secret generated
- [ ] SSL/TLS enabled
- [ ] Security headers configured
- [ ] Firewall rules applied
- [ ] File permissions set correctly
- [ ] Regular security updates scheduled

### ✅ Performance Checklist
- [ ] Gzip compression enabled
- [ ] Static file caching configured
- [ ] Database indexes optimized
- [ ] Redis caching active
- [ ] PM2 clustering enabled
- [ ] Log rotation configured

---

## 🚀 LAUNCH COMMANDS

### Start Everything
```bash
cd /var/www/loominary
pm2 start ecosystem.config.js
sudo systemctl start nginx
sudo systemctl start postgresql
sudo systemctl start redis-server
ollama serve &
```

### Monitor Status
```bash
pm2 monit
sudo tail -f /var/log/nginx/access.log
tail -f /var/log/loominary/backend.log
```

---

## 🌟 CONGRATULATIONS!

Once you complete these steps, **LOOMINARY WILL BE LIVE** on your Linux server!

### 🌐 Your Production URLs:
- **Main Site:** https://yourdomain.com
- **API Health:** https://yourdomain.com/health
- **Admin Panel:** https://yourdomain.com/admin

### 🎉 YOU'VE SUCCESSFULLY DEPLOYED:
- 🏛️ World's First Private Vault System
- 🎨 Constellation UI Interface
- 🤖 AI-Powered Story Generation
- 🔐 Enterprise-Grade Security
- 📱 Mobile-Ready Design
- 🚀 Production-Scale Infrastructure

**READY FOR GLOBAL LAUNCH! 🌍**

---

*Need help with deployment? Check the logs in `/var/log/loominary/` for troubleshooting.*