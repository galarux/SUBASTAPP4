// Configuración centralizada de la aplicación
export const config = {
  // URLs de la API y Socket.IO
  API_BASE_URL: 'http://192.168.1.20:3001',
  SOCKET_URL: 'http://192.168.1.20:3001',
  
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

// Función para obtener la IP local automáticamente
export const getLocalIP = async (): Promise<string> => {
  try {
    // Intentar obtener la IP local desde el navegador
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('No se pudo obtener la IP automáticamente, usando configuración por defecto');
    return '192.168.1.20'; // IP por defecto
  }
};

// Función para actualizar las URLs dinámicamente
export const updateURLs = (newIP: string) => {
  config.API_BASE_URL = `http://${newIP}:${config.BACKEND_PORT}`;
  config.SOCKET_URL = `http://${newIP}:${config.BACKEND_PORT}`;
  console.log(`URLs actualizadas a: ${newIP}`);
};
