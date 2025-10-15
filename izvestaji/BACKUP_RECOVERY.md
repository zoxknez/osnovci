# 💾 Backup & Recovery Plan

**Kompletna strategija za disaster recovery**

---

## 📊 Backup Strategy

### 3-2-1 Rule

✅ **3** kopije podataka  
✅ **2** različita medija  
✅ **1** off-site lokacija  

---

## 🗄️ Database Backups

### Automated Daily Backups

**Supabase (Recommended):**
- ✅ Automatic daily backups
- ✅ Point-in-time recovery (PITR)
- ✅ 7-day retention
- ✅ One-click restore

**Manual Backup:**
```bash
# Export entire database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Gzip za storage
gzip backup-$(date +%Y%m%d).sql

# Upload to S3/R2
aws s3 cp backup-*.sql.gz s3://osnovci-backups/
```

**Automated Script:**
```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="osnovci-backup-$DATE.sql"

# Backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload (choose one)
# Option 1: S3
aws s3 cp $BACKUP_FILE.gz s3://osnovci-backups/

# Option 2: Local storage
mv $BACKUP_FILE.gz /backups/

# Cleanup old backups (keep 30 days)
find /backups/ -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup complete: $BACKUP_FILE.gz"
```

**Cron Job:**
```bash
# Daily at 2 AM
0 2 * * * /opt/osnovci/scripts/backup-db.sh
```

---

### Backup Schedule

| Frequency | Retention | Type |
|-----------|-----------|------|
| **Hourly** | 24h | Incremental |
| **Daily** | 7 days | Full |
| **Weekly** | 4 weeks | Full |
| **Monthly** | 12 months | Full |

---

## 📁 Application Backups

### Git (Code)

```bash
# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin --tags

# Create GitHub release
gh release create v1.0.0 --notes "Production release"
```

### Files/Uploads

**If using object storage:**
```bash
# S3/R2 versioning enabled
# Automatic backups

# Manual backup
aws s3 sync s3://osnovci-uploads /local-backup/
```

---

## 🔄 Recovery Procedures

### Scenario 1: Database Corruption

**Recovery Time Objective (RTO):** <30 minutes  
**Recovery Point Objective (RPO):** <24 hours

**Steps:**
```bash
# 1. Stop application
docker-compose down app

# 2. Restore database
gunzip < backup-latest.sql.gz | psql $DATABASE_URL

# 3. Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 4. Restart application
docker-compose up -d app

# 5. Test
curl https://tvoj-domen.com/api/health
```

---

### Scenario 2: Accidental Data Deletion

**Steps:**
```bash
# 1. Identify what was deleted & when
SELECT * FROM audit_log WHERE timestamp > 'deletion-time';

# 2. Restore from closest backup
# Option A: Point-in-time recovery (if supported)
# Option B: Restore specific table

# 3. Extract deleted data
pg_restore --data-only --table=students backup.sql

# 4. Verify
# Check that data is restored correctly
```

---

### Scenario 3: Complete Server Failure

**Steps:**
```bash
# 1. Provision new server
# (Vercel/Railway auto-handles this)

# 2. Deploy latest version
git checkout v1.0.0
vercel --prod

# 3. Restore database
# Use latest backup

# 4. Verify
# Run smoke tests
```

**Time:** ~1-2 hours

---

### Scenario 4: Malicious Attack

**Steps:**
```bash
# 1. IMMEDIATE: Take offline
vercel --prod --env NODE_ENV=maintenance

# 2. Preserve evidence
# Copy logs
# Document attack

# 3. Assess damage
# Check what was compromised
# Review access logs

# 4. Clean install
# New server
# Restore from clean backup (pre-attack)
# Rotate all secrets

# 5. Harden security
# Patch vulnerability
# Update security measures

# 6. Notify users
# If personal data compromised
# Per GDPR requirements
```

---

## 🧪 Backup Testing

### Monthly Test

