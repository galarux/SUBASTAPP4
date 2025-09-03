# 🌐 Configuración Automática de Variables de Entorno para Azure

## ✅ **¡Variables Configuradas Automáticamente!**

He añadido código que configura automáticamente todas las variables de entorno necesarias para Azure. **No necesitas configurarlas manualmente**.

## 🔧 **Variables Configuradas Automáticamente:**

### **Frontend (`frontend/src/config/azure-config.ts`):**
```typescript
// Se ejecuta automáticamente al cargar la página
NPM_CONFIG_LEGACY_PEER_DEPS=true
NPM_CONFIG_OPTIONAL=false
NPM_CONFIG_PLATFORM=linux
NPM_CONFIG_ARCH=x64
VITE_LEGACY_PEER_DEPS=true
```

### **Backend (`backend/src/config/azure-config.ts`):**
```typescript
// Se ejecuta automáticamente al iniciar el servidor
NPM_CONFIG_LEGACY_PEER_DEPS=true
NPM_CONFIG_OPTIONAL=false
NPM_CONFIG_PLATFORM=linux
NPM_CONFIG_ARCH=x64
WEBSOCKETS_ENABLED=true
WEBSITE_NODE_DEFAULT_VERSION=20.x
```

## 🚀 **Cómo Funciona:**

1. **Frontend**: Se ejecuta automáticamente cuando se carga la página
2. **Backend**: Se ejecuta automáticamente cuando se inicia el servidor
3. **Configuración**: Se aplica solo si las variables no están ya definidas

## 📋 **Variables que SÍ necesitas configurar en Azure:**

### **Obligatorias:**
```env
PORT=8080
NODE_ENV=production
DATABASE_URL=mysql://usuario:password@host:puerto/nombre_db?sslmode=preferred
JWT_SECRET=tu_secreto_jwt
```

### **Recomendadas:**
```env
CORS_ORIGIN=https://tu-frontend.vercel.app
RAPIDAPI_KEY=tu_api_key
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com
```

## 🎯 **Ventajas de esta Configuración:**

- ✅ **Automática**: No necesitas recordar configurar variables técnicas
- ✅ **Inteligente**: Solo se aplica si no están ya definidas
- ✅ **Completa**: Cubre todos los problemas comunes de Azure
- ✅ **Transparente**: Funciona sin que te des cuenta

## 🔍 **Verificación:**

Puedes ver en la consola del navegador y en los logs del servidor:
```
🔧 Configuración de Azure aplicada: { ... }
🌐 Configuración de Azure guardada en localStorage
```

## 💡 **¿Qué hace cada variable?**

- **`NPM_CONFIG_LEGACY_PEER_DEPS=true`**: Evita conflictos de dependencias
- **`NPM_CONFIG_OPTIONAL=false`**: Fuerza instalación de dependencias opcionales
- **`NPM_CONFIG_PLATFORM=linux`**: Especifica plataforma Linux para Azure
- **`NPM_CONFIG_ARCH=x64`**: Especifica arquitectura x64
- **`WEBSOCKETS_ENABLED=true`**: Habilita WebSockets en Azure
- **`WEBSITE_NODE_DEFAULT_VERSION=20.x`**: Usa Node.js 20 LTS

---

**🎉 ¡Listo! Tu aplicación se configurará automáticamente para Azure.**
