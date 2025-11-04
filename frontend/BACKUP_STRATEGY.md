# Heirloom Backup & Disaster Recovery Strategy

## Overview

Heirloom stores irreplaceable family memories that must survive for decades. This document outlines our comprehensive backup and disaster recovery strategy.

## Critical Requirements

- **RPO (Recovery Point Objective)**: Maximum 1 hour of data loss
- **RTO (Recovery Time Objective)**: Maximum 4 hours to restore service
- **Retention**: Indefinite retention for vault data (posthumous access requirement)
- **Durability**: 99.999999999% (11 nines) for long-term storage

## Database Backup Strategy

### 1. Point-in-Time Recovery (PITR)

**Supabase:**
```bash
# Enable PITR in Supabase dashboard
# Retention: 30 days minimum (Pro plan)
# Automatic continuous backup of WAL logs
```

**AWS RDS:**
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier heirloom-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"
```

### 2. Daily Logical Backups

**Automated pg_dump to S3 Glacier:**

Create backup script: `/scripts/backup-database.sh`

```bash
#!/bin/bash
set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="heirloom_backup_${TIMESTAMP}.sql.gz"
S3_BUCKET="heirloom-backups"
S3_PATH="database/daily/${BACKUP_FILE}"

# Perform backup
echo "Starting database backup..."
pg_dump $DATABASE_URL | gzip > /tmp/${BACKUP_FILE}

# Upload to S3
echo "Uploading to S3..."
aws s3 cp /tmp/${BACKUP_FILE} s3://${S3_BUCKET}/${S3_PATH} \
  --storage-class GLACIER_DEEP_ARCHIVE \
  --server-side-encryption AES256

# Cleanup local file
rm /tmp/${BACKUP_FILE}

echo "Backup completed: ${BACKUP_FILE}"
```

**Schedule with cron (or GitHub Actions):**

```yaml
# .github/workflows/backup-database.yml
name: Daily Database Backup
on:
  schedule:
    - cron: '0 3 * * *' # 3 AM UTC daily
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client
      - name: Run backup script
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: bash scripts/backup-database.sh
```

### 3. Weekly Full Backups

```bash
# Weekly full backup with schema
pg_dump --clean --if-exists --create $DATABASE_URL | \
  gzip > heirloom_full_backup_$(date +%Y%m%d).sql.gz

# Upload to S3 with 7-year retention
aws s3 cp heirloom_full_backup_*.sql.gz \
  s3://heirloom-backups/database/weekly/ \
  --storage-class GLACIER_DEEP_ARCHIVE
```

### 4. Cross-Region Replication

**AWS RDS:**
```bash
# Create read replica in different region
aws rds create-db-instance-read-replica \
  --db-instance-identifier heirloom-replica-eu \
  --source-db-instance-identifier heirloom-prod \
  --region eu-west-1
```

**Supabase:**
- Use Supabase's built-in replication (Enterprise plan)
- Or manually replicate backups to different region S3 bucket

## File Storage Backup Strategy

### 1. S3 Versioning

```bash
# Enable versioning on S3 bucket
aws s3api put-bucket-versioning \
  --bucket heirloom-vault \
  --versioning-configuration Status=Enabled
```

### 2. S3 Lifecycle Policies

```json
{
  "Rules": [
    {
      "Id": "TransitionToIntelligentTiering",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "INTELLIGENT_TIERING"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER_INSTANT_RETRIEVAL"
        },
        {
          "Days": 365,
          "StorageClass": "GLACIER_DEEP_ARCHIVE"
        }
      ],
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "GLACIER_DEEP_ARCHIVE"
        }
      ]
    }
  ]
}
```

Apply lifecycle policy:
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket heirloom-vault \
  --lifecycle-configuration file://lifecycle-policy.json
```

### 3. Cross-Region Replication

```bash
# Enable cross-region replication
aws s3api put-bucket-replication \
  --bucket heirloom-vault \
  --replication-configuration file://replication-config.json
```

**replication-config.json:**
```json
{
  "Role": "arn:aws:iam::ACCOUNT:role/s3-replication-role",
  "Rules": [
    {
      "Status": "Enabled",
      "Priority": 1,
      "DeleteMarkerReplication": { "Status": "Enabled" },
      "Filter": {},
      "Destination": {
        "Bucket": "arn:aws:s3:::heirloom-vault-replica-eu",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": { "Minutes": 15 }
        },
        "Metrics": {
          "Status": "Enabled",
          "EventThreshold": { "Minutes": 15 }
        }
      }
    }
  ]
}
```

## Disaster Recovery Procedures

### Database Recovery

**Restore from PITR (Supabase):**
1. Go to Supabase Dashboard → Database → Backups
2. Select restore point (any time within last 30 days)
3. Click "Restore" and confirm
4. Update DATABASE_URL in Vercel to new instance
5. Verify data integrity

**Restore from PITR (AWS RDS):**
```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier heirloom-prod \
  --target-db-instance-identifier heirloom-restored \
  --restore-time 2025-11-04T03:00:00Z
```

