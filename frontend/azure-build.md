# 🚀 Build del Frontend en Azure

## 🚨 Problema Común

El frontend puede fallar en Azure debido a problemas con dependencias nativas de Rollup/Vite, especialmente en entornos Linux.

## ✅ Soluciones Implementadas

### 1. **Configuración de package.json**
```json
"overrides": {
  "rollup": {
    "optionalDependencies": {
      "@rollup/rollup-linux-x64-gnu": "4.9.5"
    }
  }
}
```

### 2. **Archivo .npmrc**
```ini
legacy-peer-deps=true
optional=false
platform=linux
arch=x64
```

### 3. **Scripts de Build**
```json
"build": "tsc -b && vite build",
"build:azure": "tsc -b && VITE_LEGACY_PEER_DEPS=true vite build",
"build:check": "tsc -b --noEmit"
```

## 🔧 **Configuración en Azure**

### Variables de Entorno Recomendadas:
```env
NPM_CONFIG_LEGACY_PEER_DEPS=true
NPM_CONFIG_OPTIONAL=false
NPM_CONFIG_PLATFORM=linux
NPM_CONFIG_ARCH=x64
```

### Script de Build Personalizado:
Si el build automático falla, puedes usar:
```bash
npm run build:azure
```

## 🚀 **Flujo de Build Recomendado**

1. **Instalación limpia:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Verificación de tipos:**
   ```bash
   npm run build:check
   ```

3. **Build de producción:**
   ```bash
   npm run build:azure
   ```

## 🔍 **Troubleshooting**

### Error de Rollup:
- Verificar que `.npmrc` esté presente
- Usar `npm run build:azure` en lugar de `npm run build`
- Limpiar `node_modules` y reinstalar

### Error de TypeScript:
- Ejecutar `npm run build:check` primero
- Verificar que `tsconfig.app.json` tenga `"strict": false`

### Error de Dependencias:
- Usar `legacy-peer-deps=true`
- Forzar plataforma Linux con `.npmrc`
