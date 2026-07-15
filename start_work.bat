@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo 🛑  Stopping Docker Containers...
echo ===================================================
:: تحديد ملف اليامل المناسب لتجنب خطأ الـ not found
if exist docker-compose.services.yml (
    docker compose -f docker-compose.services.yml down
) else (
    :: إذا لم يجد ملف يامل، سيقوم بإيقاف الحاوية مباشرة عن طريق اسمها
    echo  No docker-compose file found. Stopping container %DB_CONTAINER% directly...
    docker stop %DB_CONTAINER%
)

if exist docker-compose.yml (
    docker compose -f docker-compose.yml down
) else (
    :: إذا لم يجد ملف يامل، سيقوم بإيقاف الحاوية مباشرة عن طريق اسمها
    echo  No docker-compose file found. Stopping container %DB_CONTAINER% directly...
    docker stop %DB_CONTAINER%
)

echo ===================================================
echo 📥 Pulling Latest Code from GitHub...
echo ===================================================
git pull origin main
echo ===================================================
echo.
echo ===================================================
echo  running Docker Containers...
echo ===================================================

if exist docker-compose.yml (
    docker compose -f docker-compose.yml up
) else (
    :: إذا لم يجد ملف يامل، سيقوم بإيقاف الحاوية مباشرة عن طريق اسمها
    echo  No docker-compose file found. Stopping container %DB_CONTAINER% directly...
    docker stop %DB_CONTAINER%
)

if exist docker-compose.services.yml (
    docker compose -f docker-compose.services.yml up
) else (
    :: إذا لم يجد ملف يامل، سيقوم بإيقاف الحاوية مباشرة عن طريق اسمها
    echo  No docker-compose file found. Stopping container %DB_CONTAINER% directly...
    docker stop %DB_CONTAINER%
)


echo ===================================================
echo 🐳 STEP 1: Searching for PostgreSQL Container...
echo ===================================================
:: البحث التلقائي عن اسم حاوية PostgreSQL التي تحتوي على كلمة postgres
for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr /i "postgres"') do (
    set DB_CONTAINER=%%i
)

if "%DB_CONTAINER%"=="" (
    echo ❌ ERROR: No container found with the name "postgres".
    echo Please make sure your docker containers are running!
    echo.
    pause
    exit /b
)
echo  Found Container Name: %DB_CONTAINER%
echo ===================================================
echo.

echo ===================================================
echo 🔑 STEP 2: Enter Database Credentials
echo ===================================================
:: طلب بيانات قاعدة البيانات يدوياً لضمان الدقة
set /p DB_USER="Enter Database User (e.g. postgres): "
set /p DB_NAME="Enter Database Name: "
set /p DB_PASSWORD="Enter Database Password: "
echo ===================================================
echo.

echo ===================================================
echo 📤 : Importing Database Backup (pg_dump)...
echo ===================================================

docker exec -e PGPASSWORD=%DB_PASSWORD% -i %DB_CONTAINER% psql -U %DB_USER% -d %DB_NAME% < .\db_sync\latest_db.sql 2>.\db_sync\import_error.log

:: التحقق من نجاح عملية الاستيراد
if %ERRORLEVEL% EQU 0 (
    echo  Database Imported Successfully! [OK]
    if exist .\db_sync\import_error.log del .\db_sync\import_error.log
) else (
    echo ❌ IMPORT FAILED!
    type .\db_sync\import_error.log
    pause
    exit /b
)

echo ===================================================
echo.

echo ===================================================
echo 🎉 SUCCESS! Everything is up to date and ready for work!
echo ===================================================
pause