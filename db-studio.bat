@echo off
echo ========================================
echo    ABRIENDO PRISMA STUDIO
echo ========================================

REM Verificar si existe el directorio backend
if not exist "backend" (
    echo [ERROR] No se encuentra el directorio backend
    pause
    exit /b 1
)

REM Cambiar al directorio backend
cd backend

echo [INFO] Abriendo Prisma Studio...
echo [INFO] URL: http://localhost:5555
echo [INFO] Presiona Ctrl+C para cerrar Prisma Studio
echo.

call npm run db:studio

pause
