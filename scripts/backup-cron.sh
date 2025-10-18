#!/bin/bash

# Automated Database Backup Cron Job
# Add to crontab: crontab -e
# Daily at 2 AM: 0 2 * * * /path/to/backup-cron.sh
# Every 6 hours: 0 */6 * * * /path/to/backup-cron.sh

# Configuration
PROJECT_DIR="/path/to/osnovci"
LOG_FILE="$PROJECT_DIR/backups/backup.log"

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Log start
echo "==================================" >> "$LOG_FILE"
echo "Backup started: $(date)" >> "$LOG_FILE"

# Run backup
npm run backup >> "$LOG_FILE" 2>&1

# Check exit code
if [ $? -eq 0 ]; then
  echo "Backup completed successfully: $(date)" >> "$LOG_FILE"
  
  # Optional: Upload to cloud storage (S3, GCS, etc.)
  # aws s3 sync ./backups s3://your-bucket/backups/
else
  echo "Backup failed: $(date)" >> "$LOG_FILE"
  
  # Optional: Send alert
  # curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  #   -H 'Content-Type: application/json' \
  #   -d '{"text":"Database backup failed!"}'
fi

echo "==================================" >> "$LOG_FILE"

# Optional: Clean old logs (keep last 30 days)
find "$(dirname "$LOG_FILE")" -name "backup.log.*" -mtime +30 -delete

