@echo off
"C:\Program Files\7-Zip\7z.exe" a -t7z project_backup.7z * -xr!.pytest_cache -xr!__pycache__ -xr!venv -xr!node_modules
pause