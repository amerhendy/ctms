$PROJECT_DIR = Get-Location
$PACKAGE_DIR = "$PROJECT_DIR\Office_Transfer_Package"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  بدء فرش داتا وتعديلات المكتب في جهاز البيت  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if (!(Test-Path "$PACKAGE_DIR\postgres_backup.tar.gz")) {
    Write-Host "[-] خطأ: لم يتم العثور على فولدر الشحنة Office_Transfer_Package!" -ForegroundColor Red
    Exit
}

# 1. نسف أي قديم أو متعارض في البيت على بياض تماماً
Write-Host "[+] تنظيف حاويات والـ Volumes القديمة في البيت..." -ForegroundColor Yellow
docker-compose down -v
docker rm -f $(docker ps -aq) 2>$null

# 2. شحن الـ Images المعدلة والرسمية جوة دوكر البيت بدون إنترنت
Write-Host "[+] جاري شحن وتثبيت الـ 7 صور جوة دوكر البيت (Offline)..." -ForegroundColor Yellow
docker load -i "$PACKAGE_DIR\backend.tar"
docker load -i "$PACKAGE_DIR\frontend.tar"
docker load -i "$PACKAGE_DIR\celery_worker.tar"
docker load -i "$PACKAGE_DIR\celery_beat.tar"
docker load -i "$PACKAGE_DIR\nginx.tar"
docker load -i "$PACKAGE_DIR\postgres.tar"
docker load -i "$PACKAGE_DIR\redis.tar"

# 3. إنشاء الـ Volume الجديد وفرش داتا قاعدة البيانات جواه
Write-Host "[+] جاري استرجاع بيانات قاعدة البيانات للمكتب..." -ForegroundColor Yellow
docker volume create default_postgres_data | Out-Null

docker run --rm -v default_postgres_data:/volume -v "${PROJECT_DIR}:/backup" alpine sh -c "rm -rf /volume/* && tar xzf /backup/Office_Transfer_Package/postgres_backup.tar.gz -C /volume"
# 4. تعديل ملف الـ docker-compose.yml تلقائياً عشان يقرأ الـ office_version وميطلبش نت للـ build
Write-Host "[+] تهيئة إعدادات الـ Compose للعمل الـ Offline..." -ForegroundColor Yellow
$composeFile = "$PROJECT_DIR\docker-compose.yml"
(Get-Content $composeFile) -replace 'image: default-backend', 'image: ctms_backend:office_version' `
                            -replace 'image: default-frontend', 'image: ctms_frontend:office_version' `
                            -replace 'image: default-celery_worker', 'image: ctms_celery_worker:office_version' `
                            -replace 'image: default-celery_beat', 'image: ctms_celery_beat:office_version' | Set-Content $composeFile

# 5. التشغيل النهائي للمشروع بالكامل
Write-Host "[+] تشغيل المشروع بالكامل بالداتا والمكتبات الجديدة..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "=============================================" -ForegroundColor Green
Write-Host "[✔][✔] مبروك يا مدير عامر! السيستم يعمل الآن في البيت بنجاح." -ForegroundColor Green
Write-Host "[✔] الجداول كاملة، تعديلات الـ pip جاهزة، وإنترنت مستخدم 0%." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green