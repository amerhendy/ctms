#!/bin/bash

# PostgreSQL Restore Script
# استخدام: ./restore.sh <database_name> <backup_file>

DB_NAME=${1:-postgres}
BACKUP_FILE=${2:-/shared/backup.sql}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ملف الـ backup غير موجود: $BACKUP_FILE"
    exit 1
fi

echo "🔄 جاري استعادة البيانات للـ database: $DB_NAME"
echo "📁 من ملف: $BACKUP_FILE"

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ تم استعادة البيانات بنجاح!"
else
    echo "❌ حدث خطأ في استعادة البيانات"
    exit 1
fi
