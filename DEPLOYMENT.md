# 🚀 Loominary Production Deployment Guide

## The World's First Legacy Platform - Bigger Than Facebook or LinkedIn

This guide covers the complete production deployment of Loominary, the revolutionary legacy preservation platform designed to leave something back for future generations.

## 🌟 Platform Overview

Loominary is a world-first platform that combines:
- **Revolutionary 3D Constellation UI** - Interactive memory visualization
- **AI-Powered Story Generation** - Using Ollama/Llama 3.1
- **Multi-Platform Support** - Web, mobile (React Native), and desktop
- **Enterprise Payment System** - 4-tier Stripe integration
- **Global Scalability** - Built for millions of users worldwide
- **Legacy Preservation** - Digital inheritance and time capsules

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Frontend      │    │   Backend API   │
│   Load Balancer │◄──►│   SvelteKit     │◄──►│   Fastify       │
│   SSL/Security  │    │   Port 3000     │    │   Port 3001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │     Ollama      │
│   Database      │    │     Cache       │    │   AI Service    │
│   Port 5432     │    │   Port 6379     │    │   Port 11434    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: 8+ cores (16+ recommended for production)
- **RAM**: 32GB+ (64GB+ recommended)
- **Storage**: 500GB+ SSD (1TB+ recommended)
- **Network**: 1Gbps+ connection
- **GPU**: NVIDIA GPU for AI features (optional but recommended)

### Required Software
```bash
# Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt-get install git

# SSL Certificate Tools
sudo apt-get install certbot python3-certbot-nginx
```

## 🔐 Security Setup

### 1. SSL Certificates
```bash
# Generate SSL certificates with Let's Encrypt
sudo certbot certonly --standalone -d heirloom.app -d www.heirloom.app -d admin.heirloom.app

# Copy certificates to nginx directory
sudo mkdir -p /opt/heirloom/nginx/ssl
sudo cp /etc/letsencrypt/live/heirloom.app/fullchain.pem /opt/heirloom/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/heirloom.app/privkey.pem /opt/heirloom/nginx/ssl/key.pem
```

### 2. Environment Configuration
```bash
# Copy and configure environment file
cp .env.production.example .env.production
nano .env.production
```

**Critical Environment Variables:**
```bash
# Database (Use strong passwords!)
POSTGRES_PASSWORD=your_super_secure_postgres_password_here
REDIS_PASSWORD=your_super_secure_redis_password_here

# JWT Secret (32+ characters)
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Application URLs
FRONTEND_URL=https://heirloom.app
BACKEND_URL=https://heirloom.app/api
```

### 3. Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow from 10.0.0.0/8 to any port 5432  # PostgreSQL (internal only)
sudo ufw allow from 10.0.0.0/8 to any port 6379  # Redis (internal only)
```

## 🚀 Deployment Process

### 1. Clone Repository
```bash
sudo mkdir -p /opt/heirloom
sudo chown $USER:$USER /opt/heirloom
cd /opt/heirloom
git clone https://github.com/Reshigan/Loominary.git .
git checkout main
```

### 2. Configure Environment
```bash
# Copy and edit production environment
cp .env.production.example .env.production
nano .env.production

# Set proper permissions
chmod 600 .env.production
```

### 3. Run Deployment Script
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run full production deployment
./deploy.sh production main true
```

### 4. Verify Deployment
```bash
# Check all services are running
docker-compose -f docker-compose.production.yml ps

# Test endpoints
curl -f https://heirloom.app/health
curl -f https://heirloom.app/api/health
curl -f https://heirloom.app/api/subscriptions/tiers
```

## 📊 Monitoring & Observability

### Access Monitoring Dashboards
- **Grafana**: https://admin.heirloom.app
- **Prometheus**: https://admin.heirloom.app/prometheus
- **Application**: https://heirloom.app

### Key Metrics to Monitor
1. **Application Performance**
   - API response times (< 200ms target)
   - Error rates (< 0.1% target)
   - Throughput (requests per second)

2. **Infrastructure Health**
   - CPU usage (< 70% average)
   - Memory usage (< 80% average)
   - Disk usage (< 85% full)
   - Network latency

3. **Business Metrics**
   - Active users
   - Subscription conversions
   - AI story generations
   - Mobile app usage

4. **Security Metrics**
   - Failed login attempts
   - Suspicious activities
   - SSL certificate expiry

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
The platform includes a comprehensive CI/CD pipeline that:

