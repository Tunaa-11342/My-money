@echo off
cd /d %~dp0
title 💻 Auto Push from Laptop

echo =====================================================
echo 🚀 LOADING.............
echo =====================================================


ping github.com -n 1 >nul 2>&1
if errorlevel 1 (
    echo ❌ Không có kết nối mạng! Kiểm tra WiFi rồi chạy lại nha.
    pause
    exit /b
)


for /f "delims=" %%i in ('git status --porcelain') do set CHANGES=1
if not defined CHANGES (
    echo 🔸 Khong co gi thay doi.
    pause
    exit /b
)

:: Add + Commit + Push
set DATESTR=%date:~6,4%-%date:~3,2%-%date:~0,2%
set TIMESTR=%time:~0,2%:%time:~3,2%
set TIMESTR=%TIMESTR: =0%

echo 💾 Dang add va commit....
git add .
git commit -m "update from laptop - %DATESTR% %TIMESTR%"

echo 📤 Dang push code len GitHub...
git push origin main

if errorlevel 1 (
    echo ❌ Push that bai! Co the bi reflect hoac mat mang.
) else (
    echo ✅ Push thanh cong roi!
)

pause