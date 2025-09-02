@echo off
echo 🔍 Detectando IP local...
echo.

REM Obtener la IP local del adaptador Wi-Fi
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "Dirección IPv4"') do (
    set "IP=%%i"
    goto :found_ip
)

:found_ip
REM Limpiar espacios en blanco
set "IP=%IP: =%"
echo 📱 IP detectada: %IP%
echo.

REM Actualizar archivos de configuración
echo 🔧 Actualizando configuración...
echo.

REM Actualizar backend/server.ts
powershell -Command "(Get-Content 'backend\src\server.ts') -replace '192\.168\.1\.20', '%IP%' | Set-Content 'backend\src\server.ts'"
echo ✅ backend\src\server.ts actualizado

REM Actualizar frontend/config/config.ts
powershell -Command "(Get-Content 'frontend\src\config\config.ts') -replace '192\.168\.1\.20', '%IP%' | Set-Content 'frontend\src\config\config.ts'"
echo ✅ frontend\src\config\config.ts actualizado

echo.
echo 🎯 Configuración actualizada con IP: %IP%
echo.
echo 📋 Para aplicar los cambios:
echo    1. Detén la aplicación si está corriendo
echo    2. Ejecuta: .\start-all.bat
echo.
pause
