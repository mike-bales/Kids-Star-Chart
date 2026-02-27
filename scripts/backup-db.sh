#!/bin/bash
# Backup the Star Chart SQLite database
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_FILE="$SCRIPT_DIR/../server/data/starchart.db"
BACKUP_DIR="$SCRIPT_DIR/../backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/starchart_${TIMESTAMP}.db"

if [ -f "$DB_FILE" ]; then
  cp "$DB_FILE" "$BACKUP_FILE"
  echo "Backup created: $BACKUP_FILE"
else
  echo "Database not found: $DB_FILE"
  exit 1
fi

# Keep only last 10 backups
cd "$BACKUP_DIR" && ls -t starchart_*.db | tail -n +11 | xargs -r rm --
echo "Done."
