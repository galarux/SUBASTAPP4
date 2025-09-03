#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build manual para Azure...');

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

// Función para copiar directorio recursivamente
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
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
  
  // Compilar TypeScript a JavaScript
  console.log('🔨 Compilando TypeScript...');
  if (!runCommand('npx tsc --outDir dist-temp')) {
    console.error('❌ Error en la compilación de TypeScript');
    process.exit(1);
  }
  
  console.log('✅ TypeScript compilado exitosamente');
  
  // Crear directorio dist si no existe
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    console.log('🧹 Limpiando directorio dist...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  
  // Copiar archivos compilados
  console.log('📁 Copiando archivos compilados...');
  const tempDir = path.join(__dirname, 'dist-temp');
  if (fs.existsSync(tempDir)) {
    copyDir(tempDir, distDir);
    console.log('✅ Archivos copiados exitosamente');
  }
  
  // Copiar archivos estáticos
  console.log('📁 Copiando archivos estáticos...');
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    copyDir(publicDir, distDir);
    console.log('✅ Archivos estáticos copiados');
  }
  
  // Copiar index.html
  const indexHtml = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, path.join(distDir, 'index.html'));
    console.log('✅ index.html copiado');
  }
  
  // Limpiar directorio temporal
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('🧹 Directorio temporal limpiado');
  }
  
  console.log('🎉 Build manual completado exitosamente!');
  console.log(`📁 Aplicación construida en: ${distDir}`);
}

// Ejecutar script
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
