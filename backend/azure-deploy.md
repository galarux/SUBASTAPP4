# 🚀 Despliegue en Azure Web App

## 📋 Variables de Entorno Requeridas

### 🔑 **Obligatorias:**
```env
PORT=8080
NODE_ENV=production
DATABASE_URL=mysql://usuario:password@host:puerto/nombre_db?sslmode=preferred
JWT_SECRET=un-secreto-largo-y-aleatorio-para-produccion
```

### 🌐 **Recomendadas:**
```env
CORS_ORIGIN=https://tu-frontend.vercel.app
RAPIDAPI_KEY=tu_api_key_de_rapidapi
RAPIDAPI_HOST=api-football-v1.p.rapidapi.com
```

### ⚙️ **Opcionales (Azure App Service):**
```env
WEBSOCKETS_ENABLED=true
WEBSITE_NODE_DEFAULT_VERSION=20.x
```

## 🔧 **Configuración en Azure Portal:**

1. **Runtime Stack:** Node.js 20 LTS
2. **Operating System:** Linux
3. **Region:** Cercana a tus usuarios
4. **Plan:** Basic o Standard (para empezar)

## 📁 **Estructura de Despliegue:**

```
backend/
├── dist/           # Código compilado (se genera automáticamente)
├── src/            # Código fuente TypeScript
├── prisma/         # Esquema de base de datos
├── package.json    # Dependencias y scripts
└── tsconfig.json   # Configuración TypeScript (flexible)
```

## 🚀 **Scripts de Build:**

- **`npm run build`** - Build normal (Azure usará este)
- **`npm run build:strict`** - Build con validación estricta
- **`npm run build:check`** - Solo verificar tipos (sin generar archivos)

## ⚠️ **Notas Importantes:**

1. **TypeScript configurado para ser flexible** - evita errores de tipos implícitos
2. **Puerto 8080** - Azure Web Apps usa este puerto por defecto
3. **Base de datos externa** - Asegúrate de que sea accesible desde Azure
4. **CORS configurado** - Para permitir peticiones desde el frontend

## 🔍 **Troubleshooting:**

### Error de Build:
- Verificar que `tsconfig.json` tenga `"strict": false`
- Ejecutar `npm run build:check` localmente antes de hacer push

### Error de Conexión:
- Verificar que `DATABASE_URL` sea correcta
- Asegurar que la base de datos permita conexiones desde Azure

### Error de CORS:
- Verificar que `CORS_ORIGIN` apunte al dominio correcto del frontend
- Asegurar que el frontend esté desplegado y accesible
