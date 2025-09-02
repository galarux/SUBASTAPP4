# Script para detectar y actualizar automáticamente la IP local en SUBASTAPP
param(
    [switch]$Force,
    [string]$CustomIP
)

Write-Host "🔍 Detectando IP local para SUBASTAPP..." -ForegroundColor Cyan
Write-Host ""

# Función para obtener la IP local
function Get-LocalIP {
    try {
        # Obtener todas las interfaces de red
        $interfaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
            $_.IPAddress -notmatch '^127\.|^169\.254\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.'
        }
        
        # Priorizar Wi-Fi sobre Ethernet
        $wifiInterface = $interfaces | Where-Object { 
            $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Wireless*" 
        } | Select-Object -First 1
        
        if ($wifiInterface) {
            return $wifiInterface.IPAddress
        } else {
            # Si no hay Wi-Fi, usar la primera interfaz disponible
            return ($interfaces | Select-Object -First 1).IPAddress
        }
    }
    catch {
        Write-Warning "Error al detectar IP: $($_.Exception.Message)"
        return $null
    }
}

# Función para actualizar archivos
function Update-Files {
    param([string]$IP)
    
    Write-Host "🔧 Actualizando archivos con IP: $IP" -ForegroundColor Yellow
    
    $files = @(
        "backend\src\server.ts",
        "frontend\src\config\config.ts"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            try {
                $content = Get-Content $file -Raw
                $updatedContent = $content -replace '192\.168\.\d+\.\d+', $IP
                
                if ($content -ne $updatedContent) {
                    Set-Content $file $updatedContent -NoNewline
                    Write-Host "✅ $file actualizado" -ForegroundColor Green
                } else {
                    Write-Host "ℹ️  $file ya está actualizado" -ForegroundColor Blue
                }
            }
            catch {
                Write-Error "❌ Error al actualizar $file : $($_.Exception.Message)"
            }
        } else {
            Write-Warning "⚠️  Archivo no encontrado: $file"
        }
    }
}

# Función para mostrar estado actual
function Show-CurrentStatus {
    Write-Host "📊 Estado actual de la configuración:" -ForegroundColor Magenta
    
    $configFile = "frontend\src\config\config.ts"
    if (Test-Path $configFile) {
        $content = Get-Content $configFile
        $ipLine = $content | Where-Object { $_ -match 'API_BASE_URL.*192\.168\.' }
        if ($ipLine) {
            Write-Host "📍 IP configurada: $($ipLine.Trim())" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
}

# Función principal
function Main {
    Show-CurrentStatus
    
    if ($CustomIP) {
        $detectedIP = $CustomIP
        Write-Host "🎯 Usando IP personalizada: $detectedIP" -ForegroundColor Green
    } else {
        $detectedIP = Get-LocalIP
        
        if (-not $detectedIP) {
            Write-Error "❌ No se pudo detectar la IP local"
            exit 1
        }
        
        Write-Host "📱 IP detectada: $detectedIP" -ForegroundColor Green
    }
    
    Write-Host ""
    
    if ($Force) {
        Update-Files $detectedIP
    } else {
        $response = Read-Host "¿Deseas actualizar la configuración con la IP $detectedIP? (s/N)"
        if ($response -eq 's' -or $response -eq 'S' -or $response -eq 'y' -or $response -eq 'Y') {
            Update-Files $detectedIP
        } else {
            Write-Host "❌ Operación cancelada" -ForegroundColor Red
            return
        }
    }
    
    Write-Host ""
    Write-Host "🎯 Configuración actualizada exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
    Write-Host "   1. Detén la aplicación si está corriendo (.\stop-all.bat)"
    Write-Host "   2. Inicia la aplicación (.\start-all.bat)"
    Write-Host "   3. La aplicación debería funcionar en: http://$detectedIP`:5173"
    Write-Host ""
}

# Ejecutar script
Main
