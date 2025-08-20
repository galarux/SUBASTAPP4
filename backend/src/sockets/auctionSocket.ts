import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '../services/configService';

const prisma = new PrismaClient();

// Variable global para el contador de la subasta
let auctionCountdown: NodeJS.Timeout | null = null;
let currentTiempoRestante = 12;

export function setupAuctionSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Usuario conectado:', socket.id);

    // Unirse a la sala de subasta
    socket.on('join-auction', async (data: { usuarioId: number }) => {
      try {
        console.log('📨 Datos recibidos en join-auction:', data);
        if (!data || data.usuarioId === undefined) {
          console.error('❌ Error: usuarioId es undefined o no válido');
          return;
        }
        
        socket.join('auction-room');
        console.log('✅ Usuario se unió a la subasta:', data.usuarioId);
        
        // Emitir estado actual de la subasta desde la base de datos
        const estadoSubasta = await prisma.estadoSubasta.findFirst({
          where: { id: 1 },
          include: {
            itemActual: true
          }
        });

        if (estadoSubasta && estadoSubasta.itemActual) {
          console.log('📡 Enviando estado actual de subasta:', {
            item: estadoSubasta.itemActual.nombre,
            subastaActiva: estadoSubasta.subastaActiva,
            tiempoRestante: estadoSubasta.tiempoRestante
          });
          
          // Solo enviar el item si no ha sido subastado o si la subasta está activa
          if (estadoSubasta.subastaActiva || !estadoSubasta.itemActual.subastado) {
            if (estadoSubasta.subastaActiva) {
              socket.emit('auction-started', { 
                item: estadoSubasta.itemActual,
                tiempoRestante: estadoSubasta.tiempoRestante
              });
            } else {
              socket.emit('item-selected', { item: estadoSubasta.itemActual });
            }
          } else {
            // Si el item ya fue subastado y no hay subasta activa, enviar evento de limpieza
            console.log('🗑️ Item ya subastado, enviando evento de limpieza');
            socket.emit('item-cleared', { message: 'Subasta finalizada' });
          }
        }
      } catch (error) {
        console.error('Error al unirse a la subasta:', error);
      }
    });

    // Seleccionar item y activar subasta automáticamente
    socket.on('select-item', async (data: { itemId: number }) => {
      try {
        console.log('🎯 Item seleccionado:', data);
        
        // Obtener el item
        const item = await prisma.item.findUnique({
          where: { id: data.itemId }
        });

        if (!item) {
          socket.emit('item-error', { error: 'Item no encontrado' });
          return;
        }

        if (item.subastado) {
          socket.emit('item-error', { error: 'El item ya ha sido subastado' });
          return;
        }

        // Obtener el primer usuario disponible para puja inicial
        const primerUsuario = await prisma.usuario.findFirst({
          orderBy: { id: 'asc' }
        });

        if (!primerUsuario) {
          socket.emit('item-error', { error: 'No hay usuarios disponibles para crear puja inicial' });
          return;
        }

        // Crear puja inicial automática
        const pujaInicial = await prisma.puja.create({
          data: {
            itemId: data.itemId,
            monto: item.precioSalida,
            usuarioId: primerUsuario.id // Usar el primer usuario disponible
          }
        });

        // Iniciar contador centralizado
        iniciarContadorCentralizado(io);

        // Emitir a todos los usuarios que se seleccionó un item y la subasta está activa
        io.to('auction-room').emit('auction-started', { 
          item, 
          tiempoRestante: currentTiempoRestante
        });

        console.log('✅ Subasta iniciada automáticamente para:', item.nombre);
      } catch (error) {
        console.error('Error al seleccionar item:', error);
        socket.emit('item-error', { error: 'Error interno del servidor' });
      }
    });

    // Iniciar subasta
    socket.on('start-auction', async (data: { itemId: number }) => {
      try {
        console.log('🚀 Iniciando subasta para item:', data.itemId);
        
        // Obtener el item
        const item = await prisma.item.findUnique({
          where: { id: data.itemId }
        });

        if (!item) {
          socket.emit('auction-error', { error: 'Item no encontrado' });
          return;
        }

        // Emitir a todos los usuarios que la subasta ha comenzado
        io.to('auction-room').emit('auction-started', { 
          item,
          tiempoRestante: 12
        });

        // También emitir un evento específico para iniciar el contador
        io.to('auction-room').emit('start-countdown', { 
          tiempoRestante: 12
        });

        console.log('✅ Subasta iniciada emitida a todos los usuarios:', item.nombre);
      } catch (error) {
        console.error('Error al iniciar subasta:', error);
        socket.emit('auction-error', { error: 'Error interno del servidor' });
      }
    });

    // Realizar puja
    socket.on('place-bid', async (data: { itemId: number; monto: number; usuarioId: number }) => {
      try {
        console.log('💰 Nueva puja recibida:', data);

        // Verificar que el usuario tiene suficientes créditos
        const usuario = await prisma.usuario.findUnique({
          where: { id: data.usuarioId }
        });

        console.log('🔍 Usuario encontrado:', usuario);

        if (!usuario || usuario.creditos < data.monto) {
          console.log('❌ Error: Usuario no encontrado o créditos insuficientes');
          socket.emit('bid-error', { error: 'No tienes suficientes créditos' });
          return;
        }

        // Obtener la puja actual más alta
        const pujaActual = await prisma.puja.findFirst({
          where: { itemId: data.itemId },
          orderBy: { monto: 'desc' }
        });

        const item = await prisma.item.findUnique({
          where: { id: data.itemId }
        });

        if (!item) {
          socket.emit('bid-error', { error: 'Item no encontrado' });
          return;
        }

        const valorMinimoDefecto = 5; // Valor mínimo por defecto
        const montoMinimo = pujaActual ? pujaActual.monto + valorMinimoDefecto : item.precioSalida;
        console.log('💰 Monto mínimo requerido:', montoMinimo);
        console.log('💰 Monto de la puja:', data.monto);
        
        if (data.monto < montoMinimo) {
          console.log('❌ Error: Monto insuficiente');
          socket.emit('bid-error', { error: `La puja debe ser al menos ${montoMinimo} créditos` });
          return;
        }

        // Crear la puja
        console.log('📝 Creando puja en base de datos...');
        const puja = await prisma.puja.create({
          data: {
            monto: data.monto,
            itemId: data.itemId,
            usuarioId: data.usuarioId
          },
          include: {
            usuario: {
              select: { nombre: true, email: true }
            }
          }
        });
        console.log('✅ Puja creada:', puja);

        // Actualizar créditos del usuario
        console.log('💰 Actualizando créditos del usuario...');
        await prisma.usuario.update({
          where: { id: data.usuarioId },
          data: { creditos: usuario.creditos - data.monto }
        });
        console.log('✅ Créditos actualizados');

        console.log('💰 Créditos actualizados, reseteando contador...');
        console.log('🔄 Llamando a resetearContador...');
        
        // Resetear contador cuando hay nueva puja
        resetearContador(io);

        // Emitir la nueva puja a todos los usuarios
        io.to('auction-room').emit('new-bid', { puja });

        console.log('✅ Puja procesada exitosamente:', puja);
      } catch (error) {
        console.error('Error al procesar puja:', error);
        socket.emit('bid-error', { error: 'Error interno del servidor' });
      }
    });



    // Salir de la subasta
    socket.on('leave-auction', () => {
      socket.leave('auction-room');
      console.log('Usuario salió de la subasta:', socket.id);
    });

    // Evento de reinicio por administrador
    socket.on('admin-reset-auction', (data: { message: string; timestamp: string }) => {
      try {
        console.log('🔄 Evento admin-reset-auction recibido:', data);
        
        // Emitir evento de reinicio a todos los usuarios
        io.to('auction-room').emit('auction-reset', data);
        console.log('✅ Evento de reinicio emitido a todos los usuarios');
      } catch (error) {
        console.error('Error al procesar reinicio de subasta:', error);
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
  });
 }

