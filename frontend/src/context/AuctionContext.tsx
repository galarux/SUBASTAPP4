import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';

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
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: Date;
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
}

// Acciones
type AuctionAction =
  | { type: 'SET_USUARIO'; payload: Usuario }
  | { type: 'SET_ITEM_ACTUAL'; payload: Item }
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
    case 'LOGOUT':
      // Limpiar localStorage al hacer logout
      localStorage.removeItem('auction_user');
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
