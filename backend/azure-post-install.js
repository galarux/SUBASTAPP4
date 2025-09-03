#!/usr/bin/env node

/**
 * Script de post-install para Azure Web App
 * Se ejecuta automáticamente después de npm install
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Ejecutando script de post-install para Azure...');

// Verificar estructura del proyecto
const frontendPath = path.join(__dirname, '../frontend');
const frontendDistPath = path.join(__dirname, '../frontend/dist');

console.log('📁 Verificando estructura del proyecto...');
console.log('📍 Directorio actual:', __dirname);
console.log('📍 Frontend path:', frontendPath);
console.log('📍 Frontend dist path:', frontendDistPath);

// Verificar si existe el frontend
if (fs.existsSync(frontendPath)) {
  console.log('✅ Frontend encontrado');
  
  if (fs.existsSync(frontendDistPath)) {
    console.log('✅ Frontend dist encontrado');
    
    // Listar archivos del frontend
    const files = fs.readdirSync(frontendDistPath);
    console.log('📋 Archivos del frontend:', files);
  } else {
    console.log('⚠️  Frontend dist no encontrado');
  }
} else {
  console.log('⚠️  Frontend no encontrado');
}

// Verificar archivos del backend
const backendFiles = fs.readdirSync(__dirname);
console.log('📋 Archivos del backend:', backendFiles);

// Verificar si existe package.json
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('✅ package.json encontrado');
} else {
  console.log('❌ package.json no encontrado');
}

console.log('✅ Script de post-install completado');
