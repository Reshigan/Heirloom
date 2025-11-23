# Performance & Scaling Guide

This guide covers the performance optimizations implemented in Phase 4 for scaling to 1M+ users.

## Database Optimization

### Indexes Added
- **VaultItem**: Added indexes on `emotionCategory`, `importanceScore`, and `keywords` for faster filtering
- **User**: Added index on `email` for faster lookups
- Existing indexes on `vaultId`, `createdAt`, `scheduledDelivery` optimized for common queries

### Connection Pooling
- Prisma configured with connection pooling (up to 20 concurrent connections)
- Prevents connection exhaustion under high load

### Query Optimization
- Use `select` to fetch only needed fields
- Use `include` sparingly to avoid N+1 queries
- Batch operations with `Promise.all()` where possible

## Redis Caching

### Implementation
- Redis caching layer implemented via `CacheService`
- Automatic fallback if Redis is unavailable (graceful degradation)
- Cache invalidation on data mutations

### Cached Endpoints
- `GET /api/vault/items` - Cached for 60 seconds
- Cache key pattern: `vault:items:{userId}:{type}:{limit}:{offset}`
- Invalidated on: vault item creation, update, deletion

### Configuration
Set `REDIS_URL` environment variable:
```bash
REDIS_URL="redis://localhost:6379"
# Or for Redis Cloud:
REDIS_URL="redis://username:password@host:port"
```

### Cache Strategy
- **TTL**: 60 seconds for vault items (balance between freshness and performance)
- **Invalidation**: Pattern-based invalidation on mutations
- **Graceful Degradation**: App works without Redis (just slower)

## CDN Configuration

### Static Assets
Serve static assets (images, videos, documents) from a CDN for better performance:

#### Recommended CDN Providers
1. **Cloudflare** (Free tier available)
   - Automatic caching
   - DDoS protection
   - Global edge network

2. **AWS CloudFront**
   - Integrates with S3
   - Custom cache behaviors
   - Low latency

3. **Vercel** (for frontend)
   - Automatic edge caching
   - Zero configuration
   - Integrated with Next.js

### Implementation Steps
1. Upload static assets to S3 or similar object storage
2. Configure CDN to point to your origin server
3. Update `thumbnailUrl` and media URLs to use CDN domain
4. Set appropriate cache headers:
   ```
   Cache-Control: public, max-age=31536000, immutable
   ```

### Frontend Deployment
Deploy frontend to Vercel or Netlify for automatic CDN:
```bash
# Vercel
npm install -g vercel
cd frontend
vercel --prod

# Netlify
npm install -g netlify-cli
cd frontend
netlify deploy --prod --dir=.next
```

## Load Balancing

### Horizontal Scaling
Run multiple backend instances behind a load balancer:

#### Using Nginx
```nginx
upstream backend {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Using PM2 Cluster Mode
```bash
pm2 start dist/index.js -i max --name heirloom-backend
```

### Database Connection Pooling
- Each backend instance maintains its own connection pool
- Total connections = instances × pool size
- Monitor with: `SELECT count(*) FROM pg_stat_activity;`

## Performance Monitoring

### Metrics to Track
1. **Response Time**: Average API response time (target: < 200ms)
2. **Cache Hit Rate**: Redis cache hit percentage (target: > 80%)
3. **Database Queries**: Slow query log (target: < 100ms per query)
4. **Memory Usage**: Backend memory consumption (target: < 512MB per instance)
5. **CPU Usage**: Backend CPU usage (target: < 70%)

### Tools
- **PM2 Monitor**: `pm2 monit`
- **Redis Monitor**: `redis-cli monitor`
- **PostgreSQL Slow Queries**: Enable `log_min_duration_statement = 100` in postgresql.conf

## Capacity Planning

### Expected Load (1M Users)
- **Daily Active Users**: 100,000 (10%)
- **Requests per Second**: ~1,157 RPS (assuming 10 requests/user/day)
- **Database Connections**: 20 per instance × 10 instances = 200 connections
- **Redis Memory**: ~2GB for cache
- **Storage**: ~10TB (10GB per user average)

### Recommended Infrastructure
- **Backend**: 10 instances (2 vCPU, 4GB RAM each)
- **Database**: PostgreSQL (8 vCPU, 32GB RAM, 1TB SSD)
- **Redis**: 1 instance (2 vCPU, 4GB RAM)
- **Load Balancer**: Nginx or AWS ALB
- **CDN**: Cloudflare or AWS CloudFront

## Cost Estimation (1M Users)

### AWS Pricing (Approximate)
- **EC2 (Backend)**: 10 × t3.medium = $300/month
- **RDS PostgreSQL**: db.r5.2xlarge = $600/month
- **ElastiCache Redis**: cache.t3.medium = $50/month
- **S3 Storage**: 10TB = $230/month
- **CloudFront**: 10TB transfer = $850/month
- **ALB**: $20/month
- **Total**: ~$2,050/month

### Optimization Tips
- Use Reserved Instances for 40% savings
- Enable S3 Intelligent-Tiering for storage savings
- Use CloudFront with S3 origin for cheaper transfers
- Implement aggressive caching to reduce database load

## Security Considerations

### Rate Limiting
Implement rate limiting to prevent abuse:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### DDoS Protection
- Use Cloudflare for DDoS protection
- Enable AWS Shield if using AWS
- Implement IP whitelisting for admin endpoints

## Troubleshooting

### High Database Load
1. Check slow query log
2. Add missing indexes
3. Increase connection pool size
4. Consider read replicas

### Low Cache Hit Rate
1. Increase TTL for stable data
2. Pre-warm cache on startup
3. Monitor cache eviction rate
4. Increase Redis memory

### High Memory Usage
1. Check for memory leaks with `node --inspect`
2. Reduce connection pool size
3. Implement pagination for large datasets
4. Use streaming for large file uploads

## Next Steps

1. Set up monitoring with Prometheus + Grafana
2. Implement APM with New Relic or DataDog
3. Set up automated backups
4. Implement disaster recovery plan
5. Load test with k6 or Artillery
