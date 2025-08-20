import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/api';

// Tipos
export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  creditos: number;
  orden: number;
}

export interface Item {
  id: number;
  rapidApiId: number;
  nombre: string;
  fechaNacimiento?: Date;
  nacionalidad?: string;
  peso?: string;
  altura?: string;
  lesionado: boolean;
  fotoUrl?: string;
  equipo: string;
  posicion?: string;
  subastado: boolean;
  precioSalida: number;
}

export interface Puja {
  id: number;
  monto: number;
  itemId: number;
  usuarioId: number;
  createdAt: Date;
  usuario?: {
    nombre: string;
    email: string;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: Date;
}

export interface PlantillaUsuario {
  usuarioId: number;
  nombreUsuario: string;
  jugadores: {
    id: number;
    nombre: string;
    equipo: string;
    posicion?: string;
    fotoUrl?: string;
    precioAdjudicacion: number;
    fechaAdjudicacion: Date;
  }[];
  totalCreditosGastados: number;
}

export interface AuctionState {
  usuario: Usuario | null;
  itemActual: Item | null;
  pujas: Puja[];
  turnoActual: number;
  tiempoRestante: number;
  subastaActiva: boolean;
  loading: boolean;
  error: string | null;
  notifications: Notification[];
  plantillas: PlantillaUsuario[];
}

// Acciones
type AuctionAction =
  | { type: 'SET_USUARIO'; payload: Usuario }
  | { type: 'UPDATE_CREDITOS'; payload: number }
  | { type: 'SET_ITEM_ACTUAL'; payload: Item | null }
  | { type: 'SET_PUJAS'; payload: Puja[] }
  | { type: 'ADD_PUJA'; payload: Puja }
  | { type: 'SET_TURNO'; payload: number }
  | { type: 'SET_TIEMPO_RESTANTE'; payload: number }
  | { type: 'SET_SUBASTA_ACTIVA'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_PLANTILLAS'; payload: PlantillaUsuario[] }
  | { type: 'LOGOUT' };

// Función para obtener estado inicial desde localStorage
const getInitialState = (): AuctionState => {
  try {
    const savedUser = localStorage.getItem('auction_user');
    if (savedUser) {
      const usuario = JSON.parse(savedUser);
      return {
        usuario,
        itemActual: null,
        pujas: [],
        turnoActual: 1,
        tiempoRestante: 30,
        subastaActiva: false,
        loading: false,
        error: null,
        notifications: [],
        plantillas: [],
      };
    }
  } catch (error) {
    console.error('Error al cargar usuario desde localStorage:', error);
  }
  
  return {
    usuario: null,
    itemActual: null,
    pujas: [],
    turnoActual: 1,
    tiempoRestante: 30,
    subastaActiva: false,
    loading: false,
    error: null,
    notifications: [],
    plantillas: [],
  };
};

const initialState: AuctionState = getInitialState();

// Reducer
function auctionReducer(state: AuctionState, action: AuctionAction): AuctionState {
  switch (action.type) {
    case 'SET_USUARIO':
      console.log('👤 Estableciendo usuario en contexto:', action.payload);
      // Guardar usuario en localStorage
      localStorage.setItem('auction_user', JSON.stringify(action.payload));
      return { ...state, usuario: action.payload, error: null };
    case 'UPDATE_CREDITOS':
      if (state.usuario) {
        const usuarioActualizado = { ...state.usuario, creditos: action.payload };
        // Actualizar localStorage
        localStorage.setItem('auction_user', JSON.stringify(usuarioActualizado));
        return { ...state, usuario: usuarioActualizado };
      }
      return state;
    case 'SET_ITEM_ACTUAL':
      return { ...state, itemActual: action.payload };
    case 'SET_PUJAS':
      return { ...state, pujas: action.payload };
    case 'ADD_PUJA':
      return { 
        ...state, 
        pujas: [...state.pujas, action.payload]
      };
    case 'SET_TURNO':
      console.log('🔄 Reducer SET_TURNO: cambiando de', state.turnoActual, 'a', action.payload);
      return { ...state, turnoActual: action.payload };
    case 'SET_TIEMPO_RESTANTE':
      return { ...state, tiempoRestante: action.payload };
    case 'SET_SUBASTA_ACTIVA':
      return { ...state, subastaActiva: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    case 'SET_PLANTILLAS':
      return {
        ...state,
        plantillas: action.payload,
      };
    case 'LOGOUT':
      // Limpiar localStorage al hacer logout
      localStorage.removeItem('auction_user');
      // También llamar al servicio de logout del backend
      authService.logout().catch(error => {
        console.error('Error al hacer logout en el backend:', error);
      });
      return { ...initialState };
    default:
      return state;
  }
}

// Contexto
const AuctionContext = createContext<{
  state: AuctionState;
  dispatch: React.Dispatch<AuctionAction>;
} | null>(null);

// Provider
export function AuctionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(auctionReducer, initialState);

  return (
    <AuctionContext.Provider value={{ state, dispatch }}>
      {children}
    </AuctionContext.Provider>
  );
}

// Hook personalizado
export function useAuction() {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction debe usarse dentro de AuctionProvider');
  }
  return context;
}
