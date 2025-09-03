// Configuración automática para Azure
export const configureAzureEnvironment = () => {
  // Configurar variables de entorno para Azure si no están definidas
  if (typeof process !== 'undefined' && process.env) {
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
    
    // Variables para Vite
    if (!process.env.VITE_LEGACY_PEER_DEPS) {
      process.env.VITE_LEGACY_PEER_DEPS = 'true';
    }
    
    console.log('🔧 Configuración de Azure aplicada:', {
      NPM_CONFIG_LEGACY_PEER_DEPS: process.env.NPM_CONFIG_LEGACY_PEER_DEPS,
      NPM_CONFIG_OPTIONAL: process.env.NPM_CONFIG_OPTIONAL,
      NPM_CONFIG_PLATFORM: process.env.NPM_CONFIG_PLATFORM,
      NPM_CONFIG_ARCH: process.env.NPM_CONFIG_ARCH,
      VITE_LEGACY_PEER_DEPS: process.env.VITE_LEGACY_PEER_DEPS
    });
  }
  
  // Configuración para el navegador (si es necesario)
  if (typeof window !== 'undefined') {
    // Establecer variables en localStorage para persistencia
    const azureConfig = {
      legacyPeerDeps: true,
      optional: false,
      platform: 'linux',
      arch: 'x64'
    };
    
    localStorage.setItem('azure_config', JSON.stringify(azureConfig));
    console.log('🌐 Configuración de Azure guardada en localStorage');
  }
};

// Función para obtener configuración
export const getAzureConfig = () => {
  if (typeof window !== 'undefined') {
    const config = localStorage.getItem('azure_config');
    return config ? JSON.parse(config) : null;
  }
  return null;
};

// Función para verificar si estamos en Azure
export const isAzureEnvironment = () => {
  // Verificar si estamos en Azure por la URL o variables de entorno
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('azurewebsites.net') ||
           window.location.hostname.includes('azure.com');
  }
  
  if (typeof process !== 'undefined' && process.env) {
    return process.env.WEBSITE_SITE_NAME !== undefined ||
           process.env.AZURE_WEBAPP_NAME !== undefined;
  }
  
  return false;
};

// Ejecutar configuración automáticamente
if (typeof window !== 'undefined') {
  // En el navegador, ejecutar cuando se carga la página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configureAzureEnvironment);
  } else {
    configureAzureEnvironment();
  }
} else if (typeof process !== 'undefined') {
  // En Node.js, ejecutar inmediatamente
  configureAzureEnvironment();
}
