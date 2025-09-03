#!/usr/bin/env node

/**
 * Script de inicio para Azure Web App
 * Configura el entorno y ejecuta el servidor
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando aplicación en Azure Web App...');

// Configurar variables de entorno para Azure
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '8080';

console.log('📋 Variables de entorno configuradas:');
console.log('📍 NODE_ENV:', process.env.NODE_ENV);
console.log('📍 PORT:', process.env.PORT);

// Verificar estructura del proyecto
const frontendPath = path.join(__dirname, '../frontend');
const frontendDistPath = path.join(__dirname, '../frontend/dist');

console.log('📁 Verificando estructura del proyecto...');
console.log('📍 Frontend path:', frontendPath);
console.log('📍 Frontend dist path:', frontendDistPath);

// Verificar si existe el frontend
if (require('fs').existsSync(frontendPath)) {
  console.log('✅ Frontend encontrado');
  
  if (require('fs').existsSync(frontendDistPath)) {
    console.log('✅ Frontend dist encontrado');
  } else {
    console.log('⚠️  Frontend dist no encontrado');
  }
} else {
  console.log('⚠️  Frontend no encontrado');
}

// Ejecutar el servidor principal
console.log('🚀 Ejecutando servidor principal...');
const server = spawn('node', ['dist/server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Error al ejecutar el servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`📤 Servidor terminado con código: ${code}`);
  process.exit(code);
});

// Manejo de señales para apagado limpio
process.on('SIGINT', () => {
  console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.kill('SIGTERM');
});
