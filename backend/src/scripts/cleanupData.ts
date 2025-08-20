import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

const prisma = new PrismaClient();

// Variable global para el servidor de socket (se establecerá desde el servidor principal)
let io: SocketIOServer | null = null;

// Función para establecer la instancia de Socket.IO
export function setSocketIO(socketIO: SocketIOServer) {
  io = socketIO;
}

async function cleanupData() {
  try {
    console.log('🧹 Limpiando datos problemáticos...\n');
    
    // 1. Limpiar estado de subasta
    console.log('🗑️ Limpiando estado de subasta...');
    await prisma.estadoSubasta.deleteMany({});
    console.log('✅ Estado de subasta limpiado');

    // 2. Limpiar todas las pujas
    console.log('🗑️ Limpiando todas las pujas...');
    await prisma.puja.deleteMany({});
    console.log('✅ Pujas limpiadas');

    // 3. Eliminar duplicados de Messi (mantener solo el primero)
    console.log('🗑️ Eliminando duplicados de Messi...');
    const messiItems = await prisma.item.findMany({
      where: { nombre: 'Lionel Messi' },
      orderBy: { id: 'asc' }
    });
    
    if (messiItems.length > 1) {
      // Mantener el primero, eliminar los demás
      const toDelete = messiItems.slice(1);
      for (const item of toDelete) {
        await prisma.item.delete({ where: { id: item.id } });
        console.log(`   Eliminado Messi duplicado ID: ${item.id}`);
      }
    }
    console.log('✅ Duplicados de Messi eliminados');

    // 4. Resetear créditos de todos los usuarios
    console.log('💰 Reseteando créditos...');
    await prisma.usuario.updateMany({
      data: { creditos: 2000 }
    });
    console.log('✅ Créditos reseteados a 2000');

    // 5. Emitir evento para cerrar todas las sesiones
    if (io) {
      console.log('🔌 Emitiendo evento de reinicio a todos los usuarios...');
      io.to('auction-room').emit('auction-reset', { 
        message: 'La subasta ha sido reiniciada. Por favor, recarga la página.',
        timestamp: new Date().toISOString()
      });
      console.log('✅ Evento de reinicio emitido');
    }

    // 6. Verificar estado final
    console.log('\n📊 Estado final:');
    
    const usuarios = await prisma.usuario.findMany({
      orderBy: { orden: 'asc' }
    });
    console.log('👥 Usuarios:');
    usuarios.forEach((usuario) => {
      console.log(`   ${usuario.orden}. ${usuario.email} - ${usuario.creditos} créditos`);
    });

    const items = await prisma.item.findMany({
      orderBy: { nombre: 'asc' }
    });
    console.log('\n📝 Items disponibles:');
    items.forEach((item) => {
      console.log(`   ${item.id}. ${item.nombre} - ${item.equipo}`);
    });

    const pujas = await prisma.puja.findMany();
    console.log(`\n💰 Pujas totales: ${pujas.length}`);

    const estados = await prisma.estadoSubasta.findMany();
    console.log(`📊 Estados de subasta: ${estados.length}`);

    console.log('\n✅ Limpieza completada!');
    console.log('\n🎯 Próximos pasos:');
    console.log('1. Inicia sesión con usuario1@test.com');
    console.log('2. Selecciona Messi para subastar');
    console.log('3. Todos los usuarios pueden pujar por Messi');
    console.log('4. El turno es solo para seleccionar el próximo jugador');

  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupData();
