# 🚀 Loominary Deployment Guide

## Overview

This guide covers the complete deployment workflow for the Loominary platform, from development to production.

## Architecture

- **Frontend**: SvelteKit application with constellation UI
- **Backend**: Node.js API (optional - frontend can run standalone)
- **Database**: PostgreSQL + Redis + Ollama (AI)
- **Web Server**: Nginx with SSL
- **Domain**: loom.vantax.co.za

## Deployment Flow

```
Development (dev branch) → Main Branch → Production Server
```

## Quick Start

### 1. Development Setup

```bash
# Set up development environment
./dev-workflow.sh dev-setup

# Start development server
./dev-workflow.sh dev-start

# Access development site
open http://localhost:5173
```

### 2. Deploy to Production

```bash
# Complete deployment flow
./dev-workflow.sh full-deploy
```

### 3. Check Status

```bash
# View system status
./dev-workflow.sh status
```

## Detailed Commands

### Development Workflow

| Command | Description |
|---------|-------------|
| `./dev-workflow.sh dev-setup` | Set up development environment |
| `./dev-workflow.sh dev-start` | Start development servers |
| `./dev-workflow.sh dev-test` | Run tests |
| `./dev-workflow.sh dev-build` | Build for development |
| `./dev-workflow.sh merge-to-main` | Merge dev to main branch |
| `./dev-workflow.sh deploy-prod` | Deploy to production |
| `./dev-workflow.sh full-deploy` | Complete dev→main→prod flow |
| `./dev-workflow.sh status` | Show system status |

### Production Deployment

```bash
# Direct production deployment
./deploy-comprehensive.sh
```

## Branch Strategy

- **dev**: Development branch for active development
- **main**: Production-ready code, triggers deployment
- **feature/***: Feature branches (merge to dev)

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. **On Pull Request to main**: Run tests
2. **On Push to main**: Deploy to production

### Required Secrets

Add these secrets to your GitHub repository:

- `PRODUCTION_SSH_KEY`: SSH private key for production server

## Production Environment

### Server Details

- **IP**: 3.8.160.221
- **Domain**: loom.vantax.co.za
- **SSL**: Let's Encrypt (auto-renewal)
- **Services**: Nginx, PostgreSQL, Redis, Ollama

### Service Ports

- **Frontend**: 3002 (SvelteKit preview)
- **Backend**: 3001 (Node.js API - optional)
- **Database**: 5432 (PostgreSQL)
- **Cache**: 6379 (Redis)
- **AI**: 11434 (Ollama)

### URLs

- **Production**: https://loom.vantax.co.za
- **Health Check**: https://loom.vantax.co.za/health
- **Database Status**: https://loom.vantax.co.za/db-status

## Troubleshooting

### Common Issues

1. **Site not accessible externally**
   - Fix AWS Security Group to allow ports 80/443
   - Check Nginx configuration

2. **Frontend not starting**
   - Check logs: `tail -f /tmp/frontend.log`
   - Restart: `./deploy-comprehensive.sh`

3. **SSL certificate issues**
   - Renew: `sudo certbot renew`
   - Check expiry: `sudo certbot certificates`

### Log Files

- Frontend: `/tmp/frontend.log`
- Backend: `/tmp/backend.log`
- Nginx: `/var/log/nginx/`
- System: `/var/log/loominary/`

### Service Management

```bash
# Check service status
systemctl status nginx
docker-compose -f docker-compose.simple.yml ps

# Restart services
sudo systemctl restart nginx
docker-compose -f docker-compose.simple.yml restart

# View logs
sudo journalctl -u nginx -f
docker-compose -f docker-compose.simple.yml logs -f
```

## Security

### SSL Certificate

- **Provider**: Let's Encrypt
- **Auto-renewal**: Configured via cron
- **Expiry**: Check with `sudo certbot certificates`

### Firewall

- **AWS Security Group**: Must allow ports 80/443
- **UFW**: Currently disabled (using AWS security groups)

### Headers

Nginx is configured with security headers:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

## Monitoring

### Health Checks

- **Application**: https://loom.vantax.co.za/health
- **Database**: https://loom.vantax.co.za/db-status

### Log Rotation

Configured via `/etc/logrotate.d/loominary`:
- Daily rotation
- 30 days retention
- Compression enabled

## Backup

### Automated Backups

The deployment script creates backups in `/opt/loominary/backups/` before each deployment.

### Manual Backup

```bash
# Create backup
sudo mkdir -p /opt/loominary/backups/manual-$(date +%Y%m%d)
sudo cp -r /opt/loominary/Heirloom /opt/loominary/backups/manual-$(date +%Y%m%d)/
```

## Performance

### Optimization

- **Gzip**: Enabled in Nginx
- **Caching**: Browser caching headers
- **CDN**: Can be added for static assets

### Monitoring

- **Response Time**: Monitor via health checks
- **Resource Usage**: Monitor via system tools
- **Error Rates**: Check Nginx logs

## Support

### Getting Help

1. Check logs first
2. Run `./dev-workflow.sh status`
3. Review this guide
4. Check GitHub Issues

### Emergency Procedures

1. **Site Down**: Run `./deploy-comprehensive.sh`
2. **SSL Issues**: Run `sudo certbot renew`
3. **Database Issues**: Restart Docker services
4. **Complete Reset**: Restore from backup

## Development

### Local Development

```bash
# Start development
./dev-workflow.sh dev-start

# Make changes to code
# Test locally at http://localhost:5173

# Deploy when ready
./dev-workflow.sh full-deploy
```

### Code Structure

```
/opt/loominary/Heirloom/
├── sveltekit-app/          # Frontend application
├── backend/                # Backend API (optional)
├── .github/workflows/      # CI/CD pipeline
├── docker-compose.simple.yml
├── deploy-comprehensive.sh # Production deployment
├── dev-workflow.sh        # Development workflow
└── DEPLOYMENT_GUIDE.md    # This guide
```

## Future Enhancements

- [ ] Backend API integration
- [ ] Database migrations
- [ ] Automated testing
- [ ] Performance monitoring
- [ ] CDN integration
- [ ] Multi-environment support

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Status**: Production Ready ✅
