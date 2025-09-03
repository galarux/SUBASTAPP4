import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import './config/azure-config';

// Importar rutas
import authRoutes from './routes/authRoutes';
import itemsRoutes from './routes/itemsRoutes';
import pujasRoutes from './routes/pujasRoutes';
import salidasRoutes from './routes/salidasRoutes';
import configRoutes from './routes/configRoutes';
import plantillasRoutes from './routes/plantillasRoutes';

// Importar Socket.IO
import { setupAuctionSocket } from './sockets/auctionSocket';
import { setSocketIO } from './scripts/cleanupData';

// Cargar variables de entorno
dotenv.config();

const app = express();
const server = createServer(app);

// Función para detectar si estamos en Azure
const isAzureEnvironment = (): boolean => {
  return process.env.WEBSITE_SITE_NAME !== undefined ||
         process.env.AZURE_WEBAPP_NAME !== undefined ||
         process.env.WEBSITE_INSTANCE_ID !== undefined;
};

// Función para obtener el origen CORS correcto
const getCorsOrigin = (): string => {
  // Si hay una variable de entorno específica, usarla
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }
  
  // Si estamos en Azure, usar la URL de Azure
  if (isAzureEnvironment()) {
    // En Azure, el frontend y backend están en la misma URL
    return process.env.WEBSITE_HOSTNAME ? 
           `https://${process.env.WEBSITE_HOSTNAME}` : 
           'https://subastapp-hjhmg6cxc5edg9av.spaincentral-01.azurewebsites.net';
  }
  
  // En desarrollo local, usar localhost
  return "http://localhost:5173";
};

const corsOrigin = getCorsOrigin();

export const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json());

// Configurar Socket.IO
setupAuctionSocket(io);

// Pasar la instancia de Socket.IO al script de limpieza
setSocketIO(io);

// Ejecutar limpieza de datos al iniciar el servidor
import('./scripts/cleanupData').then(() => {
  console.log('🧹 Script de limpieza ejecutado al iniciar el servidor');
}).catch(error => {
  console.error('❌ Error al ejecutar script de limpieza:', error);
});

// Rutas de la API (PRIMERO - antes del frontend)
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/pujas', pujasRoutes);
app.use('/api/salidas', salidasRoutes);
app.use('/api/config', configRoutes);
app.use('/api/plantillas', plantillasRoutes);

// Servir archivos estáticos del frontend (DESPUÉS de las rutas de la API)
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
  console.log('📁 Sirviendo frontend desde:', frontendPath);
  app.use(express.static(frontendPath));
} else {
  console.log('⚠️  Frontend no encontrado en:', frontendPath);
}

// Ruta catch-all para SPA (AL FINAL - después de todo lo demás)
if (fs.existsSync(frontendPath)) {
  app.get('*', (req, res) => {
    // Si es una ruta de la API, no interferir
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint no encontrado' });
    }
    
    // Para cualquier otra ruta, servir el index.html del frontend
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Ruta de prueba si no hay frontend
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API de Subasta App funcionando',
      endpoints: {
        auth: '/api/auth',
        items: '/api/items',
        pujas: '/api/pujas',
        salidas: '/api/salidas',
        config: '/api/config',
        plantillas: '/api/plantillas'
      }
    });
  });
}

// Puerto
const PORT = parseInt(process.env.PORT || '3001');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible en: http://0.0.0.0:${PORT}`);
  console.log(`🔧 Entorno: ${isAzureEnvironment() ? 'Azure' : 'Local'}`);
  console.log(`📱 CORS Origin: ${corsOrigin}`);
  console.log(`🔌 Socket.IO: Habilitado`);
});

// Manejo de errores
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
