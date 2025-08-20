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
        
        // Obtener información actualizada del usuario
        const usuarioActualizado = await prisma.usuario.findUnique({
          where: { id: data.usuarioId },
          select: { id: true, nombre: true, email: true, creditos: true, orden: true }
        });
        
        // Emitir estado actual de la subasta desde la base de datos
        const estadoSubasta = await prisma.estadoSubasta.findFirst({
          where: { id: 1 },
          include: {
            itemActual: true
          }
        });

        if (usuarioActualizado) {
          // Emitir evento con información actualizada del usuario
          socket.emit('usuario-actualizado', { usuario: usuarioActualizado });
          console.log('💰 Información del usuario enviada:', usuarioActualizado);
          
          // Emitir el turno actual después de enviar la información del usuario
          if (estadoSubasta) {
            console.log('🔄 Enviando turno actual al frontend:', estadoSubasta.turnoActual);
            socket.emit('turn-changed', { turnoActual: estadoSubasta.turnoActual });
            console.log('✅ Evento turn-changed emitido para socket:', socket.id);
          } else {
            console.log('⚠️ No hay estado de subasta para enviar turno');
          }
        }

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
            // Si el item ya fue subastado y no hay subasta activa, verificar si es el turno del usuario
            if (estadoSubasta.turnoActual === usuarioActualizado?.orden) {
              console.log('🎯 Es el turno del usuario pero el item anterior ya fue subastado, permitiendo selección');
                          // Emitir evento para permitir la selección de jugador
            socket.emit('item-updated', { 
              item: null, 
              subastaActiva: false, 
              tiempoRestante: 0,
              esMiTurno: true,
              turnoActual: estadoSubasta.turnoActual
            });
            } else {
              console.log('🗑️ Item ya subastado, enviando evento de limpieza');
              socket.emit('item-cleared', { message: 'Subasta finalizada' });
            }
          }
        } else {
          // Si no hay estado de subasta o item actual, verificar si es el turno del usuario
          if (estadoSubasta && estadoSubasta.turnoActual === usuarioActualizado?.orden) {
            console.log('🎯 Es el turno del usuario pero no hay item seleccionado, permitiendo selección');
            // Emitir evento para permitir la selección de jugador
            socket.emit('item-updated', { 
              item: null, 
              subastaActiva: false, 
              tiempoRestante: 0,
              esMiTurno: true,
              turnoActual: estadoSubasta.turnoActual
            });
          } else {
            console.log('ℹ️ No hay estado de subasta o item actual');
          }
        }
      } catch (error) {
        console.error('Error al unirse a la subasta:', error);
      }
    });

    // Seleccionar item y activar subasta automáticamente
    socket.on('select-item', async (data: { itemId: number; usuarioId?: number }) => {
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

        // Obtener el usuario que seleccionó el item
        const usuarioSeleccionador = await prisma.usuario.findUnique({
          where: { id: data.usuarioId }
        });

        if (!usuarioSeleccionador) {
          socket.emit('item-error', { error: 'Usuario no encontrado' });
          return;
        }

        // Verificar que el usuario tenga suficientes créditos
        if (usuarioSeleccionador.creditos < item.precioSalida) {
          socket.emit('item-error', { error: 'No tienes suficientes créditos para la puja inicial' });
          return;
        }

        // Crear puja inicial automática con el usuario que seleccionó el item
        const pujaInicial = await prisma.puja.create({
          data: {
            itemId: data.itemId,
            monto: item.precioSalida,
            usuarioId: usuarioSeleccionador.id
          },
          include: {
            usuario: {
              select: { nombre: true, email: true }
            }
          }
        });

        // Restar créditos al usuario que seleccionó el item
        await prisma.usuario.update({
          where: { id: usuarioSeleccionador.id },
          data: { creditos: usuarioSeleccionador.creditos - item.precioSalida }
        });

        console.log(`💰 Puja inicial creada: ${usuarioSeleccionador.nombre} pujó ${item.precioSalida} créditos por ${item.nombre}`);

        // Iniciar contador centralizado
        iniciarContadorCentralizado(io);

        // Emitir a todos los usuarios que se seleccionó un item y la subasta está activa
        io.to('auction-room').emit('auction-started', { 
          item, 
          tiempoRestante: currentTiempoRestante
        });

        // Resetear el estado salioDePuja de todos los usuarios para la nueva subasta
        await prisma.usuario.updateMany({
          data: { salioDePuja: false }
        });

        // Actualizar el estado de la subasta en la base de datos
        await prisma.estadoSubasta.upsert({
          where: { id: 1 },
          update: {
            itemActualId: data.itemId,
            subastaActiva: true,
            tiempoRestante: currentTiempoRestante
          },
          create: {
            id: 1,
            itemActualId: data.itemId,
            subastaActiva: true,
            tiempoRestante: currentTiempoRestante
          }
        });

        // Emitir inmediatamente la puja inicial para que el frontend sepa que ya hay una puja activa
        io.to('auction-room').emit('new-bid', { puja: pujaInicial });

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

        // Verificar que el usuario no sea el que tiene la puja más alta
        if (pujaActual && pujaActual.usuarioId === data.usuarioId) {
          console.log('❌ Error: El usuario ya tiene la puja más alta');
          socket.emit('bid-error', { error: 'Ya tienes la puja más alta, no puedes pujar de nuevo' });
          return;
        }

        // Obtener el valor mínimo de puja desde la configuración
        const configPujaMinima = await prisma.configuracion.findUnique({
          where: { clave: 'puja_minima' }
        });
        const valorMinimoDefecto = configPujaMinima ? parseInt(configPujaMinima.valor) : 5;
        const montoMinimo = pujaActual ? pujaActual.monto + valorMinimoDefecto : item.precioSalida;
        console.log('💰 Monto mínimo requerido:', montoMinimo);
        console.log('💰 Monto de la puja:', data.monto);
        
        if (data.monto < montoMinimo) {
          console.log('❌ Error: Monto insuficiente');
          socket.emit('bid-error', { 
            error: `La puja debe ser al menos ${montoMinimo} créditos`,
            montoMinimo: montoMinimo 
          });
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

        // Obtener el usuario actualizado después de la puja
        const usuarioActualizado = await prisma.usuario.findUnique({
          where: { id: data.usuarioId },
          select: { id: true, nombre: true, email: true, creditos: true, orden: true }
        });

        // Emitir la nueva puja a todos los usuarios
        io.to('auction-room').emit('new-bid', { 
          puja,
          usuarioActualizado: usuarioActualizado
        });
        
        // Verificar si se debe adjudicar inmediatamente
        verificarAdjudicacionInmediata(io);

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

    // Usuario salió de la puja (evento desde el frontend)
    socket.on('usuario-salio-de-puja', async (data: { usuarioId: number }) => {
      try {
        console.log('👋 Usuario salió de la puja:', data.usuarioId);
        
        // Verificar si se debe adjudicar inmediatamente
        await verificarAdjudicacionInmediata(io);
      } catch (error) {
        console.error('Error al procesar salida de puja:', error);
      }
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
  
  // Actualizar el tiempo restante en la base de datos
  prisma.estadoSubasta.update({
    where: { id: 1 },
    data: { tiempoRestante: currentTiempoRestante }
  }).catch(error => {
    console.error('❌ Error al actualizar tiempo restante:', error);
  });

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
export async function adjudicarJugador(io?: Server) {
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

    // Obtener el usuario ganador para verificar sus créditos actuales
    const usuarioGanador = await prisma.usuario.findUnique({
      where: { id: pujaGanadora.usuarioId }
    });

    if (!usuarioGanador) {
      console.log('❌ Usuario ganador no encontrado');
      return;
    }

    // Verificar que el usuario tenga suficientes créditos
    if (usuarioGanador.creditos < pujaGanadora.monto) {
      console.log('❌ Usuario no tiene suficientes créditos para pagar la puja');
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

    // Restar créditos al usuario ganador
    await prisma.usuario.update({
      where: { id: pujaGanadora.usuarioId },
      data: {
        creditos: usuarioGanador.creditos - pujaGanadora.monto
      }
    });

    console.log(`💰 Créditos restados: ${usuarioGanador.nombre} tenía ${usuarioGanador.creditos}, pagó ${pujaGanadora.monto}, le quedan ${usuarioGanador.creditos - pujaGanadora.monto}`);

    // Desactivar la subasta y limpiar el item actual para permitir nueva selección
    await prisma.estadoSubasta.update({
      where: { id: 1 },
      data: {
        subastaActiva: false,
        tiempoRestante: 0,
        itemActualId: null // Limpiar el item actual para permitir nueva selección
      }
    });

    // Resetear el estado salioDePuja de todos los usuarios para la próxima subasta
    await prisma.usuario.updateMany({
      data: { salioDePuja: false }
    });

    console.log('✅ Jugador adjudicado:', {
      jugador: estadoSubasta.itemActual.nombre,
      ganador: pujaGanadora.usuario.nombre,
      monto: pujaGanadora.monto
    });

    // Emitir eventos solo si io está disponible
    if (io) {
      // Obtener todos los usuarios actualizados para enviar sus créditos
      const usuariosActualizados = await prisma.usuario.findMany({
        select: { id: true, nombre: true, email: true, creditos: true, orden: true }
      });

      // Emitir evento de fin de subasta con los detalles del ganador
      io.to('auction-room').emit('auction-ended', {
        message: `¡${estadoSubasta.itemActual.nombre} ha sido adjudicado!`,
        ganador: pujaGanadora.usuario,
        monto: pujaGanadora.monto,
        item: estadoSubasta.itemActual,
        tiempoRestante: 0,
        usuariosActualizados: usuariosActualizados
      });

      // Emitir actualización del estado de la subasta
      io.to('auction-room').emit('auction-state-updated', {
        subastaActiva: false,
        tiempoRestante: 0
      });

      // Cambiar al siguiente turno
      const siguienteTurno = await cambiarTurno();
      console.log('🔄 Turno cambiado a:', siguienteTurno);

      // Emitir evento para limpiar el item actual en todos los clientes
      io.to('auction-room').emit('item-cleared', {
        message: 'Subasta finalizada'
      });

      // Emitir evento de cambio de turno
      io.to('auction-room').emit('turn-changed', {
        turnoActual: siguienteTurno
      });
    }

    // Verificar si algún equipo ya tiene el número máximo de jugadores
    const shouldEnd = await ConfigService.shouldAuctionEnd();
    if (shouldEnd && io) {
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

// Función para cambiar al siguiente turno
export async function cambiarTurno(): Promise<number> {
  try {
    // Obtener el turno actual
    const estadoActual = await prisma.estadoSubasta.findFirst({
      where: { id: 1 }
    });

    const turnoActual = estadoActual?.turnoActual || 1;

    // Obtener todos los usuarios ordenados por su campo 'orden'
    const usuarios = await prisma.usuario.findMany({
      orderBy: { orden: 'asc' }
    });

    if (usuarios.length === 0) {
      console.log('❌ No hay usuarios disponibles');
      return 1;
    }

    // Encontrar el índice del usuario actual
    const usuarioActualIndex = usuarios.findIndex(u => u.orden === turnoActual);
    
    // Calcular el siguiente turno
    let siguienteTurno: number;
    if (usuarioActualIndex === -1 || usuarioActualIndex === usuarios.length - 1) {
      // Si no se encuentra el usuario actual o es el último, volver al primero
      siguienteTurno = usuarios[0].orden;
    } else {
      // Pasar al siguiente usuario
      siguienteTurno = usuarios[usuarioActualIndex + 1].orden;
    }

    // Actualizar el turno en la base de datos
    await prisma.estadoSubasta.update({
      where: { id: 1 },
      data: { turnoActual: siguienteTurno }
    });

    console.log(`🔄 Turno cambiado de ${turnoActual} a ${siguienteTurno}`);
    return siguienteTurno;

  } catch (error) {
    console.error('❌ Error al cambiar turno:', error);
    return 1; // Valor por defecto en caso de error
  }
}

// Función para verificar si se debe adjudicar inmediatamente
async function verificarAdjudicacionInmediata(io: Server) {
  try {
    // Obtener el estado actual de la subasta
    const estadoSubasta = await prisma.estadoSubasta.findFirst({
      where: { id: 1 },
      include: {
        itemActual: true
      }
    });

    if (!estadoSubasta || !estadoSubasta.subastaActiva || !estadoSubasta.itemActual) {
      return; // No hay subasta activa
    }

    // Obtener la puja más alta actual
    const pujaMasAlta = await prisma.puja.findFirst({
      where: { itemId: estadoSubasta.itemActual.id },
      orderBy: { monto: 'desc' },
      include: { usuario: true }
    });

    if (!pujaMasAlta) {
      return; // No hay pujas
    }

    // Obtener todos los usuarios
    const todosUsuarios = await prisma.usuario.findMany();
    
    // Obtener todas las pujas para este item
    const todasLasPujas = await prisma.puja.findMany({
      where: { itemId: estadoSubasta.itemActual.id },
      orderBy: { monto: 'desc' }
    });
    
    // Si solo hay una puja (la inicial), el usuario que la hizo no puede salir
    // Si hay más de una puja, el usuario con la más alta no puede salir
    const usuarioGanadorId = pujaMasAlta.usuarioId;
    
    // Contar cuántos usuarios han salido (excluyendo al ganador)
    const usuariosSalidos = todosUsuarios.filter(u => 
      u.salioDePuja && u.id !== usuarioGanadorId
    ).length;
    
    // Contar cuántos usuarios deberían haber salido (todos excepto el ganador)
    const usuariosQueDeberianSalir = todosUsuarios.length - 1;
    
    console.log(`📊 Verificación de adjudicación inmediata: ${usuariosSalidos}/${usuariosQueDeberianSalir} usuarios han salido`);
    
    // Si todos los usuarios excepto el que tiene la puja más alta han salido, adjudicar inmediatamente
    if (usuariosSalidos >= usuariosQueDeberianSalir) {
      console.log('🏆 Todos los usuarios han salido excepto el ganador, adjudicando inmediatamente...');
      
      // Limpiar el contador si está activo
      if (auctionCountdown) {
        clearInterval(auctionCountdown);
        auctionCountdown = null;
      }
      
      // Adjudicar el jugador inmediatamente
      await adjudicarJugador(io);
    }
  } catch (error) {
    console.error('❌ Error al verificar adjudicación inmediata:', error);
  }
}