```bash
# 1. Download latest backup
aws s3 cp s3://osnovci-backups/latest.sql.gz .

# 2. Create test database
createdb osnovci_test

# 3. Restore
gunzip < latest.sql.gz | psql osnovci_test

# 4. Verify
psql osnovci_test -c "SELECT COUNT(*) FROM users;"

# 5. Test queries
psql osnovci_test < test-queries.sql

# 6. Cleanup
dropdb osnovci_test
```

**Document Results:**
- Date tested: ___________
- Backup date: ___________
- Restore time: ___________
- Data integrity: ✅/❌
- Issues found: ___________

---

## 📊 Backup Metrics

### Monitor These

- **Backup Success Rate:** Target >99.9%
- **Backup Duration:** <5 minutes
- **Restore Time:** <30 minutes
- **Storage Usage:** Monitor growth
- **Backup Size:** Track over time

### Alerts

```bash
# Email if backup fails
if [ $? -ne 0 ]; then
    echo "Backup failed!" | mail -s "ALERT: Backup Failed" admin@osnovci.rs
fi
```

---

## 💰 Cost Optimization

### Storage Costs

**S3 Glacier Deep Archive:**
- $0.99/TB/month
- Perfect za old backups

**Compression:**
```bash
# Gzip compression (70% reduction)
gzip backup.sql  # 1GB → 300MB

# Best compression
xz -9 backup.sql  # 1GB → 200MB (slower)
```

### Retention Policy

```
Hourly: 1 day = 24 backups × 300MB = 7.2GB
Daily: 7 days = 7 backups × 300MB = 2.1GB
Weekly: 4 weeks = 4 backups × 300MB = 1.2GB
Monthly: 12 months = 12 backups × 300MB = 3.6GB

Total: ~14GB storage
Cost: ~$0.33/month (S3 Standard)
```

---

## 🔐 Backup Security

### Encryption

```bash
# Encrypt backups
gpg --symmetric --cipher-algo AES256 backup.sql

# Decrypt
gpg --decrypt backup.sql.gpg > backup.sql
```

### Access Control

- **Who can restore:** Only senior devs + DevOps
- **Audit logs:** Track all restores
- **2FA required:** For backup access

---

## 📞 Emergency Contacts

### Data Loss Emergency

1. **Database Admin:** [Name] - [Phone/Email]
2. **DevOps Lead:** [Name] - [Phone/Email]
3. **CTO:** [Name] - [Phone/Email]

### Backup Service Providers

- **Hosting:** support@vercel.com
- **Database:** support@supabase.com
- **Storage:** aws-support@amazon.com

---

## ✅ Regular Maintenance

### Weekly
- [ ] Verify backups ran successfully
- [ ] Check backup logs
- [ ] Monitor storage usage

### Monthly
- [ ] Test restore procedure
- [ ] Review retention policy
- [ ] Cleanup old backups
- [ ] Update documentation

### Quarterly
- [ ] Full disaster recovery drill
- [ ] Review and update procedures
- [ ] Train new team members

---

## 🎯 Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Database corruption | 30 min | 24h |
| Accidental deletion | 1h | 1h |
| Server failure | 2h | 24h |
| Malicious attack | 4h | 24h |
| Natural disaster | 8h | 24h |

**RTO:** Recovery Time Objective (koliko dugo?)  
**RPO:** Recovery Point Objective (koliko gubitak podataka?)

---

## 📋 Recovery Checklist Template

```markdown
## Incident: [Description]
**Date:** [Date]
**Time:** [Time]
**Severity:** Critical/High/Medium/Low

### Impact
- Users affected: [Number]
- Data lost: [Description]
- Downtime: [Duration]

### Actions Taken
1. [Action] - [Time] - [Person]
2. [Action] - [Time] - [Person]
3. [Action] - [Time] - [Person]

### Root Cause
[Description]

### Resolution
[How was it fixed]

### Prevention
[What we'll do differently]

### Lessons Learned
- [Lesson 1]
- [Lesson 2]
```

---

**Backup je insurance policy - hope za best, plan za worst! 💪**

