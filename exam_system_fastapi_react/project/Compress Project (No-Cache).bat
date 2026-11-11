@echo off
set "TARGET=%~1"
if "%TARGET%"=="" exit

cd /d "%TARGET%"
"C:\Program Files\7-Zip\7z.exe" a -t7z "%TARGET%.7z" "*" -xr!.pytest_cache -xr!__pycache__ -xr!venv -xr!node_modules