// Función para iniciar el contador centralizado
function iniciarContadorCentralizado(io: Server) {
  // Limpiar contador anterior si existe
  if (auctionCountdown) {
    clearInterval(auctionCountdown!);
  }

  currentTiempoRestante = 12;
  console.log('🚀 Iniciando contador centralizado con 12 segundos');

  auctionCountdown = setInterval(() => {
    currentTiempoRestante--;
    console.log('⏰ Contador centralizado:', currentTiempoRestante);

    // Emitir actualización de tiempo a todos los clientes
    io.to('auction-room').emit('time-update', { 
      tiempoRestante: currentTiempoRestante 
    });

    if (currentTiempoRestante <= 0) {
      // Tiempo agotado
      console.log('🏁 Tiempo agotado, finalizando subasta');
      if (auctionCountdown) {
        clearInterval(auctionCountdown);
      }
      auctionCountdown = null;
      
      // Adjudicar el jugador al ganador
      adjudicarJugador(io);
    }
  }, 1000);
}

// Función para resetear el contador cuando hay nueva puja
function resetearContador(io: Server) {
  console.log('🔄 === INICIO resetearContador ===');
  console.log('🔄 Reseteando contador por nueva puja');
  
  // Limpiar el contador anterior
  if (auctionCountdown) {
    console.log('🧹 Limpiando contador anterior...');
    clearInterval(auctionCountdown);
    auctionCountdown = null;
  }
  
  // Reiniciar el tiempo
  currentTiempoRestante = 12;
  console.log('⏰ Tiempo reiniciado a 12 segundos');
  
  // Emitir actualización inmediata del tiempo
  io.to('auction-room').emit('time-update', { 
    tiempoRestante: currentTiempoRestante 
  });
  console.log('📡 Evento time-update emitido con 12 segundos');
  
  // Crear nuevo contador directamente (sin llamar a iniciarContadorCentralizado)
  console.log('🚀 Creando nuevo contador...');
  auctionCountdown = setInterval(() => {
    currentTiempoRestante--;
    console.log('⏰ Contador centralizado (reseteado):', currentTiempoRestante);

    // Emitir actualización de tiempo a todos los clientes
    io.to('auction-room').emit('time-update', { 
      tiempoRestante: currentTiempoRestante 
    });

    if (currentTiempoRestante <= 0) {
      // Tiempo agotado
      console.log('🏁 Tiempo agotado, finalizando subasta');
      if (auctionCountdown) {
        clearInterval(auctionCountdown);
      }
      auctionCountdown = null;
      
      // Adjudicar el jugador al ganador
      adjudicarJugador(io);
    }
  }, 1000);
  
  console.log('✅ Contador reseteado exitosamente');
  console.log('🔄 === FIN resetearContador ===');
}

