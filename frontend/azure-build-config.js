// Configuración específica para Azure antes del build
console.log('🔧 Configurando entorno para Azure...');

// Establecer variables de entorno para npm
process.env.NPM_CONFIG_LEGACY_PEER_DEPS = 'true';
process.env.NPM_CONFIG_OPTIONAL = 'false';
process.env.NPM_CONFIG_PLATFORM = 'linux';
process.env.NPM_CONFIG_ARCH = 'x64';

// Variables para Vite
process.env.VITE_LEGACY_PEER_DEPS = 'true';

// Variables específicas de Azure
process.env.WEBSOCKETS_ENABLED = 'true';
process.env.WEBSITE_NODE_DEFAULT_VERSION = '20.x';

console.log('✅ Variables de entorno configuradas para Azure:', {
  NPM_CONFIG_LEGACY_PEER_DEPS: process.env.NPM_CONFIG_LEGACY_PEER_DEPS,
  NPM_CONFIG_OPTIONAL: process.env.NPM_CONFIG_OPTIONAL,
  NPM_CONFIG_PLATFORM: process.env.NPM_CONFIG_PLATFORM,
  NPM_CONFIG_ARCH: process.env.NPM_CONFIG_ARCH,
  VITE_LEGACY_PEER_DEPS: process.env.VITE_LEGACY_PEER_DEPS,
  WEBSOCKETS_ENABLED: process.env.WEBSOCKETS_ENABLED,
  WEBSITE_NODE_DEFAULT_VERSION: process.env.WEBSITE_NODE_DEFAULT_VERSION
});

// Verificar si estamos en Azure
const isAzure = process.env.WEBSITE_SITE_NAME || 
                process.env.AZURE_WEBAPP_NAME || 
                process.env.WEBSITE_INSTANCE_ID ||
                process.env.AZURE;

if (isAzure) {
  console.log('🌐 Entorno Azure detectado - Aplicando configuración específica');
} else {
  console.log('🏠 Entorno local detectado - Usando configuración estándar');
}

module.exports = {
  isAzure,
  config: {
    legacyPeerDeps: true,
    optional: false,
    platform: 'linux',
    arch: 'x64'
  }
};
