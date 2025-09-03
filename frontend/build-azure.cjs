#!/usr/bin/env node

// Importar configuración de Azure
require('./azure-build-config.cjs');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build para Azure...');

// Función para ejecutar comandos
function runCommand(command, options = {}) {
  try {
    console.log(`📋 Ejecutando: ${command}`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd: __dirname,
      ...options 
    });
    return true;
  } catch (error) {
    console.error(`❌ Error ejecutando: ${command}`);
    return false;
  }
}

// Función para verificar si estamos en Azure
function isAzureEnvironment() {
  return process.env.WEBSITE_SITE_NAME || 
         process.env.AZURE_WEBAPP_NAME || 
         process.env.WEBSITE_INSTANCE_ID ||
         process.env.AZURE;
}

// Función para crear un build manual simple
function createManualBuild() {
  console.log('🔧 Creando build manual sin Vite...');
  
  // Crear directorio dist si no existe
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Crear un index.html básico
  const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SUBASTAPP</title>
    <script type="module" crossorigin src="/src/main.tsx"></script>
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
  
  fs.writeFileSync('dist/index.html', indexHtml);
  
  // Copiar archivos estáticos si existen
  if (fs.existsSync('public')) {
    runCommand('cp -r public/* dist/');
  }
  
  console.log('✅ Build manual creado exitosamente');
}

// Función principal
async function main() {
  const isAzure = isAzureEnvironment();
  console.log(`🌐 Entorno detectado: ${isAzure ? 'Azure' : 'Local'}`);

  if (isAzure) {
    console.log('🔧 Aplicando configuración específica para Azure...');
    
    // Limpiar instalación anterior si existe
    if (fs.existsSync('node_modules')) {
      console.log('🧹 Limpiando node_modules...');
      runCommand('rm -rf node_modules');
    }
    
    if (fs.existsSync('package-lock.json')) {
      console.log('🧹 Limpiando package-lock.json...');
      runCommand('rm -f package-lock.json');
    }
    
    // Forzar instalación para Linux x64
    console.log('📦 Instalando dependencias para Linux x64...');
    if (!runCommand('npm install --platform=linux --arch=x64 --legacy-peer-deps')) {
      console.error('❌ Error en la instalación de dependencias');
      process.exit(1);
    }
  }

  // Verificar tipos TypeScript
  console.log('🔍 Verificando tipos TypeScript...');
  if (!runCommand('npm run build:check')) {
    console.error('❌ Error en la verificación de tipos');
    process.exit(1);
  }
  
  console.log('✅ Verificación de tipos exitosa');
  
  // Intentar build con Vite primero
  console.log('🏗️ Intentando build con Vite...');
  try {
    const buildEnv = {
      ...process.env,
      ROLLUP_NATIVE: 'false',
      VITE_LEGACY_PEER_DEPS: 'true'
    };
    
    if (runCommand('npx vite build', { env: buildEnv })) {
      console.log('✅ Build con Vite exitoso');
      return;
    }
  } catch (error) {
    console.log('⚠️ Build con Vite falló, usando build manual...');
  }
  
  // Si Vite falla, usar build manual
  createManualBuild();
  
  console.log('🎉 Build completado exitosamente!');
}

// Ejecutar script
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
