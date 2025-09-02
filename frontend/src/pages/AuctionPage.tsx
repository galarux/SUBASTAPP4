import { useState, useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import { useSocket } from '../hooks/useSocket';
import { pujasService, itemsService, authService, salidasService, configService } from '../services/api';
import { plantillasService } from '../services/plantillasService';
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

export function AuctionPage() {
  const { state, dispatch } = useAuction();
  const { joinAuction, placeBid, selectItem, isConnected } = useSocket();
  const [montoPuja, setMontoPuja] = useState('');
  const [montoMinimo, setMontoMinimo] = useState<number>(0);
  const [valorMinimoPuja, setValorMinimoPuja] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const { usuario, itemActual, pujas, turnoActual, tiempoRestante, subastaActiva, notifications, plantillas } = state;
  const [itemsDisponibles, setItemsDisponibles] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState<any[]>([]);
  
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
        }
      };

      cargarDatos();
    }
  }, [usuario?.id, isConnected, dispatch]);

  // Cargar items disponibles cuando es el turno del usuario
  useEffect(() => {
    const esMiTurno = usuario && turnoActual !== null && usuario.orden === turnoActual;
    const noHayItemActual = !itemActual;
    
    if (esMiTurno && noHayItemActual && !loadingItems) {
      console.log('🎯 Es mi turno y no hay item actual, cargando items disponibles...');
      cargarItemsDisponibles();
    }
  }, [usuario, turnoActual, itemActual, loadingItems]);

  // Cargar plantillas cuando cambia el usuario, turno o item actual
  useEffect(() => {
    if (usuario?.id) {
      console.log('🔄 Recargando plantillas debido a cambio en:', { usuarioId: usuario.id, turnoActual, itemActual: itemActual?.nombre });
      cargarPlantillas();
    }
  }, [usuario?.id, turnoActual, itemActual]);

  // Cargar todos los usuarios cuando cambia el turno
  useEffect(() => {
    if (usuario?.id) {
      cargarTodosLosUsuarios();
    }
  }, [usuario?.id, turnoActual]);

  // Cargar configuración al iniciar
  useEffect(() => {
    cargarConfiguracion();
  }, []);



  // Actualizar monto mínimo cuando cambia el item actual o las pujas
  useEffect(() => {
    if (itemActual) {
      const pujaActual = pujas.length > 0 ? pujas[pujas.length - 1] : null;
      const nuevoMontoMinimo = pujaActual ? pujaActual.monto + valorMinimoPuja : itemActual.precioSalida;
      setMontoMinimo(nuevoMontoMinimo);
      setMontoPuja(nuevoMontoMinimo.toString());
      console.log('💰 Monto mínimo actualizado:', nuevoMontoMinimo, '(puja actual:', pujaActual?.monto, '+ valor mínimo:', valorMinimoPuja, ')');
    } else {
      setMontoMinimo(0);
      setMontoPuja('');
    }
  }, [itemActual, pujas, valorMinimoPuja]);

  const cargarItemsDisponibles = async () => {
    setLoadingItems(true);
    try {
      console.log('📡 Cargando items disponibles...');
      const response = await itemsService.getItemsDisponibles();
      console.log('📦 Respuesta de items disponibles:', response);
      
      if (response.success && response.data) {
        console.log('✅ Items disponibles cargados:', response.data.length);
        setItemsDisponibles(response.data);
      } else {
        console.error('❌ Error al cargar items disponibles:', response.error);
        setItemsDisponibles([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar items disponibles:', error);
      setItemsDisponibles([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const cargarPlantillas = async () => {
    try {
      console.log('📡 Cargando plantillas...');
      const response = await plantillasService.getPlantillas();
      console.log('📦 Respuesta de plantillas:', response);
      
      if (response.success && response.plantillas) {
        console.log('✅ Plantillas cargadas:', response.plantillas.length);
        dispatch({ type: 'SET_PLANTILLAS', payload: response.plantillas });
      } else {
        console.error('❌ Error al cargar plantillas:', response.error);
        dispatch({ type: 'SET_PLANTILLAS', payload: [] });
      }
    } catch (error) {
      console.error('❌ Error al cargar plantillas:', error);
      dispatch({ type: 'SET_PLANTILLAS', payload: [] });
    }
  };

  const cargarTodosLosUsuarios = async () => {
    try {
      console.log('📡 Cargando todos los usuarios...');
      const response = await authService.getTurnoActual();
      console.log('📦 Respuesta de usuarios:', response);
      
      if (response.success && response.data && response.data.usuarios) {
        console.log('✅ Usuarios cargados:', response.data.usuarios.length);
        setTodosLosUsuarios(response.data.usuarios);
      } else {
        console.error('❌ Error al cargar usuarios:', response.error);
        setTodosLosUsuarios([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      setTodosLosUsuarios([]);
    }
  };

  const cargarConfiguracion = async () => {
    try {
      console.log('📡 Cargando configuración...');
      const response = await configService.getConfig('puja_minima');
      console.log('📦 Respuesta de configuración:', response);
      
      if (response.success && response.data) {
        const valorMinimo = parseInt(response.data.valor);
        setValorMinimoPuja(valorMinimo);
        console.log('✅ Valor mínimo de puja cargado:', valorMinimo);
      } else {
        console.error('❌ Error al cargar configuración:', response.error);
        setValorMinimoPuja(1); // Valor por defecto
      }
    } catch (error) {
      console.error('❌ Error al cargar configuración:', error);
      setValorMinimoPuja(1); // Valor por defecto
    }
  };

  const handlePujar = async () => {
    console.log('🔍 Debug handlePujar:', { 
      itemActual: !!itemActual, 
      usuario: !!usuario, 
      montoPuja,
      loading 
    });
    
    if (!itemActual || !usuario) {
      console.error('❌ No hay item actual o usuario no autenticado');
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          id: Date.now().toString(), 
          type: 'error', 
          message: 'Error: No hay jugador en subasta o usuario no autenticado',
          timestamp: new Date()
        } 
      });
      return;
    }
    
    const monto = parseInt(montoPuja);
    if (isNaN(monto) || monto <= 0) {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          id: Date.now().toString(), 
          type: 'error', 
          message: 'Por favor, introduce un monto válido mayor que 0',
          timestamp: new Date()
        } 
      });
      return;
    }

    // Verificar que el monto sea al menos el mínimo requerido
    if (monto < montoMinimo) {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          id: Date.now().toString(), 
          type: 'error', 
          message: `La puja debe ser al menos ${montoMinimo} créditos`,
          timestamp: new Date()
        } 
      });
      return;
    }

    // Verificar si el usuario tiene suficientes créditos
    if (monto > usuario.creditos) {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          id: Date.now().toString(), 
          type: 'error', 
          message: `No tienes suficientes créditos. Tienes ${usuario.creditos} y necesitas ${monto}`,
          timestamp: new Date()
        } 
      });
      return;
    }

    setLoading(true);
    try {
      console.log('💰 Realizando puja:', { itemId: itemActual.id, monto, usuarioId: usuario.id });
      await placeBid(itemActual.id, monto);
      setMontoPuja('');
      console.log('✅ Puja realizada exitosamente');
    } catch (error) {
      console.error('❌ Error al realizar puja:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          id: Date.now().toString(), 
          type: 'error', 
          message: `Error al realizar la puja: ${errorMessage}`,
          timestamp: new Date()
        } 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePujaRapida = () => {
    const montoActual = parseInt(montoPuja) || montoMinimo;
    const nuevoMonto = Math.max(montoActual + valorMinimoPuja, montoMinimo);
    setMontoPuja(nuevoMonto.toString());
    console.log('💰 Puja rápida: +', valorMinimoPuja, 'créditos, nuevo monto:', nuevoMonto);
  };

  const handleSalirPuja = async () => {
    if (!itemActual || !usuario) return;
    
    setLoading(true);
    try {
      console.log('🚪 Saliendo de puja:', { itemId: itemActual.id, usuarioId: usuario.id });
      await salidasService.salirDePuja(usuario.id);
    } catch (error) {
      console.error('❌ Error al salir de puja:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = async (item: Item) => {
    if (!usuario) return;
    
    setLoading(true);
    try {
      console.log('🎯 Seleccionando item:', { itemId: item.id, usuarioId: usuario.id });
      await selectItem(item.id);
      setSearchTerm('');
      setShowDropdown(false);
    } catch (error) {
      console.error('❌ Error al seleccionar item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(value.length > 0);
  };

  const filteredItems = itemsDisponibles.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.posicion && item.posicion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pujaActual = pujas.length > 0 ? pujas[pujas.length - 1] : null;
  const esMiTurno = usuario && turnoActual !== null && usuario.orden === turnoActual;
  const esMiPuja = pujaActual && pujaActual.usuarioId === usuario?.id;

  // El servidor maneja el contador centralmente, no necesitamos contador local
  useEffect(() => {
    console.log('🔍 Estado de subasta actualizado:', { subastaActiva, tiempoRestante });
  }, [subastaActiva, tiempoRestante]);

  // Escuchar eventos de actualización de monto cuando hay errores
  useEffect(() => {
    const handleUpdateBidAmount = (event: CustomEvent) => {
      if (event.detail?.montoMinimo) {
        setMontoPuja(event.detail.montoMinimo.toString());
        console.log('💰 Monto actualizado después de error:', event.detail.montoMinimo);
      }
    };

    window.addEventListener('update-bid-amount', handleUpdateBidAmount as EventListener);
    
    return () => {
      window.removeEventListener('update-bid-amount', handleUpdateBidAmount as EventListener);
    };
  }, []);

  // Función auxiliar para renderizar jugadores por posición
  const renderJugadoresPorPosicion = (jugadores: any[], posicion: string, titulo: string) => (
    <div>
      <h5 className="text-xs sm:text-sm font-semibold text-black mb-2 px-1 text-left">{titulo}</h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-2">
        {jugadores
          .filter(jugador => jugador.posicion === posicion)
          .map((jugador) => (
            <div key={jugador.id} className="bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-green-100 shadow-sm">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {jugador.fotoUrl ? (
                  <img
                    src={jugador.fotoUrl}
                    alt={jugador.nombre}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl object-cover shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs">⚽</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate leading-tight">
                    {jugador.nombre}
                  </p>
                  <div className="flex items-center space-x-1">
                    <p className="text-xs text-gray-600 truncate">
                      {jugador.equipo}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-green-700">
                    {jugador.precioAdjudicacion}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

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
                  {usuario ? usuario.nombre : ''}
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
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sección de créditos prominente */}
      {usuario && (
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-4 sm:py-6 shadow-lg">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl">💰</span>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-green-100">Tus Créditos</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {usuario.creditos.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-green-100 font-medium">créditos disponibles</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          

        </div>

        {/* Panel "Es tu turno" */}
        {esMiTurno && !itemActual && (
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-xl border border-yellow-300/20">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl">🎯</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-bold">¡Es tu turno!</h2>
                <p className="text-sm sm:text-base text-yellow-100">Selecciona un jugador para subastar</p>
              </div>
            </div>
          </div>
        )}

        {/* Barra de búsqueda */}
        {esMiTurno && !itemActual && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 p-4 sm:p-6 mb-4 sm:mb-6 relative z-[9999]">
            <div className="relative">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <span className="text-lg sm:text-xl">🔍</span>
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Selecciona un jugador
                </h2>
              </div>
              
              <div className="relative z-[9999]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Busca por nombre, equipo o posición..."
                  className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-blue-500 focus:outline-none transition-all duration-200 text-sm sm:text-base shadow-sm"
                />
                
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl shadow-xl max-h-60 overflow-y-auto z-[9999] pointer-events-auto">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectItem(item)}
                          className="w-full px-4 py-3 sm:px-6 sm:py-4 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            {item.fotoUrl ? (
                              <img
                                src={item.fotoUrl}
                                alt={item.nombre}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-purple-200 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 text-sm">⚽</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 text-sm sm:text-base">{item.nombre}</p>
                              <p className="text-gray-600 text-xs sm:text-sm">{item.equipo}</p>
                              {item.posicion && (
                                <p className="text-gray-500 text-xs">{item.posicion}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-sm sm:text-base">{item.precioSalida} créditos</p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 sm:px-6 sm:py-4 text-center text-gray-500">
                        No se encontraron jugadores
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

                {/* Información de puja mejorada */}
                <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-green-100 shadow-inner">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-green-700 font-semibold mb-1 sm:mb-2">
                      {pujaActual ? 'Puja Actual' : 'Precio de Salida'}
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                      {pujaActual ? pujaActual.monto : itemActual.precioSalida} créditos
                    </p>
                    {pujaActual && (
                      <p className="text-xs sm:text-sm text-green-600 font-medium">
                        Usuario {pujaActual.usuarioId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contador de tiempo */}
              {subastaActiva && (
                <div className="mt-3 sm:mt-4 text-center">
                  <div className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-red-400">
                    <span className="text-lg sm:text-2xl lg:text-3xl mr-2 sm:mr-3">⏰</span>
                    <span className="text-xl sm:text-3xl lg:text-4xl font-bold">{tiempoRestante}s</span>
                  </div>
                </div>
              )}

              {/* Controles de puja */}
              {subastaActiva && (
                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                  {/* Input de puja */}
                  <div className="flex items-center space-x-2 sm:space-x-3 w-full">
                    <input
                      type="number"
                      value={montoPuja}
                      onChange={(e) => setMontoPuja(e.target.value)}
                      placeholder={`Mín: ${montoMinimo}`}
                      className="w-20 sm:flex-1 px-2 py-2 sm:px-3 sm:py-2 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 text-sm sm:text-base shadow-sm"
                      min={montoMinimo}
                    />
                    <button
                      onClick={handlePujaRapida}
                      className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-semibold shadow-md transform hover:scale-105 text-sm sm:text-base"
                    >
                      +{valorMinimoPuja}
                    </button>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-2 sm:space-x-3">
                    <button
                      onClick={handlePujar}
                      disabled={loading || esMiPuja}
                      className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold shadow-md transform hover:scale-105 transition-all duration-200 text-sm sm:text-base ${
                        esMiPuja
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                      }`}
                    >
                      {loading ? 'Pujando...' : esMiPuja ? 'Tienes la puja más alta' : 'Pujar'}
                    </button>
                    
                    <button
                      onClick={handleSalirPuja}
                      disabled={loading || esMiPuja}
                      className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold shadow-md transform hover:scale-105 transition-all duration-200 text-sm sm:text-base ${
                        esMiPuja
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                      }`}
                    >
                      {loading ? 'Saliendo...' : 'Salir de la Puja'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Historial de pujas */}
        {pujas.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
              <h3 className="text-white font-bold text-lg sm:text-xl">Historial de Pujas</h3>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="space-y-2 sm:space-y-3">
                {pujas.map((puja, index) => (
                  <div key={`${puja.id}-${puja.createdAt}-${index}`} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm sm:text-base font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">
                          {puja.usuario?.nombre || `Usuario ${puja.usuarioId}`}
                        </p>
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {new Date(puja.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg sm:text-xl">{puja.monto} créditos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Panel de Turno Actual */}
        {!subastaActiva && !itemActual && turnoActual !== null && !esMiTurno && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
              <h3 className="text-white font-bold text-lg sm:text-xl">Turno Actual</h3>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              {(() => {
                const usuarioConTurno = todosLosUsuarios.find(u => u.orden === turnoActual);
                const esMiTurno = usuario && usuario.orden === turnoActual;
                
                return (
                  <div className="text-center">
                    {usuarioConTurno ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-purple-600 text-2xl sm:text-3xl">👤</span>
                        </div>
                        <div>
                          <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                            {esMiTurno ? '¡Es tu turno!' : `Turno de ${usuarioConTurno.nombre}`}
                          </h4>
                          <p className="text-gray-600 text-sm sm:text-base">
                            {esMiTurno 
                              ? 'Selecciona un jugador para subastar' 
                              : 'Esperando a que seleccione un jugador'
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <span className="text-gray-600 text-2xl sm:text-3xl">⏳</span>
                        </div>
                        <div>
                          <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                            Turno {turnoActual}
                          </h4>
                          <p className="text-gray-600 text-sm sm:text-base">
                            Cargando información del usuario...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Panel de Plantillas */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden mt-4 sm:mt-6 lg:mt-8 relative z-20">
          <div className="bg-gradient-to-r from-green-700 via-emerald-800 to-teal-900 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6">
            <h3 className="text-white font-bold text-lg sm:text-xl">Plantillas de Usuarios</h3>
          </div>
          <div className="p-3 sm:p-4 lg:p-6">
            {plantillas.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {plantillas
                  .sort((a, b) => {
                    // Mostrar primero la plantilla del usuario actual
                    if (usuario && a.usuarioId === usuario.id) return -1;
                    if (usuario && b.usuarioId === usuario.id) return 1;
                    return 0;
                  })
                  .map((plantilla) => (
                    <div key={plantilla.usuarioId} className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border shadow-sm ${
                      usuario && plantilla.usuarioId === usuario.id 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                    }`}>
                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-lg sm:text-xl font-bold ${
                            usuario && plantilla.usuarioId === usuario.id 
                              ? 'text-blue-800' 
                              : 'text-green-800'
                          }`}>
                            {plantilla.nombreUsuario}
                          </h4>
                          {usuario && plantilla.usuarioId === usuario.id && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                              TU PLANTILLA
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-xs sm:text-sm font-medium ${
                            usuario && plantilla.usuarioId === usuario.id 
                              ? 'text-blue-600' 
                              : 'text-green-600'
                          }`}>
                            Total gastado
                          </p>
                          <p className={`text-base sm:text-lg font-bold ${
                            usuario && plantilla.usuarioId === usuario.id 
                              ? 'text-blue-700' 
                              : 'text-green-700'
                          }`}>
                            {plantilla.totalCreditosGastados} créditos
                          </p>
                        </div>
                      </div>
                      
                      {plantilla.jugadores.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {renderJugadoresPorPosicion(plantilla.jugadores, 'PORTERO', 'Porteros')}
                          {renderJugadoresPorPosicion(plantilla.jugadores, 'DEFENSA', 'Defensas')}
                          {renderJugadoresPorPosicion(plantilla.jugadores, 'MEDIO', 'Medios')}
                          {renderJugadoresPorPosicion(plantilla.jugadores, 'DELANTERO', 'Delanteros')}
                        </div>
                      ) : (
                        <div className="text-center py-4 sm:py-6">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <span className="text-green-600 text-xl sm:text-2xl">⚽</span>
                          </div>
                          <p className="text-sm sm:text-base text-gray-500 font-medium">
                            Sin jugadores adjudicados
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-green-600 text-2xl sm:text-3xl">🏆</span>
                </div>
                <p className="text-base sm:text-lg text-gray-500 font-medium">
                  No hay plantillas disponibles
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Las plantillas aparecerán cuando se adjudiquen jugadores
                </p>
              </div>
            )}
          </div>
        </div>


      </div>
      
      {/* Sistema de notificaciones */}
      <NotificationContainer
        notifications={notifications}
        onRemove={(id) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })}
      />
    </div>
  );
}
