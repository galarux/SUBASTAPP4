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
    
    // 1. Calcular y actualizar créditos basándose en jugadores adjudicados
    console.log('💰 Calculando créditos basándose en jugadores adjudicados...');
    
    // Obtener todos los usuarios
    const todosLosUsuarios = await prisma.usuario.findMany();
    
    // Obtener items subastados (jugadores adjudicados)
    const itemsSubastados = await prisma.item.findMany({
      where: { 
        subastado: true, 
        ganadorId: { isSet: true } 
      }
    });
    
    // Calcular créditos gastados por cada usuario
    const creditosGastados = new Map<number, number>();
    
    for (const item of itemsSubastados) {
      if (item.ganadorId) {
        // Usar el precioSalida del item (precio final de adjudicación)
        const creditosActuales = creditosGastados.get(item.ganadorId) || 0;
        creditosGastados.set(item.ganadorId, creditosActuales + item.precioSalida);
        console.log(`   ${item.nombre} adjudicado a usuario ${item.ganadorId} por ${item.precioSalida} créditos`);
      }
    }
    
    // Actualizar créditos de cada usuario
    for (const usuario of todosLosUsuarios) {
      const creditosGastadosUsuario = creditosGastados.get(usuario.id) || 0;
      const creditosFinales = 2000 - creditosGastadosUsuario;
      
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { creditos: creditosFinales }
      });
      
      console.log(`   ${usuario.nombre}: ${2000} - ${creditosGastadosUsuario} = ${creditosFinales} créditos`);
    }
    
    console.log('✅ Créditos calculados correctamente');

    // 2. Limpiar estado de subasta pero mantener el turno actual
    console.log('🗑️ Limpiando estado de subasta pero manteniendo turno...');
    
    // Obtener el turno actual antes de limpiar
    const estadoActual = await prisma.estadoSubasta.findFirst({
      where: { id: 1 }
    });
    
    const turnoActual = estadoActual?.turnoActual || 1;
    console.log(`📊 Turno actual preservado: ${turnoActual}`);
    
    // Limpiar solo los campos temporales, manteniendo el turno
    await prisma.estadoSubasta.upsert({
      where: { id: 1 },
      update: {
        itemActualId: null,
        subastaActiva: false,
        tiempoRestante: 0
      },
      create: {
        id: 1,
        itemActualId: null,
        subastaActiva: false,
        turnoActual: turnoActual,
        tiempoRestante: 0
      }
    });
    
    console.log('✅ Estado de subasta limpiado (turno preservado)');

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
    
    const usuariosFinales = await prisma.usuario.findMany({
      orderBy: { orden: 'asc' }
    });
    console.log('👥 Usuarios:');
    usuariosFinales.forEach((usuario) => {
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
    console.log(`\n💰 Pujas conservadas: ${pujas.length}`);

    const estados = await prisma.estadoSubasta.findMany();
    console.log(`📊 Estados de subasta: ${estados.length}`);

    console.log('\n✅ Limpieza completada!');

  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupData();