**Restore from pg_dump:**
```bash
# Download backup from S3
aws s3 cp s3://heirloom-backups/database/daily/heirloom_backup_20251104.sql.gz .

# Restore to database
gunzip -c heirloom_backup_20251104.sql.gz | psql $DATABASE_URL
```

### File Storage Recovery

**Restore deleted file:**
```bash
# List versions
aws s3api list-object-versions \
  --bucket heirloom-vault \
  --prefix "user123/photo.jpg"

# Restore specific version
aws s3api copy-object \
  --bucket heirloom-vault \
  --copy-source "heirloom-vault/user123/photo.jpg?versionId=VERSION_ID" \
  --key "user123/photo.jpg"
```

**Restore from Glacier:**
```bash
# Initiate retrieval (takes 12-48 hours for Deep Archive)
aws s3api restore-object \
  --bucket heirloom-vault \
  --key "user123/video.mp4" \
  --restore-request Days=7,GlacierJobParameters={Tier=Bulk}

# Check restoration status
aws s3api head-object \
  --bucket heirloom-vault \
  --key "user123/video.mp4"

# Download once restored
aws s3 cp s3://heirloom-vault/user123/video.mp4 .
```

## Monitoring & Alerts

### Database Health Checks

```typescript
// src/app/api/health/database/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'healthy', timestamp: new Date() })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: String(error) },
      { status: 503 }
    )
  }
}
```

### Backup Verification

```bash
# Weekly backup verification script
#!/bin/bash
# Download latest backup
LATEST_BACKUP=$(aws s3 ls s3://heirloom-backups/database/daily/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp s3://heirloom-backups/database/daily/${LATEST_BACKUP} /tmp/

# Restore to test database
gunzip -c /tmp/${LATEST_BACKUP} | psql $TEST_DATABASE_URL

# Verify row counts match production
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM \"Memory\";"

# Cleanup
psql $TEST_DATABASE_URL -c "DROP DATABASE test_restore;"
```

### CloudWatch Alarms (AWS)

```bash
# Alert on backup failures
aws cloudwatch put-metric-alarm \
  --alarm-name heirloom-backup-failure \
  --alarm-description "Alert when database backup fails" \
  --metric-name BackupRetentionPeriodStorageUsed \
  --namespace AWS/RDS \
  --statistic Average \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 0 \
  --comparison-operator LessThanThreshold
```

## Cost Optimization

### Storage Costs (Monthly Estimates)

**Database Backups:**
- PITR (30 days): Included in Supabase Pro ($25/mo) or RDS ($0.095/GB-month)
- Daily backups in Glacier Deep Archive: ~$0.00099/GB-month
- Example: 10GB database = $0.01/month for daily backups

**File Storage:**
- S3 Standard (first 30 days): $0.023/GB-month
- Intelligent Tiering (30-90 days): $0.0125/GB-month
- Glacier Deep Archive (90+ days): $0.00099/GB-month
- Example: 1TB vault = $23/mo → $12.50/mo → $1/mo over time

**Total Backup Costs:**
- Startup (100GB total): ~$5-10/month
- Growth (1TB total): ~$30-50/month
- Mature (10TB total): ~$100-200/month

## Compliance & Retention

### Legal Requirements

- **Data Retention**: Indefinite (posthumous access is core feature)
- **Data Deletion**: User-initiated only (GDPR right to be forgotten)
- **Audit Logs**: 7 years retention for payment records
- **Encryption**: At-rest (AES-256) and in-transit (TLS 1.3)

### Backup Retention Policy

| Backup Type | Retention Period | Storage Class |
|-------------|------------------|---------------|
| PITR | 30 days | Standard |
| Daily logical | 90 days | Glacier Deep Archive |
| Weekly full | 7 years | Glacier Deep Archive |
| Monthly snapshot | Indefinite | Glacier Deep Archive |
| User vault data | Indefinite | Intelligent Tiering → Glacier |

## Testing & Validation

### Quarterly Disaster Recovery Drills

1. **Q1**: Restore database from PITR (random point in last 30 days)
2. **Q2**: Restore database from pg_dump (random daily backup)
3. **Q3**: Restore file from Glacier Deep Archive
4. **Q4**: Full disaster recovery simulation (new region)

### Backup Verification Checklist

- [ ] Database backups completing successfully
- [ ] S3 lifecycle policies active
- [ ] Cross-region replication working
- [ ] Backup restoration tested monthly
- [ ] Monitoring alerts configured
- [ ] Backup costs within budget
- [ ] Encryption enabled on all backups
- [ ] Access logs reviewed quarterly

## Emergency Contacts

- **Database Issues**: DBA on-call (PagerDuty)
- **Storage Issues**: DevOps team (Slack #incidents)
- **Security Incidents**: security@heirloom.com
- **AWS Support**: Enterprise support (24/7)

## References

- [AWS RDS Backup Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [Supabase Backup Guide](https://supabase.com/docs/guides/platform/backups)
- [S3 Glacier Documentation](https://docs.aws.amazon.com/amazonglacier/latest/dev/introduction.html)
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

**Last Updated**: November 4, 2025  
**Owner**: DevOps Team  
**Review Frequency**: Quarterly
