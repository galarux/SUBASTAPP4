@echo off
echo ========================================
echo    INICIANDO SUBASTA APP COMPLETA
echo ========================================

REM Verificar si ya hay procesos corriendo en los puertos
netstat -ano | findstr ":3001\|:5173" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Detectados puertos en uso
    echo Deteniendo procesos anteriores...
    taskkill /f /im node.exe >nul 2>&1
    timeout /t 3 >nul
)

REM Verificar si existe package.json en el directorio raíz
if not exist "package.json" (
    echo [ERROR] No se encuentra package.json en el directorio raíz
    pause
    exit /b 1
)

echo [INFO] Instalando dependencias si es necesario...
call npm install

echo [INFO] Iniciando backend y frontend...
echo [INFO] Backend: Puerto 3001
echo [INFO] Frontend: Puerto 5173
echo [INFO] Presiona Ctrl+C para detener todos los servidores
echo.

call npm run dev

pause
