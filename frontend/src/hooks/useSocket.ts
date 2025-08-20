import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuction } from '../context/AuctionContext';
import type { Puja, Item } from '../context/AuctionContext';

const SOCKET_URL = 'http://192.168.18.124:3001';

// Singleton para la conexión Socket.IO
let socketInstance: Socket | null = null;
let isInitialized = false;

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

    // Eventos de conexión
    socket.on('connect', () => {
      console.log('Conectado al servidor Socket.IO');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor Socket.IO');
      setIsConnected(false);
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

    socket.on('auction-ended', (data: { message: string; ganador: any; monto: number; item: any; tiempoRestante: number }) => {
      console.log('🏁 Evento auction-ended recibido:', data);
      dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: 0 });
      
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
    });

    socket.on('new-bid', (data: { puja: Puja }) => {
      console.log('💰 Evento new-bid recibido:', data);
      dispatch({ type: 'ADD_PUJA', payload: data.puja });
    });

    socket.on('bid-error', (data: { error: string }) => {
      console.log('❌ Error de puja recibido:', data);
      dispatch({ type: 'SET_ERROR', payload: data.error });
    });

    socket.on('time-update', (data: { tiempoRestante: number }) => {
      console.log('⏰ Evento time-update recibido:', data);
      dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: data.tiempoRestante });
    });

    socket.on('turn-changed', (data: { turnoActual: number }) => {
      console.log('🔄 Evento turn-changed recibido:', data);
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
    });

    socket.on('item-updated', (data: { item: Item; subastaActiva: boolean; tiempoRestante: number }) => {
      console.log('📝 Evento item-updated recibido:', data);
      
      // Si el item ya fue subastado y la subasta no está activa, limpiar el estado
      if (data.item.subastado && !data.subastaActiva) {
        console.log('🗑️ Item ya subastado, limpiando estado...');
        dispatch({ type: 'SET_ITEM_ACTUAL', payload: null });
        dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: false });
        dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: 0 });
        dispatch({ type: 'SET_PUJAS', payload: [] });
      } else {
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
      
      // Cerrar sesión después de un delay
      setTimeout(() => {
        dispatch({ type: 'LOGOUT' });
        window.location.href = '/';
      }, 3000);
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
    if (socketInstance && state.usuario) {
      console.log('💰 Pujando:', { itemId, monto, usuarioId: state.usuario.id });
      socketInstance.emit('place-bid', { itemId, monto, usuarioId: state.usuario.id });
    }
  }, [state.usuario]);

  const selectItem = useCallback((itemId: number) => {
    if (socketInstance) {
      console.log('🎯 Seleccionando item:', itemId);
      socketInstance.emit('select-item', { itemId });
    }
  }, []);

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
