import type { Usuario, Item, Puja } from '../context/AuctionContext';

const API_BASE_URL = 'http://192.168.18.124:3001';

// Tipos para las respuestas de la API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Cliente HTTP básico
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Error en la petición',
      };
    }

    // Si la respuesta ya tiene la estructura { success, data, error }, la devolvemos tal como está
    if (data.success !== undefined) {
      return data;
    }

    // Si no, la envolvemos en la estructura esperada
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

// Servicios de autenticación
export const authService = {
  async login(email: string): Promise<ApiResponse<Usuario>> {
    return apiRequest<Usuario>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiRequest<void>('/auth/logout', {
      method: 'POST',
    });
  },

  async getTurnoActual(): Promise<ApiResponse<{
    turnoActual: number;
    usuarios: Usuario[];
  }>> {
    return apiRequest<{
      turnoActual: number;
      usuarios: Usuario[];
    }>('/auth/turno-actual');
  },
};

// Servicios de items/jugadores
export const itemsService = {
  async getItems(): Promise<ApiResponse<Item[]>> {
    return apiRequest<Item[]>('/items');
  },

  async getItemActual(): Promise<ApiResponse<Item>> {
    return apiRequest<Item>('/items/actual');
  },

  async setItemActual(itemId: number): Promise<ApiResponse<Item>> {
    return apiRequest<Item>('/items/actual', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  },

  async iniciarSubasta(): Promise<ApiResponse<Item>> {
    return apiRequest<Item>('/items/iniciar', {
      method: 'POST',
    });
  },

  async getItemsDisponibles(): Promise<ApiResponse<Item[]>> {
    return apiRequest<Item[]>('/items/disponibles');
  },
};

// Servicios de pujas
export const pujasService = {
  async getPujas(itemId: number): Promise<ApiResponse<Puja[]>> {
    return apiRequest<Puja[]>(`/pujas/${itemId}`);
  },

  async crearPuja(itemId: number, monto: number, usuarioId: number): Promise<ApiResponse<Puja>> {
    return apiRequest<Puja>('/pujas', {
      method: 'POST',
      body: JSON.stringify({ itemId, monto, usuarioId }),
    });
  },

  async getPujaActual(itemId: number): Promise<ApiResponse<Puja>> {
    return apiRequest<Puja>(`/pujas/${itemId}/actual`);
  },
};

// Servicios de subasta
export const subastaService = {
  async getEstado(): Promise<ApiResponse<{
    subastaActiva: boolean;
    turnoActual: number;
    tiempoRestante: number;
  }>> {
    return apiRequest('/subasta/estado');
  },

  async iniciarSubasta(): Promise<ApiResponse<void>> {
    return apiRequest('/subasta/iniciar', {
      method: 'POST',
    });
  },

  async finalizarSubasta(): Promise<ApiResponse<void>> {
    return apiRequest('/subasta/finalizar', {
      method: 'POST',
    });
  },
};

// Servicios de usuarios
export const usuariosService = {
  async getUsuarios(): Promise<ApiResponse<Usuario[]>> {
    return apiRequest<Usuario[]>('/usuarios');
  },

  async getUsuario(id: number): Promise<ApiResponse<Usuario>> {
    return apiRequest<Usuario>(`/usuarios/${id}`);
  },

  async actualizarCreditos(id: number, creditos: number): Promise<ApiResponse<Usuario>> {
    return apiRequest<Usuario>(`/usuarios/${id}/creditos`, {
      method: 'PUT',
      body: JSON.stringify({ creditos }),
    });
  },
};

// Servicios de salidas
export const salidasService = {
  async salirDePuja(usuarioId: number): Promise<ApiResponse<{
    usuarioId: number;
    nombre: string;
    email: string;
  }>> {
    const response = await apiRequest<{
      usuarioId: number;
      nombre: string;
      email: string;
    }>('/salidas/salir', {
      method: 'POST',
      body: JSON.stringify({ usuarioId }),
    });
    
    // Si la operación fue exitosa, emitir evento de socket
    if (response.success) {
      // Importar socket dinámicamente para evitar dependencias circulares
      const { getSocket } = await import('../hooks/useSocket');
      const socket = getSocket();
      if (socket) {
        socket.emit('usuario-salio-de-puja', { usuarioId });
      }
    }
    
    return response;
  },

  async getUsuariosSalidos(): Promise<ApiResponse<{
    id: number;
    nombre: string;
    email: string;
    orden: number;
  }[]>> {
    return apiRequest<{
      id: number;
      nombre: string;
      email: string;
      orden: number;
    }[]>('/salidas/usuarios-salidos');
  },

  async verificarSalida(usuarioId: number): Promise<ApiResponse<{
    haSalido: boolean;
  }>> {
    return apiRequest<{
      haSalido: boolean;
    }>(`/salidas/verificar/${usuarioId}`);
  },
};

// Servicios de configuración
export const configService = {
  async getConfig(clave: string): Promise<ApiResponse<{
    clave: string;
    valor: string;
  }>> {
    return apiRequest<{
      clave: string;
      valor: string;
    }>(`/config/${clave}`);
  },

  async getAllConfigs(): Promise<ApiResponse<{
    clave: string;
    valor: string;
    descripcion?: string;
  }[]>> {
    return apiRequest<{
      clave: string;
      valor: string;
      descripcion?: string;
    }[]>('/config');
  },

  async updateConfig(clave: string, valor: string, descripcion?: string): Promise<ApiResponse<{
    message: string;
  }>> {
    return apiRequest<{
      message: string;
    }>('/config', {
      method: 'PUT',
      body: JSON.stringify({ clave, valor, descripcion }),
    });
  },

  async getPlayerStats(): Promise<ApiResponse<{
    usuarioId: number;
    nombre: string;
    jugadoresCount: number;
    maxJugadores: number;
  }[]>> {
    return apiRequest<{
      usuarioId: number;
      nombre: string;
      jugadoresCount: number;
      maxJugadores: number;
    }[]>('/config/stats/players');
  },

  async shouldAuctionEnd(): Promise<ApiResponse<{
    shouldEnd: boolean;
  }>> {
    return apiRequest<{
      shouldEnd: boolean;
    }>('/config/check/auction-end');
  },
};
