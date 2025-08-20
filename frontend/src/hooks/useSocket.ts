import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuction } from '../context/AuctionContext';
import type { Puja, Item } from '../context/AuctionContext';
import { plantillasService } from '../services/plantillasService';

const SOCKET_URL = 'http://192.168.18.124:3001';

// Singleton para la conexión Socket.IO
let socketInstance: Socket | null = null;
let isInitialized = false;

// Función para obtener la instancia del socket
export function getSocket(): Socket | null {
  return socketInstance;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { state, dispatch } = useAuction();

  useEffect(() => {
    // Crear conexión Socket.IO solo una vez
    if (!isInitialized) {
      console.log('🔌 Inicializando Socket.IO...');
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });
      isInitialized = true;
    }

    const socket = socketInstance;
    if (!socket) return;

    // Limpiar event listeners anteriores para evitar duplicados
    socket.off('connect');
    socket.off('disconnect');
    socket.off('auction-started');
    socket.off('auction-ended');
    socket.off('new-bid');
    socket.off('bid-error');
    socket.off('time-update');
    socket.off('turn-changed');
    socket.off('item-updated');
    socket.off('item-selected');
    socket.off('item-cleared');
    socket.off('auction-reset');
    socket.off('auction-complete');
    socket.off('usuario-actualizado');
    socket.off('turn-changed');

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('Conectado al servidor Socket.IO');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor Socket.IO');
      setIsConnected(false);
    });

    // Evento para actualizar información del usuario
    socket.on('usuario-actualizado', (data: { usuario: any }) => {
      console.log('👤 Evento usuario-actualizado recibido:', data);
      if (state.usuario && data.usuario.id === state.usuario.id) {
        dispatch({ type: 'UPDATE_CREDITOS', payload: data.usuario.creditos });
        console.log(`💰 Créditos actualizados al conectar: ${data.usuario.creditos}`);
      }
    });

    // Eventos de subasta
    socket.on('auction-started', (data: { item: Item; tiempoRestante: number }) => {
      console.log('🚀 Evento auction-started recibido:', data);
      dispatch({ type: 'SET_ITEM_ACTUAL', payload: data.item });
      dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: true });
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: data.tiempoRestante || 30 });
      // Limpiar pujas anteriores cuando inicia una nueva subasta
      dispatch({ type: 'SET_PUJAS', payload: [] });
    });

    socket.on('auction-ended', (data: { message: string; ganador: any; monto: number; item: any; tiempoRestante: number; usuariosActualizados?: any[] }) => {
      console.log('🏁 Evento auction-ended recibido:', data);
      dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: 0 });
      
      // Actualizar créditos del usuario actual si se proporcionan usuarios actualizados
      if (data.usuariosActualizados && state.usuario) {
        const usuarioActualizado = data.usuariosActualizados.find(u => u.id === state.usuario?.id);
        if (usuarioActualizado) {
          dispatch({ type: 'UPDATE_CREDITOS', payload: usuarioActualizado.creditos });
          console.log(`💰 Créditos actualizados del usuario: ${usuarioActualizado.creditos}`);
        }
      }
      
      // Mostrar notificación de ganador
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `🏆 ${data.message} - Ganador: ${data.ganador.nombre} (${data.monto} créditos)`,
          timestamp: new Date()
        }
      });
      
      // Limpiar inmediatamente el item actual y las pujas
      dispatch({ type: 'SET_ITEM_ACTUAL', payload: null });
      dispatch({ type: 'SET_PUJAS', payload: [] });
      
      // Recargar plantillas después de que finaliza una subasta
      setTimeout(async () => {
        try {
          const response = await plantillasService.getPlantillas();
          if (response.success && response.plantillas) {
            dispatch({ type: 'SET_PLANTILLAS', payload: response.plantillas });
            console.log('🔄 Plantillas actualizadas después de adjudicación');
          }
        } catch (error) {
          console.error('Error al recargar plantillas:', error);
        }
      }, 1000);
    });

    socket.on('new-bid', (data: { puja: Puja; usuarioActualizado?: any }) => {
      console.log('💰 Evento new-bid recibido:', data);
      dispatch({ type: 'ADD_PUJA', payload: data.puja });
      
      // Actualizar créditos del usuario si es el usuario actual
      if (data.usuarioActualizado && state.usuario && data.usuarioActualizado.id === state.usuario?.id) {
        dispatch({ type: 'UPDATE_CREDITOS', payload: data.usuarioActualizado.creditos });
        console.log(`💰 Créditos actualizados después de puja: ${data.usuarioActualizado.creditos}`);
      }
    });

    socket.on('bid-error', (data: { error: string; montoMinimo?: number }) => {
      console.log('❌ Error de puja recibido:', data);
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'error',
          message: data.error,
          timestamp: new Date()
        }
      });
      
      // Si el servidor proporciona el monto mínimo, actualizar el input
      if (data.montoMinimo) {
        // Emitir un evento personalizado para actualizar el monto
        window.dispatchEvent(new CustomEvent('update-bid-amount', { 
          detail: { montoMinimo: data.montoMinimo } 
        }));
      }
    });

    socket.on('time-update', (data: { tiempoRestante: number }) => {
      console.log('⏰ Evento time-update recibido:', data);
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: data.tiempoRestante });
    });

    socket.on('turn-changed', (data: { turnoActual: number }) => {
      console.log('🔄 Evento turn-changed recibido en frontend:', data);
      console.log('🔄 Cambiando turno de', state.turnoActual, 'a', data.turnoActual);
      console.log('🔄 Estado actual del usuario:', state.usuario);
      dispatch({ type: 'SET_TURNO', payload: data.turnoActual });
    });

    socket.on('item-selected', (data: { item: Item }) => {
      console.log('🎯 Evento item-selected recibido:', data);
      
      // Si el item ya fue subastado, no mostrarlo
      if (data.item.subastado) {
        console.log('🗑️ Item ya subastado, no mostrando...');
        dispatch({ type: 'SET_ITEM_ACTUAL', payload: null });
        dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
      } else {
        dispatch({ type: 'SET_ITEM_ACTUAL', payload: data.item });
        dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
      }
      
      // No limpiar las plantillas cuando se selecciona un item
      console.log('📋 Manteniendo plantillas visibles durante selección de item');
    });

    socket.on('item-updated', (data: { item: Item | null; subastaActiva: boolean; tiempoRestante: number; esMiTurno?: boolean; turnoActual?: number }) => {
      console.log('📝 Evento item-updated recibido:', data);
      
      // Si el item es null y esMiTurno es true, significa que es el turno del usuario pero no hay item seleccionado
      if (data.item === null && data.esMiTurno) {
        console.log('🎯 Es el turno del usuario pero no hay item seleccionado, permitiendo selección');
        dispatch({ type: 'SET_ITEM_ACTUAL', payload: null });
        dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
        dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: 0 });
        dispatch({ type: 'SET_PUJAS', payload: [] });
        // Actualizar el turno si se proporciona
        if (data.turnoActual !== undefined) {
          dispatch({ type: 'SET_TURNO', payload: data.turnoActual });
        }
        return;
      }
      
      // Si el item ya fue subastado y la subasta no está activa, limpiar el estado
      if (data.item && data.item.subastado && !data.subastaActiva) {
        console.log('🗑️ Item ya subastado, limpiando estado...');
        dispatch({ type: 'SET_ITEM_ACTUAL', payload: null });
        dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
        dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: 0 });
        dispatch({ type: 'SET_PUJAS', payload: [] });
      } else if (data.item) {
        dispatch({ type: 'SET_ITEM_ACTUAL', payload: data.item });
        dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: data.subastaActiva });
        dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: data.tiempoRestante });
      }
    });

    socket.on('start-countdown', (data: { tiempoRestante: number }) => {
      console.log('⏰ Evento start-countdown recibido:', data);
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: data.tiempoRestante });
      dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: true });
    });

    socket.on('auction-state-updated', (data: { subastaActiva: boolean; tiempoRestante: number }) => {
      console.log('📊 Evento auction-state-updated recibido:', data);
      dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: data.subastaActiva });
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: data.tiempoRestante });
    });

    socket.on('item-cleared', (data: { message: string }) => {
      console.log('🗑️ Evento item-cleared recibido:', data);
      // Limpiar el item actual y las pujas
      dispatch({ type: 'SET_ITEM_ACTUAL', payload: null });
      dispatch({ type: 'SET_PUJAS', payload: [] });
    });

    socket.on('auction-complete', (data: { message: string; winner: any; stats: any[] }) => {
      console.log('🏆 Evento auction-complete recibido:', data);
      
      // Mostrar notificación de fin de subasta completa
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'success',
          message: `🏆 ${data.message}`,
          timestamp: new Date()
        }
      });
      
      // Limpiar estado
      dispatch({ type: 'SET_ITEM_ACTUAL', payload: null });
      dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: 0 });
      dispatch({ type: 'SET_PUJAS', payload: [] });
      
      // Mostrar estadísticas finales
      console.log('📊 Estadísticas finales:', data.stats);
    });

    socket.on('auction-reset', (data: { message: string; timestamp: string }) => {
      console.log('🔄 Evento auction-reset recibido:', data);
      // Mostrar notificación de reinicio
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now().toString(),
          type: 'warning',
          message: `🔄 ${data.message}`,
          timestamp: new Date()
        }
      });
      
      // Limpiar estado de la subasta
      dispatch({ type: 'SET_ITEM_ACTUAL', payload: null });
      dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: 0 });
      dispatch({ type: 'SET_PUJAS', payload: [] });
      
      // Recargar la página después de un delay para obtener información actualizada
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    });

    // No desconectar al desmontar, mantener la conexión activa
    return () => {
      // Solo limpiar listeners si es necesario
    };
  }, []); // Solo se ejecuta una vez

  // Funciones para emitir eventos
  const joinAuction = useCallback((usuarioId: number) => {
    if (socketInstance) {
      console.log('👤 Uniendo usuario a subasta:', usuarioId);
      socketInstance.emit('join-auction', { usuarioId });
    }
  }, []);

  const placeBid = useCallback((itemId: number, monto: number) => {
    return new Promise<void>((resolve, reject) => {
      console.log('🔍 Debug placeBid:', { 
        socketInstance: !!socketInstance, 
        stateUsuario: !!state.usuario, 
        usuarioId: state.usuario?.id,
        itemId,
        monto
      });
      
      if (socketInstance && state.usuario) {
        console.log('💰 Pujando:', { itemId, monto, usuarioId: state.usuario.id });
        socketInstance.emit('place-bid', { itemId, monto, usuarioId: state.usuario.id });
        resolve();
      } else {
        const error = !socketInstance ? 'Socket no disponible' : 'Usuario no autenticado';
        console.error('❌ Error en placeBid:', error);
        reject(new Error(error));
      }
    });
  }, [state.usuario]);

  const selectItem = useCallback((itemId: number, usuarioId: number) => {
    return new Promise<void>((resolve, reject) => {
      if (socketInstance && state.usuario) {
        console.log('🎯 Seleccionando item:', itemId, 'por usuario:', state.usuario.id);
        socketInstance.emit('select-item', { itemId, usuarioId: state.usuario.id });
        resolve();
      } else {
        reject(new Error('Socket no disponible o usuario no autenticado'));
      }
    });
  }, [state.usuario]);

  const startAuction = useCallback((itemId: number) => {
    if (socketInstance) {
      console.log('🚀 Iniciando subasta para item:', itemId);
      socketInstance.emit('start-auction', { itemId });
    }
  }, []);

  const leaveAuction = useCallback(() => {
    if (socketInstance) {
      console.log('👋 Saliendo de subasta');
      socketInstance.emit('leave-auction');
    }
  }, []);

  return {
    socket: socketInstance,
    joinAuction,
    placeBid,
    selectItem,
    startAuction,
    leaveAuction,
    isConnected,
  };
}
