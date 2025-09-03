#!/bin/bash

# Script de build específico para Azure
echo "🚀 Iniciando build para Azure..."

# Limpiar instalación anterior si existe
if [ -d "node_modules" ]; then
    echo "🧹 Limpiando node_modules..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "🧹 Limpiando package-lock.json..."
    rm -f package-lock.json
fi

# Forzar instalación para Linux x64
echo "📦 Instalando dependencias para Linux x64..."
npm install --platform=linux --arch=x64 --legacy-peer-deps

# Verificar tipos TypeScript
echo "🔍 Verificando tipos TypeScript..."
npm run build:check

if [ $? -eq 0 ]; then
    echo "✅ Verificación de tipos exitosa"
    
    # Build de producción
    echo "🏗️ Construyendo aplicación..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "🎉 Build completado exitosamente!"
    else
        echo "❌ Error en el build"
        exit 1
    fi
else
    echo "❌ Error en la verificación de tipos"
    exit 1
fi