// Función para adjudicar el jugador al ganador cuando se agota el tiempo
async function adjudicarJugador(io: Server) {
  try {
    console.log('🏆 Adjudicando jugador al ganador...');
    
    // Obtener el estado actual de la subasta
    const estadoSubasta = await prisma.estadoSubasta.findFirst({
      where: { id: 1 },
      include: {
        itemActual: true
      }
    });

    if (!estadoSubasta || !estadoSubasta.itemActual) {
      console.log('❌ No hay subasta activa para adjudicar');
      return;
    }

    // Obtener la puja más alta para este item
    const pujaGanadora = await prisma.puja.findFirst({
      where: { itemId: estadoSubasta.itemActual.id },
      orderBy: { monto: 'desc' },
      include: {
        usuario: {
          select: { nombre: true, email: true }
        }
      }
    });

    if (!pujaGanadora) {
      console.log('❌ No hay pujas para adjudicar');
      return;
    }

    // Marcar el item como subastado y asignar el ganador
    await prisma.item.update({
      where: { id: estadoSubasta.itemActual.id },
      data: {
        subastado: true,
        ganadorId: pujaGanadora.usuarioId
      }
    });

    // Desactivar la subasta
    await prisma.estadoSubasta.update({
      where: { id: 1 },
      data: {
        subastaActiva: false,
        tiempoRestante: 0
      }
    });

    console.log('✅ Jugador adjudicado:', {
      jugador: estadoSubasta.itemActual.nombre,
      ganador: pujaGanadora.usuario.nombre,
      monto: pujaGanadora.monto
    });

    // Emitir evento de fin de subasta con los detalles del ganador
    io.to('auction-room').emit('auction-ended', {
      message: `¡${estadoSubasta.itemActual.nombre} ha sido adjudicado!`,
      ganador: pujaGanadora.usuario,
      monto: pujaGanadora.monto,
      item: estadoSubasta.itemActual,
      tiempoRestante: 0
    });

    // Emitir actualización del estado de la subasta
    io.to('auction-room').emit('auction-state-updated', {
      subastaActiva: false,
      tiempoRestante: 0
    });

    // Emitir evento para limpiar el item actual en todos los clientes
    io.to('auction-room').emit('item-cleared', {
      message: 'Subasta finalizada'
    });

    // Verificar si algún equipo ya tiene el número máximo de jugadores
    const shouldEnd = await ConfigService.shouldAuctionEnd();
    if (shouldEnd) {
      console.log('🏁 ¡Un equipo ha alcanzado el número máximo de jugadores!');
      
      // Obtener estadísticas finales
      const stats = await ConfigService.getPlayerStats();
      const winner = stats.find(s => s.jugadoresCount >= s.maxJugadores);
      
      if (winner) {
        // Emitir evento de fin de subasta completa
        io.to('auction-room').emit('auction-complete', {
          message: `¡La subasta ha terminado! ${winner.nombre} ha completado su equipo con ${winner.jugadoresCount} jugadores`,
          winner: winner,
          stats: stats
        });
        
        // Limpiar estado de subasta
        await prisma.estadoSubasta.update({
          where: { id: 1 },
          data: {
            itemActualId: null,
            subastaActiva: false,
            tiempoRestante: 0
          }
        });
        
        console.log('🏆 Subasta completa finalizada');
      }
    }

  } catch (error) {
    console.error('❌ Error al adjudicar jugador:', error);
  }
}
