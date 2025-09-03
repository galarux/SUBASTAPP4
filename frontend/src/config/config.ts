// Configuración centralizada de la aplicación
export const config = {
  // URLs de la API y Socket.IO (se configuran dinámicamente)
  API_BASE_URL: '',
  SOCKET_URL: '',
  
  // Configuración de la aplicación
  APP_NAME: 'SUBASTAPP',
  VERSION: '1.0.0',
  
  // Configuración de la subasta
  DEFAULT_CREDITOS: 2000,
  DEFAULT_PRECIO_SALIDA: 5,
  DEFAULT_TIEMPO_PUJA: 30,
  MAX_ITEMS_POR_USUARIO: 25,
  
  // Puertos
  BACKEND_PORT: 3001,
  FRONTEND_PORT: 5173,
};

// 🌐 IP DEL BACKEND - CAMBIAR AQUÍ FÁCILMENTE
const BACKEND_IP = '192.168.10.116';

// Función para detectar si estamos en Azure
export const isAzureEnvironment = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('azurewebsites.net') ||
           window.location.hostname.includes('azure.com');
  }
  return false;
};

// Función para obtener la URL base según el entorno
export const getBaseURL = (): string => {
  // Si hay variables de entorno de Vite, usarlas (producción)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (isAzureEnvironment()) {
    // En Azure, usar la URL actual (misma URL para frontend y backend)
    return window.location.origin;
  } else {
    // En desarrollo local, usar la IP configurada
    return `http://${BACKEND_IP}:${config.BACKEND_PORT}`;
  }
};

// Función para inicializar las URLs
export const initializeURLs = (): void => {
  const baseURL = getBaseURL();
  config.API_BASE_URL = baseURL;
  config.SOCKET_URL = baseURL;
  
  console.log('🔧 URLs configuradas:', {
    environment: isAzureEnvironment() ? 'Azure' : 'Local',
    backendIP: BACKEND_IP,
    baseURL,
    API_BASE_URL: config.API_BASE_URL,
    SOCKET_URL: config.SOCKET_URL,
    viteEnv: {
      VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL
    }
  });
};

// Función para obtener la URL de la API (para servicios)
export const getAPIBaseURL = (): string => {
  // Si ya está configurada, usarla
  if (config.API_BASE_URL) {
    return config.API_BASE_URL;
  }
  
  // Si no, calcularla inmediatamente
  return getBaseURL();
};

// Función para obtener la URL del Socket (para hooks)
export const getSocketURL = (): string => {
  // Si ya está configurada, usarla
  if (config.SOCKET_URL) {
    return config.SOCKET_URL;
  }
  
  // Si no, calcularla inmediatamente
  return getBaseURL();
};

// Inicializar URLs automáticamente
if (typeof window !== 'undefined') {
  initializeURLs();
}
