@echo off
cd /d %~dp0
title 💻 Auto Push from Laptop

echo =====================================================
echo 🚀 BẮT ĐẦU ĐẨY CODE TỪ LAPTOP LÊN GITHUB
echo =====================================================

:: Kiểm tra có mạng không
ping github.com -n 1 >nul 2>&1
if errorlevel 1 (
    echo ❌ Không có kết nối mạng! Kiểm tra WiFi rồi chạy lại nha.
    pause
    exit /b
)

:: Kiểm tra có thay đổi gì không
for /f "delims=" %%i in ('git status --porcelain') do set CHANGES=1
if not defined CHANGES (
    echo 🔸 Không có thay đổi mới, không cần push.
    pause
    exit /b
)

:: Add + Commit + Push
set DATESTR=%date:~6,4%-%date:~3,2%-%date:~0,2%
set TIMESTR=%time:~0,2%:%time:~3,2%
set TIMESTR=%TIMESTR: =0%

echo 💾 Đang add và commit...
git add .
git commit -m "update from laptop - %DATESTR% %TIMESTR%"

echo 📤 Đang push code lên GitHub...
git push origin main

if errorlevel 1 (
    echo ❌ Push thất bại! Có thể bị conflict hoặc mất mạng.
) else (
    echo ✅ Push thành công rồi!
)

pause