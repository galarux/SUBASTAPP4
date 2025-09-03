// Configuración automática para Azure en el backend
export const configureAzureEnvironment = () => {
  // Configurar variables de entorno para Azure si no están definidas
  if (process.env) {
    // Variables para npm
    if (!process.env.NPM_CONFIG_LEGACY_PEER_DEPS) {
      process.env.NPM_CONFIG_LEGACY_PEER_DEPS = 'true';
    }
    if (!process.env.NPM_CONFIG_OPTIONAL) {
      process.env.NPM_CONFIG_OPTIONAL = 'false';
    }
    if (!process.env.NPM_CONFIG_PLATFORM) {
      process.env.NPM_CONFIG_PLATFORM = 'linux';
    }
    if (!process.env.NPM_CONFIG_ARCH) {
      process.env.NPM_CONFIG_ARCH = 'x64';
    }
    
    // Variables específicas de Azure
    if (!process.env.WEBSOCKETS_ENABLED) {
      process.env.WEBSOCKETS_ENABLED = 'true';
    }
    if (!process.env.WEBSITE_NODE_DEFAULT_VERSION) {
      process.env.WEBSITE_NODE_DEFAULT_VERSION = '20.x';
    }
    
    console.log('🔧 Configuración de Azure aplicada en backend:', {
      NPM_CONFIG_LEGACY_PEER_DEPS: process.env.NPM_CONFIG_LEGACY_PEER_DEPS,
      NPM_CONFIG_OPTIONAL: process.env.NPM_CONFIG_OPTIONAL,
      NPM_CONFIG_PLATFORM: process.env.NPM_CONFIG_PLATFORM,
      NPM_CONFIG_ARCH: process.env.NPM_CONFIG_ARCH,
      WEBSOCKETS_ENABLED: process.env.WEBSOCKETS_ENABLED,
      WEBSITE_NODE_DEFAULT_VERSION: process.env.WEBSITE_NODE_DEFAULT_VERSION
    });
  }
};

// Función para verificar si estamos en Azure
export const isAzureEnvironment = () => {
  return process.env.WEBSITE_SITE_NAME !== undefined ||
         process.env.AZURE_WEBAPP_NAME !== undefined ||
         process.env.WEBSITE_INSTANCE_ID !== undefined;
};

// Función para obtener configuración de Azure
export const getAzureConfig = () => {
  return {
    isAzure: isAzureEnvironment(),
    websiteName: process.env.WEBSITE_SITE_NAME,
    instanceId: process.env.WEBSITE_INSTANCE_ID,
    nodeVersion: process.env.WEBSITE_NODE_DEFAULT_VERSION,
    websocketsEnabled: process.env.WEBSOCKETS_ENABLED === 'true'
  };
};

// Ejecutar configuración automáticamente
configureAzureEnvironment();
