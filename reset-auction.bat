@echo off
echo ========================================
echo    REINICIANDO SUBASTA APP
echo ========================================

REM Verificar si existe el directorio backend
if not exist "backend" (
    echo [ERROR] No se encuentra el directorio backend
    pause
    exit /b 1
)

REM Cambiar al directorio backend
cd backend

REM Verificar si existe package.json
if not exist "package.json" (
    echo [ERROR] No se encuentra package.json en el directorio backend
    pause
    exit /b 1
)

echo [INFO] Reiniciando subasta y cerrando todas las sesiones...
echo [INFO] Los usuarios conectados recibirán una notificación de reinicio
echo.

call npx ts-node src/scripts/resetAuction.ts

echo.
echo [INFO] Reinicio completado!
echo [INFO] Los usuarios deberán recargar la página para continuar
echo.

pause
