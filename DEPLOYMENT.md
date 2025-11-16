# Heirloom Deployment Guide

Complete guide for deploying the full-stack Heirloom application.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Nginx                             │
│  (Reverse Proxy, SSL Termination, Static Files)         │
└─────────────┬───────────────────────────┬───────────────┘
              │                           │
              │ / (Frontend)              │ /api (Backend)
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │   Next.js       │         │    FastAPI      │
    │   (Port 3000)   │         │   (Port 8000)   │
    └─────────────────┘         └────────┬────────┘
                                         │
                                         ▼
                                ┌─────────────────┐
                                │   PostgreSQL    │
                                │   (Port 5432)   │
                                └─────────────────┘
```

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain name (optional, can use IP address)
- Minimum 2GB RAM, 2 CPU cores, 20GB disk space

## Step 1: System Preparation

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install System Dependencies
```bash
# Essential tools
sudo apt install -y git curl wget build-essential

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3.12
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# FFmpeg (for media compression)
sudo apt install -y ffmpeg

# Nginx
sudo apt install -y nginx

# Poetry (Python package manager)
curl -sSL https://install.python-poetry.org | python3 -
export PATH="/root/.local/bin:$PATH"
```

### Verify Installations
```bash
node --version  # Should be v20.x
python3.12 --version  # Should be 3.12.x
psql --version  # Should be 14+
ffmpeg -version  # Should show version info
nginx -v  # Should show version
poetry --version  # Should show version
```

## Step 2: Database Setup

### Create PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE heirloom;
CREATE USER heirloom WITH PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE heirloom TO heirloom;
\c heirloom
GRANT ALL PRIVILEGES ON SCHEMA public TO heirloom;
\q
```

### Test Database Connection
```bash
psql -U heirloom -d heirloom -h localhost -W
# Enter password when prompted
# If successful, you'll see the PostgreSQL prompt
\q
```

## Step 3: Application Setup

### Clone Repository
```bash
cd /srv
git clone https://github.com/Reshigan/Heirloom.git
cd Heirloom
git checkout devin/1763212741-high-adoption-features
```

### Backend Setup
```bash
cd /srv/Heirloom/backend

# Install dependencies
poetry install

# Create environment file
cp .env.example .env

# Generate secure keys
ENCRYPTION_KEY=$(python3 -c "import os, base64; print(base64.b64encode(os.urandom(32)).decode())")
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")

# Update .env file
cat > .env << EOF
DATABASE_URL=postgresql://heirloom:CHANGE_THIS_PASSWORD@localhost/heirloom
USE_POSTGRES=true
ENCRYPTION_KEY=$ENCRYPTION_KEY
JWT_SECRET=$JWT_SECRET
HOST=0.0.0.0
PORT=8000
EOF

# Initialize database
poetry run python init_db.py
```

### Frontend Setup
```bash
cd /srv/Heirloom/frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
EOF

# Build production bundle
npm run build
```

## Step 4: Systemd Services

### Backend Service
```bash
sudo tee /etc/systemd/system/heirloom-backend.service > /dev/null << 'EOF'
[Unit]
Description=Heirloom Backend API
After=network.target postgresql.service

[Service]
Type=exec
User=root
WorkingDirectory=/srv/Heirloom/backend
Environment="PATH=/root/.local/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=/srv/Heirloom/backend/.env
ExecStart=/root/.local/bin/poetry run gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4 -b 127.0.0.1:8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### Frontend Service
```bash
sudo tee /etc/systemd/system/heirloom-frontend.service > /dev/null << 'EOF'
[Unit]
Description=Heirloom Frontend
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory=/srv/Heirloom/frontend
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### Enable and Start Services
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable heirloom-backend
sudo systemctl enable heirloom-frontend

# Start services
sudo systemctl start heirloom-backend
sudo systemctl start heirloom-frontend

# Check status
sudo systemctl status heirloom-backend
sudo systemctl status heirloom-frontend
```

## Step 5: Nginx Configuration

### Create Nginx Config
```bash
sudo tee /etc/nginx/sites-available/heirloom > /dev/null << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;

# Upstream servers
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name _;  # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # File upload size limit
    client_max_body_size 128M;

    # Backend API
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Upload endpoint with stricter rate limit
    location /api/uploads {
        limit_req zone=upload_limit burst=5 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Extended timeouts for large uploads
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Health check
    location /healthz {
        proxy_pass http://backend;
        access_log off;
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
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/heirloom /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Step 6: Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

## Step 7: SSL/TLS Setup (Optional but Recommended)

If you have a domain name:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

## Step 8: Verification

### Check Services
```bash
# Check backend
curl http://localhost:8000/healthz

# Check frontend
curl http://localhost:3000

# Check through nginx
curl http://localhost/healthz
curl http://localhost/
```

### View Logs
```bash
# Backend logs
sudo journalctl -u heirloom-backend -f

# Frontend logs
sudo journalctl -u heirloom-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Maintenance

### Update Application
```bash
cd /srv/Heirloom
git pull origin devin/1763212741-high-adoption-features

# Update backend
cd backend
poetry install
sudo systemctl restart heirloom-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo systemctl restart heirloom-frontend
```

### Backup Database
```bash
# Create backup
sudo -u postgres pg_dump heirloom > heirloom_backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql heirloom < heirloom_backup_20231115.sql
```

### Monitor Resources
```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Check service status
sudo systemctl status heirloom-backend heirloom-frontend nginx postgresql
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u heirloom-backend -n 50

# Check if port is in use
sudo lsof -i :8000

# Test manually
cd /srv/Heirloom/backend
poetry run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend won't start
```bash
# Check logs
sudo journalctl -u heirloom-frontend -n 50

# Check if port is in use
sudo lsof -i :3000

# Test manually
cd /srv/Heirloom/frontend
npm start
```

### Database connection errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U heirloom -d heirloom -h localhost

# Check .env file
cat /srv/Heirloom/backend/.env
```

### Nginx errors
```bash
# Check configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Generated unique ENCRYPTION_KEY and JWT_SECRET
- [ ] Configured firewall (UFW)
- [ ] Set up SSL/TLS with Let's Encrypt
- [ ] Configured rate limiting in Nginx
- [ ] Set appropriate file upload limits
- [ ] Regular database backups scheduled
- [ ] Monitoring and alerting set up
- [ ] Log rotation configured
- [ ] SSH key-based authentication only
- [ ] Disabled root SSH login

## Performance Tuning

### PostgreSQL
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Recommended settings for 2GB RAM:
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Nginx
```bash
# Edit nginx config
sudo nano /etc/nginx/nginx.conf

# Recommended settings:
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## Monitoring

### Set up basic monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor in real-time
htop  # CPU and memory
iotop  # Disk I/O
nethogs  # Network usage
```

## Support

For issues or questions:
- Check logs first: `sudo journalctl -u heirloom-backend -f`
- Review this deployment guide
- Check the backend README: `/srv/Heirloom/backend/README.md`
