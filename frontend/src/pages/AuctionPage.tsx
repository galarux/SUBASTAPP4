import { useState, useEffect, useRef } from 'react';
import { useAuction } from '../context/AuctionContext';
import { useSocket } from '../hooks/useSocket';
import { pujasService, itemsService, authService, salidasService } from '../services/api';
import { NotificationContainer } from '../components/NotificationToast';

// Tipos
interface Item {
  id: number;
  nombre: string;
  equipo: string;
  posicion?: string;
  nacionalidad?: string;
  precioSalida: number;
  fotoUrl?: string;
  subastado: boolean;
}

interface Puja {
  id: number;
  monto: number;
  itemId: number;
  usuarioId: number;
  createdAt: string;
}

export function AuctionPage() {
  const { state, dispatch } = useAuction();
  const { joinAuction, placeBid, startAuction, selectItem, isConnected } = useSocket();
  const [montoPuja, setMontoPuja] = useState('');
  const [loading, setLoading] = useState(false);

  const { usuario, itemActual, pujas, turnoActual, tiempoRestante, subastaActiva, notifications } = state;
  const [itemsDisponibles, setItemsDisponibles] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Debug: mostrar estado actual (solo cuando cambia)
  useEffect(() => {
    console.log('🎯 Estado actual:', { 
      usuario: usuario?.email, 
      itemActual: itemActual?.nombre, 
      pujas: pujas.length, 
      turnoActual, 
      subastaActiva,
      esMiTurno: usuario && usuario.orden === turnoActual
    });
  }, [usuario, itemActual, pujas.length, turnoActual, subastaActiva]);

  // Unirse a la subasta cuando el usuario se conecta
  useEffect(() => {
    if (usuario?.id && isConnected) {
      console.log('👤 Usuario válido, uniéndose a subasta:', usuario.id);
      joinAuction(usuario.id);
    }
  }, [usuario?.id, isConnected, joinAuction]);

  // Cargar item actual, pujas y turno actual cuando el usuario se conecta
  useEffect(() => {
    if (usuario?.id && isConnected) {
      const cargarDatos = async () => {
        console.log('🔄 Cargando datos para usuario:', usuario.id);
        try {
          // Cargar turno actual
          console.log('📡 Llamando a getTurnoActual...');
          const turnoResponse = await authService.getTurnoActual();
          console.log('📦 Respuesta de turno actual:', turnoResponse);
          
          if (turnoResponse.success && turnoResponse.data) {
            console.log('✅ Turno actual cargado:', turnoResponse.data.turnoActual);
            dispatch({ type: 'SET_TURNO', payload: turnoResponse.data.turnoActual });
          }

          // Cargar item actual
          console.log('📡 Llamando a getItemActual...');
          const itemResponse = await itemsService.getItemActual();
          console.log('📦 Respuesta de item actual:', itemResponse);
          
          if (itemResponse.success && itemResponse.data) {
            console.log('✅ Item actual cargado:', itemResponse.data);
            dispatch({ type: 'SET_ITEM_ACTUAL', payload: itemResponse.data });
            
            // Cargar pujas del item actual
            console.log('📡 Llamando a getPujas...');
            const pujasResponse = await pujasService.getPujas(itemResponse.data.id);
            console.log('📦 Respuesta de pujas:', pujasResponse);
            
            if (pujasResponse.success) {
              console.log('✅ Pujas cargadas:', pujasResponse.data);
              dispatch({ type: 'SET_PUJAS', payload: pujasResponse.data || [] });
            }
          } else {
            console.log('ℹ️ No hay item actual seleccionado:', itemResponse.error);
            // Limpiar item actual y pujas si no hay item seleccionado
            dispatch({ type: 'SET_ITEM_ACTUAL', payload: null as any });
            dispatch({ type: 'SET_PUJAS', payload: [] });
          }
        } catch (error) {
          console.error('❌ Error al cargar datos:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Error al cargar los datos' });
        }
      };

      cargarDatos();
    }
  }, [usuario?.id, isConnected, dispatch]);

  const handlePujar = async () => {
    if (!itemActual || !usuario) return;

    const monto = parseInt(montoPuja);
    if (isNaN(monto) || monto <= 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Monto inválido' });
      return;
    }

    // Obtener la puja actual más alta
    const pujaActual = pujas.length > 0 ? pujas[pujas.length - 1].monto : itemActual.precioSalida;
    const valorMinimo = 5; // Valor mínimo por defecto
    const montoMinimo = pujaActual + valorMinimo;
    
    // Validar que la puja sea mayor o igual al monto mínimo
    if (monto < montoMinimo) {
      dispatch({ type: 'SET_ERROR', payload: `La puja debe ser al menos ${montoMinimo} créditos` });
      return;
    }

    if (monto > usuario.creditos) {
      dispatch({ type: 'SET_ERROR', payload: 'No tienes suficientes créditos' });
      return;
    }

    setLoading(true);
    try {
      // Usar solo Socket.IO para la puja
      placeBid(itemActual.id, monto);
      setMontoPuja('');
      // El servidor manejará el reseteo del contador automáticamente
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  const handlePujaRapida = () => {
    if (!itemActual) return;
    
    const pujaActual = pujas.length > 0 ? pujas[pujas.length - 1].monto : itemActual.precioSalida;
    const valorMinimo = 5; // Valor mínimo por defecto
    const nuevoMonto = pujaActual + valorMinimo;
    setMontoPuja(nuevoMonto.toString());
  };

  const handleSalirDePuja = async () => {
    if (!usuario || !subastaActiva) return;

    // No permitir salir si el usuario tiene la puja más alta
    if (pujaActual && pujaActual.usuarioId === usuario.id) {
      dispatch({ type: 'SET_ERROR', payload: 'No puedes salir si tienes la puja más alta' });
      return;
    }

    setLoading(true);
    try {
      const response = await salidasService.salirDePuja(usuario.id);
      if (response.success) {
        console.log('👋 Usuario salió de la puja:', response.data);
        dispatch({ 
          type: 'ADD_NOTIFICATION', 
          payload: {
            id: Date.now().toString(),
            type: 'success',
            message: `Has salido de la puja de ${itemActual?.nombre}`,
            timestamp: new Date()
          }
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Error al salir de la puja' });
      }
    } catch (error) {
      console.error('❌ Error al salir de puja:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión al salir de la puja' });
    } finally {
      setLoading(false);
    }
  };

  const pujaActual = pujas.length > 0 ? pujas[pujas.length - 1] : null;
  const esMiTurno = usuario && usuario.orden === turnoActual;

  // Cargar items disponibles cuando es mi turno
  useEffect(() => {
    if (esMiTurno && !itemActual) {
      const cargarItemsDisponibles = async () => {
        setLoadingItems(true);
        try {
          const response = await itemsService.getItemsDisponibles();
          if (response.success) {
            setItemsDisponibles(response.data || []);
          }
        } catch (error) {
          console.error('Error al cargar items disponibles:', error);
        } finally {
          setLoadingItems(false);
        }
      };

      cargarItemsDisponibles();
    }
  }, [esMiTurno, itemActual]);

  // Filtrar items basado en el término de búsqueda
  const filteredItems = itemsDisponibles.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.posicion && item.posicion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSeleccionarJugador = async (itemId: number) => {
    try {
      const response = await itemsService.setItemActual(itemId);
      if (response.success && response.data) {
        console.log('🎯 Jugador seleccionado, activando subasta...');
        
        // Activar la subasta inmediatamente
        dispatch({ type: 'SET_ITEM_ACTUAL', payload: response.data });
        dispatch({ type: 'SET_SUBASTA_ACTIVA', payload: true });
        dispatch({ type: 'SET_TIEMPO_RESTANTE', payload: 30 });
        
        setItemsDisponibles([]);
        setSearchTerm('');
        setShowDropdown(false);
        
        // Emitir evento de socket para notificar a otros usuarios
        selectItem(itemId);
        
        // El servidor manejará el contador automáticamente
        console.log('🚀 Subasta iniciada, el servidor manejará el contador');
      }
    } catch (error) {
      console.error('Error al seleccionar jugador:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al seleccionar jugador' });
    }
  };



  // El contador ahora se maneja centralmente en el servidor

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
  };

  const handleSearchFocus = () => {
    if (searchTerm.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    // Pequeño delay para permitir que el clic en el dropdown funcione
    setTimeout(() => setShowDropdown(false), 200);
  };

  // Ya no necesitamos limpiar intervalos locales

  // Debug: mostrar tiempo restante (solo cuando cambia significativamente)
  useEffect(() => {
    if (tiempoRestante % 5 === 0 || tiempoRestante <= 10) {
      console.log('⏰ Tiempo restante:', tiempoRestante);
    }
  }, [tiempoRestante]);

  // Actualizar valor sugerido cuando hay nuevas pujas o cuando se inicia una subasta
  useEffect(() => {
    if (itemActual) {
      const pujaActual = pujas.length > 0 ? pujas[pujas.length - 1].monto : itemActual.precioSalida;
      const valorMinimo = 5; // Valor mínimo por defecto
      const nuevoMonto = pujaActual + valorMinimo;
      
      // Actualizar el valor sugerido
      setMontoPuja(nuevoMonto.toString());
    }
  }, [pujas, itemActual]);

  // El servidor maneja el contador centralmente, no necesitamos contador local
  useEffect(() => {
    console.log('🔍 Estado de subasta actualizado:', { subastaActiva, tiempoRestante });
  }, [subastaActiva, tiempoRestante]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header moderno con glassmorphism */}
      <header className="bg-white/90 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-2 sm:py-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md transform hover:scale-105 transition-transform">
                <span className="text-white text-lg sm:text-xl font-bold">🏆</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Subasta App
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {usuario ? `${usuario.nombre} • ${usuario.creditos} créditos` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="text-right">
                <p className="text-xs text-gray-600 font-medium">Turno</p>
                <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {turnoActual}
                </p>
              </div>
              <button
                onClick={() => dispatch({ type: 'LOGOUT' })}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-md transform hover:scale-105"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

             <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
         {/* Estado de conexión y debug */}
         <div className="mb-4 sm:mb-6 flex justify-center space-x-2 sm:space-x-3">
           <div className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-md ${
             isConnected 
               ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
               : 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
           }`}>
             <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 ${
               isConnected ? 'bg-white animate-pulse' : 'bg-white'
             }`}></div>
             {isConnected ? 'Conectado' : 'Desconectado'}
           </div>
           
           {/* Debug info */}
           <div className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-100 rounded-lg text-xs text-gray-700">
             <span className="mr-1 sm:mr-2">Debug:</span>
             <span className="mr-1 sm:mr-2">S: {subastaActiva ? '✅' : '❌'}</span>
             <span className="mr-1 sm:mr-2">T: {tiempoRestante}s</span>
             <span>I: {itemActual ? '✅' : '❌'}</span>
           </div>
         </div>

                 {/* Jugador en subasta */}
         {itemActual ? (
           <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden mb-4 sm:mb-6 transform hover:scale-[1.01] transition-transform duration-300">
             {/* Header del jugador con gradiente mejorado */}
             <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"></div>
               <div className="relative flex items-center justify-between">
                 <h2 className="text-white text-lg sm:text-xl font-bold">Jugador en Subasta</h2>
                 {subastaActiva && (
                   <div className="text-right">
                     <p className="text-blue-100 text-xs sm:text-sm font-medium">Estado</p>
                     <p className="text-white text-base sm:text-lg font-bold">Activa</p>
                   </div>
                 )}
               </div>
             </div>

                         <div className="p-4 sm:p-6 lg:p-8">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                 {/* Información del jugador mejorada */}
                 <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
                   {itemActual.fotoUrl ? (
                     <img
                       src={itemActual.fotoUrl}
                       alt={itemActual.nombre}
                       className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl object-cover shadow-lg border-2 sm:border-4 border-white"
                     />
                   ) : (
                     <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg border-2 sm:border-4 border-white">
                       <span className="text-blue-600 text-xl sm:text-2xl lg:text-3xl">👤</span>
                     </div>
                   )}
                   <div>
                     <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                       {itemActual.nombre}
                     </h3>
                     <p className="text-gray-700 font-semibold text-sm sm:text-base lg:text-lg mb-1">{itemActual.equipo}</p>
                     {itemActual.posicion && (
                       <p className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full inline-block">
                         {itemActual.posicion}
                       </p>
                     )}
                   </div>
                 </div>

                                 {/* Información de puja y contador mejorada */}
                 <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                   {/* Puja actual */}
                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-blue-100">
                     <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 font-medium">Puja actual</p>
                     <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                       {pujaActual ? pujaActual.monto : itemActual.precioSalida} créditos
                     </p>
                     {pujaActual && (
                       <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                         Por: <span className="font-semibold text-blue-600">Usuario {pujaActual.usuarioId}</span>
                       </p>
                     )}
                   </div>

                   {/* Cuenta atrás mejorada */}
                   {subastaActiva && (
                     <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-2 border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 text-center shadow-lg">
                       <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-medium">Tiempo restante</p>
                       <p className={`text-3xl sm:text-4xl font-bold ${
                         tiempoRestante <= 10 ? 'text-red-600 animate-pulse' : 
                         tiempoRestante <= 20 ? 'text-orange-600' : 'text-green-600'
                       }`}>
                         {tiempoRestante}s
                       </p>
                       {tiempoRestante <= 10 && (
                         <p className="text-xs sm:text-sm text-red-600 mt-1 sm:mt-2 font-bold">¡Últimos segundos!</p>
                       )}
                     </div>
                   )}

                                     {/* Sistema de pujas mejorado */}
                   {subastaActiva && usuario && pujaActual?.usuarioId !== usuario.id && (
                     <div className="space-y-3 sm:space-y-4">
                       {/* Información del monto mínimo */}
                       <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg sm:rounded-xl p-2 sm:p-3">
                         <p className="text-xs sm:text-sm text-yellow-800 font-medium">
                           💡 Puja mínima: <span className="font-bold">
                           {pujaActual ? pujaActual.monto + 5 : itemActual.precioSalida} créditos</span>
                         </p>
                       </div>
                       
                       <div className="flex space-x-2 sm:space-x-3">
                         <input
                           type="number"
                           value={montoPuja}
                           onChange={(e) => setMontoPuja(e.target.value)}
                           placeholder="Monto"
                           className="flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm sm:text-base lg:text-lg font-medium shadow-sm transition-all duration-200"
                           min={pujaActual ? pujaActual.monto + 5 : itemActual.precioSalida}
                           max={usuario.creditos}
                         />
                         <button
                           onClick={handlePujaRapida}
                           className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg sm:rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-bold text-sm sm:text-base lg:text-lg shadow-md transform hover:scale-105"
                           title="Puja rápida: puja actual + 5 créditos"
                         >
                           +5
                         </button>
                       </div>
                       <div className="flex space-x-2 sm:space-x-3">
                         <button
                           onClick={handlePujar}
                           disabled={loading || !montoPuja}
                           className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-lg sm:rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-sm sm:text-base lg:text-lg shadow-md transform hover:scale-105"
                         >
                           {loading ? 'Pujando...' : 'Pujar'}
                         </button>
                         <button
                           onClick={handleSalirDePuja}
                           disabled={loading || !subastaActiva || (pujaActual && pujaActual.usuarioId === usuario.id) || false}
                           className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-lg sm:rounded-xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-sm sm:text-base lg:text-lg shadow-md transform hover:scale-105"
                           title={pujaActual && pujaActual.usuarioId === usuario.id ? "No puedes salir si tienes la puja más alta" : "Salir de la puja actual"}
                         >
                           Salir
                         </button>
                       </div>
                     </div>
                   )}
                  
                                     {/* Mensaje cuando el usuario actual tiene la puja más alta */}
                   {subastaActiva && usuario && pujaActual?.usuarioId === usuario.id && (
                     <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg">
                       <div className="flex items-center">
                         <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
                           <span className="text-white text-lg sm:text-xl lg:text-2xl">🏆</span>
                         </div>
                         <div>
                           <p className="text-sm sm:text-base lg:text-lg font-bold text-green-800">
                             ¡Tienes la puja más alta!
                           </p>
                           <p className="text-xs sm:text-sm text-green-700">
                             Espera a que otros pujen o termine el tiempo
                           </p>
                         </div>
                       </div>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Selección de jugador */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Selección de jugador */}
             {esMiTurno && !itemActual && itemsDisponibles.length > 0 ? (
               <div className="p-4 sm:p-6">
                 <div className="text-center mb-4 sm:mb-6">
                   <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg transform hover:scale-105 transition-transform">
                     <span className="text-white text-sm sm:text-base lg:text-lg">🎯</span>
                   </div>
                   <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                     Selecciona un jugador
                   </h2>
                   <p className="text-sm sm:text-base text-gray-600">Busca y selecciona el próximo jugador para subastar</p>
                 </div>
                 
                 {loadingItems ? (
                   <div className="text-center py-8 sm:py-12">
                     <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-3 sm:mb-4"></div>
                     <p className="text-sm sm:text-base text-gray-600 font-medium">Cargando jugadores...</p>
                   </div>
                 ) : (
                   <div className="relative">
                     {/* Barra de búsqueda mejorada */}
                     <div className="relative mb-4 sm:mb-6">
                       <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-6">
                         <svg className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                         </svg>
                       </div>
                       <input
                         type="text"
                         value={searchTerm}
                         onChange={handleSearchChange}
                         onFocus={handleSearchFocus}
                         onBlur={handleSearchBlur}
                         placeholder="Buscar jugador por nombre, equipo o posición..."
                         className="w-full px-3 sm:px-6 py-2 sm:py-4 pl-10 sm:pl-16 bg-white border-2 border-gray-200 rounded-lg sm:rounded-2xl focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-sm sm:text-base lg:text-lg font-medium shadow-sm transition-all duration-200 hover:border-gray-300"
                       />
                     </div>

                     {/* Estado inicial - mostrar cuando no hay búsqueda */}
                     {!showDropdown && (
                       <div className="text-center py-4 sm:py-6">
                         <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-2">
                           <span className="text-blue-600 text-sm sm:text-lg">🔍</span>
                         </div>
                         <p className="text-xs sm:text-sm text-gray-500">Escribe para buscar jugadores</p>
                       </div>
                     )}

                     {/* Lista de jugadores - solo mostrar cuando hay búsqueda */}
                     {showDropdown && filteredItems.length > 0 && (
                       <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                         {filteredItems.map((item) => (
                           <div
                             key={item.id}
                             className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50 rounded-lg sm:rounded-2xl cursor-pointer transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md transform hover:scale-[1.01]"
                             onClick={() => handleSeleccionarJugador(item.id)}
                           >
                             <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                               <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                                 <span className="text-blue-600 text-sm sm:text-lg lg:text-xl">⚽</span>
                               </div>
                               <div>
                                 <div className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">{item.nombre}</div>
                                 <div className="text-xs sm:text-sm text-gray-600 font-medium">
                                   {item.posicion && `${item.posicion} • `}{item.equipo}
                                 </div>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                 {item.precioSalida} créditos
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}

                     {/* Mensaje cuando no hay resultados */}
                     {showDropdown && searchTerm.length > 0 && filteredItems.length === 0 && (
                       <div className="text-center py-12">
                         <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                           <span className="text-gray-400 text-2xl">🔍</span>
                         </div>
                         <p className="text-gray-500 font-medium">No se encontraron jugadores</p>
                         <p className="text-sm text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             ) : (
               <div className="p-8 text-center">
                 <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                   <span className="text-gray-500 text-3xl">⚽</span>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">
                   {esMiTurno 
                     ? 'No hay jugadores disponibles' 
                     : 'No hay ningún jugador en subasta'
                   }
                 </h3>
                 {esMiTurno && (
                   <p className="text-gray-500">
                     Espera a que haya jugadores disponibles
                   </p>
                 )}
               </div>
             )}
          </div>
        )}

                 {/* Historial de pujas mejorado */}
         {pujas.length > 0 && (
           <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden mt-4 sm:mt-6 lg:mt-8">
             <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
               <h3 className="text-white font-bold text-lg sm:text-xl">Historial de Pujas</h3>
             </div>
             <div className="p-3 sm:p-4 lg:p-6">
               <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                 {pujas.map((puja) => (
                   <div key={puja.id} className="flex justify-between items-center py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-2xl border border-gray-100 shadow-sm">
                     <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                       <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                         <span className="text-white text-xs sm:text-sm font-bold">U{puja.usuarioId}</span>
                       </div>
                       <span className="text-xs sm:text-sm text-gray-600 font-medium">
                         {new Date(puja.createdAt).toLocaleTimeString()}
                       </span>
                     </div>
                     <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                       {puja.monto} créditos
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         )}

                 {/* Información del turno mejorada */}
         {esMiTurno && !itemActual && !subastaActiva && (
           <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-200 rounded-2xl sm:rounded-3xl p-2 sm:p-3 lg:p-4 mt-4 sm:mt-6 lg:mt-8 shadow-xl">
             <div className="flex items-center justify-center">
               <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3 sm:mr-4 lg:mr-6 shadow-xl">
                 <span className="text-white text-lg sm:text-xl lg:text-2xl">🎯</span>
               </div>
               <div>
                 <h3 className="text-base sm:text-lg lg:text-xl font-bold text-yellow-800 mb-0.5 sm:mb-1">
                   ¡Es tu turno!
                 </h3>
                 <p className="text-xs sm:text-sm lg:text-base text-yellow-700">
                   Selecciona el próximo jugador para subastar
                 </p>
               </div>
             </div>
           </div>
         )}
      </div>
      
      {/* Sistema de notificaciones */}
      <NotificationContainer
        notifications={notifications}
        onRemove={(id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })}
      />
    </div>
  );
}
