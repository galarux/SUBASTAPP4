# 🔧 Solución de Problemas de IP en SUBASTAPP

## 🚨 Problema Común
La aplicación no funciona en local porque la IP privada ha cambiado (Wi-Fi, cambio de red, etc.).

## ✅ Solución Rápida

### Opción 1: Script Automático (Recomendado)
```bash
# Ejecutar el script que detecta automáticamente tu IP
powershell -ExecutionPolicy Bypass -File fix-ip.ps1
```

### Opción 2: Actualización Manual
1. **Detectar tu IP actual:**
   ```bash
   ipconfig
   ```
   Busca la línea "Dirección IPv4" en tu adaptador Wi-Fi

2. **Actualizar archivos manualmente:**
   - `backend/src/server.ts` (líneas 26, 35, 82)
   - `frontend/src/config/config.ts` (líneas 3, 4, 30)

3. **Reemplazar todas las ocurrencias de:**
   - `192.168.18.124` → Tu IP actual
   - `192.168.1.20` → Tu IP actual

## 🔍 Archivos que Contienen IPs

### Backend
- `backend/src/server.ts` - Configuración CORS y Socket.IO

### Frontend
- `frontend/src/config/config.ts` - URLs de API y Socket
- `frontend/src/services/api.ts` - Importa desde config
- `frontend/src/services/plantillasService.ts` - Importa desde config
- `frontend/src/hooks/useSocket.ts` - Importa desde config

## 🚀 Después de Actualizar

1. **Detener la aplicación:**
   ```bash
   .\stop-all.bat
   ```

2. **Iniciar la aplicación:**
   ```bash
   .\start-all.bat
   ```

3. **Verificar funcionamiento:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001
   - Desde otros dispositivos: http://TU_IP:5173

## 🛠️ Scripts Disponibles

- **`fix-ip.ps1`** - Script PowerShell simple y funcional
- **`update-ip.bat`** - Script batch alternativo
- **`update-ip.ps1`** - Script PowerShell avanzado (con errores de sintaxis)

## 💡 Prevención

- **Usar configuración centralizada** en `frontend/src/config/config.ts`
- **Ejecutar `fix-ip.ps1`** cada vez que cambies de red
- **Verificar IP** antes de iniciar la aplicación

## 🔧 Comandos Útiles

```bash
# Ver IP actual
ipconfig | findstr "Dirección IPv4"

# Verificar que no queden IPs antiguas
findstr /s "192.168.18.124" *.*

# Verificar configuración actual
findstr /s "192.168.1.20" *.*
```

## 📱 URLs de Acceso

- **Local (mismo dispositivo):** http://localhost:5173
- **Red local (otros dispositivos):** http://TU_IP:5173
- **Backend API:** http://TU_IP:3001
- **Socket.IO:** http://TU_IP:3001

## 🚨 Si Nada Funciona

1. Verificar que el firewall no bloquee los puertos 3001 y 5173
2. Verificar que la base de datos MySQL esté funcionando
3. Revisar logs del backend en la consola
4. Ejecutar `.\reset-auction.bat` para reiniciar todo
