@echo off
echo ========================================
echo    INICIANDO FRONTEND SUBASTA APP
echo ========================================

REM Verificar si ya hay un proceso corriendo en el puerto 5173
netstat -ano | findstr ":5173" >nul
if %errorlevel% equ 0 (
    echo [ERROR] Puerto 5173 ya está en uso
    echo Deteniendo procesos anteriores...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 2 >nul
)

REM Verificar si existe el directorio frontend
if not exist "frontend" (
    echo [ERROR] No se encuentra el directorio frontend
    pause
    exit /b 1
)

REM Cambiar al directorio frontend
cd frontend

REM Verificar si existe package.json
if not exist "package.json" (
    echo [ERROR] No se encuentra package.json en el directorio frontend
    pause
    exit /b 1
)

echo [INFO] Instalando dependencias si es necesario...
call npm install

echo [INFO] Iniciando servidor frontend...
echo [INFO] Puerto: 5173
echo [INFO] Presiona Ctrl+C para detener el servidor
echo.

call npm run dev

pause
