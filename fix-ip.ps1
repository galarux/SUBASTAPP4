# Script simple para actualizar IP en SUBASTAPP
Write-Host "Detectando IP local..." -ForegroundColor Cyan

# Obtener IP del adaptador Wi-Fi
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -like "*Wi-Fi*" -and $_.IPAddress -notmatch '^127\.'
}).IPAddress | Select-Object -First 1

if (-not $ip) {
    Write-Host "No se pudo detectar IP Wi-Fi, usando IP por defecto" -ForegroundColor Yellow
    $ip = "192.168.1.20"
}

Write-Host "IP detectada: $ip" -ForegroundColor Green

# Actualizar archivos
$files = @(
    "backend\src\server.ts",
    "frontend\src\config\config.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw
            $updatedContent = $content -replace '192\.168\.\d+\.\d+', $ip
            
            if ($content -ne $updatedContent) {
                Set-Content $file $updatedContent -NoNewline
                Write-Host "Archivo $file actualizado" -ForegroundColor Green
            } else {
                Write-Host "Archivo $file ya actualizado" -ForegroundColor Blue
            }
        }
        catch {
            Write-Host "Error al actualizar $file" -ForegroundColor Red
        }
    }
}

Write-Host "Configuracion actualizada con IP: $ip" -ForegroundColor Green
Write-Host "Ejecuta .\start-all.bat para iniciar la aplicacion" -ForegroundColor Yellow
