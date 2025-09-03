#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Iniciando build alternativo para Azure...');

// Función para ejecutar comandos
function runCommand(command, options = {}) {
  try {
    console.log(`📋 Ejecutando: ${command}`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd: __dirname,
      env: {
        ...process.env,
        // Forzar Vite a usar Rollup en JavaScript puro
        ROLLUP_NATIVE: 'false',
        VITE_ROLLUP_NATIVE: 'false',
        // Configuraciones específicas para Azure
        NPM_CONFIG_LEGACY_PEER_DEPS: 'true',
        NPM_CONFIG_OPTIONAL: 'false',
        NPM_CONFIG_PLATFORM: 'linux',
        NPM_CONFIG_ARCH: 'x64'
      },
      ...options 
    });
    return true;
  } catch (error) {
    console.error(`❌ Error ejecutando: ${command}`);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🔧 Aplicando configuración específica para Azure...');
  
  // Verificar tipos TypeScript primero
  console.log('🔍 Verificando tipos TypeScript...');
  if (!runCommand('npm run build:check')) {
    console.error('❌ Error en la verificación de tipos');
    process.exit(1);
  }
  
  console.log('✅ Verificación de tipos exitosa');
  
  // Intentar build directo con Vite
  console.log('🏗️ Construyendo aplicación con Vite...');
  if (!runCommand('npx vite build --mode production')) {
    console.error('❌ Error en el build con Vite directo');
    process.exit(1);
  }
  
  console.log('🎉 Build completado exitosamente!');
}

// Ejecutar script
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