1. **Security Scanning** - Trivy, CodeQL, OWASP ZAP
2. **Testing** - Backend, frontend, and mobile tests
3. **Building** - Docker images with multi-stage builds
4. **Deployment** - Automated production deployment
5. **Monitoring** - Post-deployment health checks

### Manual Deployment
```bash
# Deploy from dev branch to staging
./deploy.sh staging dev true

# Deploy from main branch to production
./deploy.sh production main true

# Emergency deployment (skip tests)
./deploy.sh production main false
```

## 📱 Mobile App Deployment

### iOS App Store
```bash
cd mobile-app
# Build iOS app
npx react-native build-ios --configuration Release

# Upload to App Store Connect
fastlane ios release
```

### Google Play Store
```bash
cd mobile-app
# Build Android app
npx react-native build-android --mode=release

# Upload to Google Play Console
fastlane android release
```

## 🔧 Maintenance & Operations

### Daily Operations
```bash
# Check system health
./deploy.sh production main true --health-check

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Database backup
docker exec heirloom-postgres pg_dump -U heirloom_user heirloom_production > backup_$(date +%Y%m%d).sql
```

### Weekly Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker images
docker system prune -f

# Rotate logs
sudo logrotate -f /etc/logrotate.d/heirloom

# SSL certificate renewal
sudo certbot renew --quiet
```

### Monthly Tasks
```bash
# Security updates
docker-compose -f docker-compose.production.yml pull
./deploy.sh production main true

# Performance review
# Check Grafana dashboards for trends

# Backup verification
# Test restore procedures
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs [service-name]

# Check disk space
df -h

# Check memory usage
free -h
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
docker exec heirloom-postgres pg_isready -U heirloom_user

# Reset database connection
docker-compose -f docker-compose.production.yml restart postgres backend
```

#### 3. SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -enddate -noout -in nginx/ssl/cert.pem

# Renew certificate
sudo certbot renew
```

#### 4. High Memory Usage
```bash
# Check container memory usage
docker stats

# Restart services if needed
docker-compose -f docker-compose.production.yml restart
```

### Emergency Procedures

#### 1. Complete System Failure
```bash
# Restore from backup
./restore.sh [backup-date]

# Restart all services
docker-compose -f docker-compose.production.yml up -d
```

#### 2. Database Corruption
```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Restore database from backup
docker exec heirloom-postgres psql -U heirloom_user -d heirloom_production < backup_latest.sql

# Restart services
docker-compose -f docker-compose.production.yml up -d
```

## 📈 Scaling for Global Launch

### Horizontal Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.production.yml up -d --scale backend=4

# Scale frontend services
docker-compose -f docker-compose.production.yml up -d --scale frontend=2
```

### Database Scaling
```bash
# Set up read replicas
# Configure PostgreSQL streaming replication

# Implement database sharding
# Use Prisma's database sharding features
```

### CDN Configuration
```bash
# Configure Cloudflare CDN
# Set up global edge locations
# Enable image optimization
```

## 🌍 Global Deployment Strategy

### Multi-Region Setup
1. **Primary Region**: US-East (Virginia)
2. **Secondary Regions**: EU-West (Ireland), Asia-Pacific (Singapore)
3. **Edge Locations**: Global CDN with 200+ locations

### Load Balancing
- **DNS-based**: Route 53 with health checks
- **Application-level**: Nginx with upstream servers
- **Database**: Read replicas in each region

## 🎯 Success Metrics

### Technical KPIs
- **Uptime**: 99.99% availability
- **Performance**: < 200ms API response time
- **Scalability**: Support 10M+ concurrent users
- **Security**: Zero data breaches

### Business KPIs
- **User Growth**: 1M+ users in first year
- **Revenue**: $10M+ ARR target
- **Engagement**: 80%+ monthly active users
- **Retention**: 90%+ annual retention rate

## 🏆 Mission: Bigger Than Facebook or LinkedIn

Loominary is designed to be the world's first legacy platform that:
- **Preserves memories** for future generations
- **Connects families** across time and space
- **Uses AI** to enhance storytelling
- **Provides value** that lasts forever
- **Builds community** around shared heritage

## 📞 Support & Contact

- **Technical Support**: tech@heirloom.app
- **Security Issues**: security@heirloom.app
- **Business Inquiries**: business@heirloom.app
- **Emergency Hotline**: +1-800-HEIRLOOM

---

**Remember**: This platform is about leaving a legacy for future generations. Every deployment, every feature, every decision should be made with that mission in mind. We're not just building software - we're preserving human stories for eternity.

🌟 **Make it count. Make it last. Make it legendary.** 🌟