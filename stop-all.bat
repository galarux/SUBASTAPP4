@echo off
echo ========================================
echo    DETENIENDO TODOS LOS PROCESOS
echo ========================================

echo [INFO] Buscando procesos de Node.js...
tasklist | findstr "node.exe" >nul
if %errorlevel% equ 0 (
    echo [INFO] Procesos de Node.js encontrados:
    tasklist | findstr "node.exe"
    echo.
    echo [INFO] Deteniendo todos los procesos de Node.js...
    taskkill /f /im node.exe
    echo [SUCCESS] Todos los procesos de Node.js han sido detenidos
) else (
    echo [INFO] No se encontraron procesos de Node.js ejecutándose
)

echo.
echo [INFO] Verificando puertos...
netstat -ano | findstr ":3001\|:5173" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Aún hay procesos usando los puertos:
    netstat -ano | findstr ":3001\|:5173"
) else (
    echo [SUCCESS] Los puertos 3001 y 5173 están libres
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
