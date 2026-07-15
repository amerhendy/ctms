#!/bin/bash

# PostgreSQL Backup Script
# استخدام: ./backup.sh <database_name> <output_file>

DB_NAME=${1:-postgres}
OUTPUT_FILE=${2:-/shared/backup_$(date +%Y%m%d_%H%M%S).sql}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}

echo "🔄 جاري إنشاء backup للـ database: $DB_NAME"
echo "📁 سيتم الحفظ في: $OUTPUT_FILE"

pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $OUTPUT_FILE

if [ $? -eq 0 ]; then
    echo "✅ تم إنشاء backup بنجاح!"
    ls -lh $OUTPUT_FILE
else
    echo "❌ حدث خطأ في إنشاء الـ backup"
    exit 1
fi
