@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo 🐳 STEP 1: Searching for PostgreSQL Container...
echo ===================================================
for /f "tokens=*" %%i in ('docker ps --format "{{.Names}}" ^| findstr /i "postgres"') do (
    set DB_CONTAINER=%%i
)

if "%DB_CONTAINER%"=="" (
    echo ❌ ERROR: No container found with the name "postgres".
    pause
    exit /b
)
echo  Found Container Name: %DB_CONTAINER%
echo ===================================================
echo.

echo ===================================================
echo 🔑 STEP 2: Enter Database Credentials
echo ===================================================
set /p DB_USER="Enter Database User: "
set /p DB_NAME="Enter Database Name: "
set /p DB_PASSWORD="Enter Database Password: "
echo ===================================================
echo.

echo ===================================================
echo 📤 STEP 3: Exporting Database Backup (pg_dump)...
echo ===================================================
if not exist .\db_sync mkdir .\db_sync

docker exec -e PGPASSWORD=%DB_PASSWORD% -i %DB_CONTAINER% pg_dump -U %DB_USER% -d %DB_NAME% -F p > .\db_sync\latest_db.sql 2>.\db_sync\export_error.log

if %ERRORLEVEL% EQU 0 (
    echo  Backup Exported Successfully! [OK]
    if exist .\db_sync\export_error.log del .\db_sync\export_error.log
) else (
    echo ❌ EXPORT FAILED!
    type .\db_sync\export_error.log
    pause
    exit /b
)
echo ===================================================
echo.

echo ===================================================
echo 🛑 STEP 4: Stopping Docker Containers...
echo ===================================================
docker compose down
echo  Docker containers stopped.
echo ===================================================
echo.

echo ===================================================
echo 🚀 STEP 5: Pushing Code and Database to GitHub...
echo ===================================================
:: إضافة كل الملفات الجديدة والتعديلات بما فيها قاعدة البيانات
git add .

:: توليد رسالة مخصصة بالتاريخ والوقت الحالي تلقائياً
set "commit_msg=Automatic backup and sync - %DATE% %TIME%"

:: تنفيذ الـ Commit والـ Push بدون تدخل منك
git commit -m "%commit_msg%"
git push origin main

echo.
echo ===================================================
echo 🏁 ALL DONE! Work saved, DB exported, and pushed to GitHub.
echo ===================================================
pause