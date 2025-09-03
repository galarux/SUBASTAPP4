# Despliegue Unificado en Azure Web App

## 🎯 Estrategia de Despliegue

Este proyecto ahora utiliza un **despliegue unificado** en Azure Web App, donde tanto el frontend como el backend se despliegan juntos en la misma aplicación web.

### ✅ Ventajas del Despliegue Unificado

- **Una sola URL** para toda la aplicación
- **Despliegue más rápido** (un solo push)
- **Configuración simplificada** en Azure
- **Funciona exactamente como en local**

## 🏗️ Arquitectura del Despliegue

```
Azure Web App
├── Backend (Node.js + Express)
│   ├── API en /api/*
│   ├── Servidor de archivos estáticos
│   └── Ruta catch-all para SPA
└── Frontend (React + Vite)
    ├── Archivos estáticos en /frontend/dist
    └── SPA routing
```

## 🚀 Flujo de Despliegue

### 1. GitHub Actions Workflow

El workflow `main_subastapp.yml` ahora:

1. **Construye el frontend** con Vite
2. **Construye el backend** con TypeScript
3. **Crea un paquete unificado** (ZIP)
4. **Despliega todo** a Azure Web App

### 2. Estructura del Paquete Desplegado

```
deploy-package/
├── dist/                    # Backend compilado
├── prisma/                  # Esquemas de base de datos
├── frontend/                # Frontend construido
│   └── dist/               # Archivos estáticos del frontend
├── package.json             # Dependencias del backend
├── package-lock.json        # Lock file del backend
├── azure-post-install.js    # Script de post-install
├── azure-startup.js         # Script de inicio
└── web.config               # Configuración de IIS
```

## 📁 Archivos de Configuración de Azure

### `.azureignore`
- **NO excluye** el frontend
- Solo excluye archivos de desarrollo y temporales
- Permite que todo el proyecto se incluya en el despliegue

### `web.config`
- Configura IIS para Node.js
- Maneja rutas de archivos estáticos
- Configura reescritura de URLs para SPA

### Scripts de Azure
- `azure-post-install.js`: Se ejecuta después de `npm install`
- `azure-startup.js`: Script de inicio personalizado

## 🔧 Configuración del Backend

El servidor Express está configurado para:

1. **Servir la API** en `/api/*`
2. **Servir archivos estáticos** del frontend desde `../frontend/dist`
3. **Manejar SPA routing** con ruta catch-all

```typescript
// Rutas de la API (PRIMERO)
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
// ... otras rutas

// Servir frontend (DESPUÉS)
app.use(express.static(frontendPath));

// Ruta catch-all para SPA (AL FINAL)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
```

## 🌐 URLs de Acceso

- **Frontend**: `https://tu-app.azurewebsites.net/`
- **API**: `https://tu-app.azurewebsites.net/api/*`
- **Socket.IO**: `https://tu-app.azurewebsites.net/` (WebSocket)

## 🚀 Comandos de Despliegue

### Despliegue Automático
```bash
git push origin main
```
El workflow de GitHub Actions se ejecuta automáticamente.

### Despliegue Manual
1. Ve a GitHub → Actions
2. Selecciona el workflow `main_subastapp.yml`
3. Haz clic en "Run workflow"

## 🔍 Verificación del Despliegue

### Logs de Azure
- Revisa los logs en Azure Portal
- El script `azure-post-install.js` muestra información de la estructura
- El script `azure-startup.js` configura el entorno

### Verificación de Funcionamiento
1. **Frontend**: Accede a la URL principal
2. **API**: Prueba `/api/auth` o cualquier endpoint
3. **Socket.IO**: Verifica la conexión WebSocket

## 🐛 Solución de Problemas

### Frontend no se muestra
- Verifica que `frontend/dist` existe en el paquete
- Revisa los logs de `azure-post-install.js`
- Confirma que `web.config` está configurado correctamente

### API no responde
- Verifica que el backend se compiló correctamente
- Revisa los logs del servidor en Azure
- Confirma que las variables de entorno están configuradas

### Errores de build
- Verifica que todas las dependencias están en `package.json`
- Confirma que el script `build:azure` del frontend funciona
- Revisa los logs del workflow de GitHub Actions

## 📚 Recursos Adicionales

- [Azure Web Apps Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Node.js en Azure](https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs)
- [GitHub Actions para Azure](https://github.com/Azure/actions)
