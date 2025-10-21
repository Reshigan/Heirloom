#!/bin/bash

# 🌟 LOOMINARY DEPLOYMENT PACKAGE CREATOR 🌟
# Creates a complete deployment package for Linux server

echo "🌟 Creating Loominary Deployment Package"
echo "========================================"

# Create deployment directory
mkdir -p loominary-deployment-package
cd loominary-deployment-package

# Copy all necessary files
echo "📦 Copying application files..."
cp -r ../backend ./
cp -r ../sveltekit-app ./
cp -r ../prisma ./
cp ../.env.production ./
cp ../package.json ./
cp ../README.md ./

# Copy deployment scripts
echo "📋 Copying deployment scripts..."
cp ../deploy-loominary-production.sh ./
cp ../start-loominary.sh ./
cp ../stop-loominary.sh ./
cp ../restart-loominary.sh ./
cp ../health-check.sh ./
cp ../final-system-test.sh ./

# Copy documentation
echo "📚 Copying documentation..."
cp ../LINUX_SERVER_DEPLOYMENT_GUIDE.md ./
cp ../PRODUCTION_DEPLOYMENT_STATUS.md ./
cp ../FINAL_DEPLOYMENT_SUMMARY.md ./

# Create ecosystem config for PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'loominary-backend',
      script: 'npx',
      args: 'tsx src/production-server.ts',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend.log',
      time: true
    },
    {
      name: 'loominary-frontend',
      script: 'npm',
      args: 'run preview -- --port 3000 --host 0.0.0.0',
      cwd: './sveltekit-app',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      max_memory_restart: '512M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend.log',
      time: true
    }
  ]
};
EOF

# Create nginx config template
cat > nginx-loominary.conf << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend (SvelteKit)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:3001/health;
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
    gzip_types text/plain text/css text/xml text/javascript application/javascript;

    client_max_body_size 100M;
}
EOF

# Create quick deployment script
cat > quick-deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 LOOMINARY QUICK DEPLOYMENT"
echo "============================="

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm ci --production
cd ../sveltekit-app && npm ci && npm run build
cd ..

# Setup database
echo "🗄️ Setting up database..."
cd backend
npx prisma generate
npx prisma db push
cd ..

# Create directories
mkdir -p logs uploads
chmod 755 uploads

# Start with PM2
echo "🚀 Starting services..."
pm2 start ecosystem.config.js
pm2 save

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "📊 Health: http://localhost:3001/health"
EOF

chmod +x quick-deploy.sh

# Create server setup script
cat > server-setup.sh << 'EOF'
#!/bin/bash

echo "🖥️ LOOMINARY SERVER SETUP"
echo "========================="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2
sudo npm install -g pm2

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

echo "✅ Server setup completed!"
echo "📋 Next: Run ./quick-deploy.sh to deploy Loominary"
EOF

chmod +x server-setup.sh

# Create README for deployment
cat > DEPLOYMENT_README.md << 'EOF'
# 🌟 LOOMINARY DEPLOYMENT PACKAGE 🌟

## 🚀 Quick Start

1. **Upload this package to your Linux server**
2. **Run server setup:** `./server-setup.sh`
3. **Configure environment:** Edit `.env.production` with your settings
4. **Deploy application:** `./quick-deploy.sh`
5. **Configure Nginx:** Copy `nginx-loominary.conf` to `/etc/nginx/sites-available/`
6. **Setup SSL:** Use Let's Encrypt with `certbot --nginx`

## 📋 Files Included

- `backend/` - Complete backend application
- `sveltekit-app/` - Complete frontend application
- `ecosystem.config.js` - PM2 configuration
- `nginx-loominary.conf` - Nginx configuration template
- `server-setup.sh` - Server preparation script
- `quick-deploy.sh` - Application deployment script
- `LINUX_SERVER_DEPLOYMENT_GUIDE.md` - Complete deployment guide

## 🌐 After Deployment

Your Loominary platform will be available at:
- Frontend: https://yourdomain.com
- Backend API: https://yourdomain.com/api/
- Health Check: https://yourdomain.com/health

## 🎯 Production Ready Features

✅ World's First Private Vault System
✅ Constellation UI Interface  
✅ AI-Powered Story Generation
✅ Enterprise Security
✅ Scalable Architecture
✅ Production Monitoring

**READY FOR GLOBAL LAUNCH! 🌍**
EOF

# Create archive
cd ..
echo "📦 Creating deployment archive..."
tar -czf loominary-deployment-package.tar.gz loominary-deployment-package/

echo ""
echo "🎉 DEPLOYMENT PACKAGE CREATED!"
echo "=============================="
echo "📦 Package: loominary-deployment-package.tar.gz"
echo "📁 Directory: loominary-deployment-package/"
echo ""
echo "🚀 To deploy on your Linux server:"
echo "1. Upload loominary-deployment-package.tar.gz to your server"
echo "2. Extract: tar -xzf loominary-deployment-package.tar.gz"
echo "3. cd loominary-deployment-package"
echo "4. Follow DEPLOYMENT_README.md instructions"
echo ""
echo "🌟 READY FOR GLOBAL LAUNCH!"