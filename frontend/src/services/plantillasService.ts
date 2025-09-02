import type { PlantillaUsuario } from '../context/AuctionContext';
import { config } from '../config/config';

const API_BASE_URL = config.API_BASE_URL;

// Cliente HTTP básico
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
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

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    };
  }
}

export const plantillasService = {
  async getPlantillas(): Promise<{ success: boolean; plantillas?: PlantillaUsuario[]; error?: string }> {
    return apiRequest<{ plantillas: PlantillaUsuario[] }>('/plantillas');
  }
};
