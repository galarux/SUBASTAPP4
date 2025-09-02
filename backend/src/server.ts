import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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
export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://192.168.1.20:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://192.168.1.20:5173", "http://127.0.0.1:5173"],
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

// Rutas
app.use('/auth', authRoutes);
app.use('/items', itemsRoutes);
app.use('/pujas', pujasRoutes);
app.use('/salidas', salidasRoutes);
app.use('/config', configRoutes);
app.use('/plantillas', plantillasRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Subasta App funcionando',
    endpoints: {
      auth: '/auth',
      items: '/items',
      pujas: '/pujas',
      salidas: '/salidas',
      config: '/config',
      plantillas: '/plantillas'
    }
  });
});

// Puerto
const PORT = parseInt(process.env.PORT || '3001');

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible en: http://0.0.0.0:${PORT}`);
  console.log(`📱 Frontend: ${process.env.CORS_ORIGIN || "http://192.168.1.20:5173"}`);
  console.log(`🔌 Socket.IO: Habilitado`);
});

// Manejo de errores
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
