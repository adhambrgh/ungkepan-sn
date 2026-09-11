@echo off
title Ungkepan SN - Running...
echo ==========================================
echo   Ungkepan SN - Starting Backend + Frontend
echo ==========================================
echo.
echo Backend  : http://127.0.0.1:8000
echo Frontend : http://localhost:5173
echo.
echo Ctrl+C untuk stop semua.
echo ==========================================
echo.
npx concurrently -n back,front -c blue,green "cd ungkepan-sn-backend && php artisan serve" "cd ungkepan-sn-frontend && npm run dev"
pause
