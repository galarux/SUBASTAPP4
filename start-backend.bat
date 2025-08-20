@echo off
echo ========================================
echo    INICIANDO BACKEND SUBASTA APP
echo ========================================

REM Verificar si ya hay un proceso corriendo en el puerto 3001
netstat -ano | findstr ":3001" >nul
if %errorlevel% equ 0 (
    echo [ERROR] Puerto 3001 ya está en uso
    echo Deteniendo procesos anteriores...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 2 >nul
)

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

echo [INFO] Instalando dependencias si es necesario...
call npm install

echo [INFO] Iniciando servidor backend...
echo [INFO] Puerto: 3001
echo [INFO] Presiona Ctrl+C para detener el servidor
echo.

call npm run dev

pause
