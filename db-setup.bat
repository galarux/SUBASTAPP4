@echo off
echo ========================================
echo    CONFIGURANDO BASE DE DATOS
echo ========================================

REM Verificar si existe el directorio backend
if not exist "backend" (
    echo [ERROR] No se encuentra el directorio backend
    pause
    exit /b 1
)

REM Cambiar al directorio backend
cd backend

echo [INFO] Generando cliente de Prisma...
call npm run db:generate

echo.
echo [INFO] Sincronizando esquema con la base de datos...
call npm run db:push

echo.
echo [INFO] Insertando datos de prueba...
call npm run db:seed

echo.
echo [INFO] Configuración de base de datos completada
echo [INFO] Para abrir Prisma Studio ejecuta: db-studio.bat
echo.

pause
