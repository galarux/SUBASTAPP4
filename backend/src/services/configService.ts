import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Configuracion {
  clave: string;
  valor: string;
  descripcion?: string;
}

export class ConfigService {
  // Obtener una configuración específica
  static async getConfig(clave: string): Promise<string | null> {
    try {
      const config = await prisma.configuracion.findUnique({
        where: { clave }
      });
      return config?.valor || null;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      return null;
    }
  }

  // Obtener configuración como número
  static async getConfigAsNumber(clave: string, defaultValue: number = 0): Promise<number> {
    const valor = await this.getConfig(clave);
    if (valor === null) return defaultValue;
    const num = parseInt(valor);
    return isNaN(num) ? defaultValue : num;
  }

  // Obtener configuración como boolean
  static async getConfigAsBoolean(clave: string, defaultValue: boolean = false): Promise<boolean> {
    const valor = await this.getConfig(clave);
    if (valor === null) return defaultValue;
    return valor.toLowerCase() === 'true';
  }

  // Actualizar configuración
  static async updateConfig(clave: string, valor: string, descripcion?: string): Promise<boolean> {
    try {
      await prisma.configuracion.upsert({
        where: { clave },
        update: { valor, descripcion },
        create: { clave, valor, descripcion }
      });
      return true;
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      return false;
    }
  }

  // Obtener todas las configuraciones
  static async getAllConfigs(): Promise<Configuracion[]> {
    try {
      const configs = await prisma.configuracion.findMany({
        orderBy: { clave: 'asc' }
      });
      
      // Convertir null a undefined para compatibilidad con TypeScript
      return configs.map(config => ({
        ...config,
        descripcion: config.descripcion ?? undefined
      }));
    } catch (error) {
      console.error('Error al obtener configuraciones:', error);
      return [];
    }
  }

  // Verificar si la subasta debe terminar
  static async shouldAuctionEnd(): Promise<boolean> {
    try {
      const jugadoresPorEquipo = await this.getConfigAsNumber('jugadores_por_equipo', 25);
      
      // Contar cuántos jugadores ha ganado cada usuario
      const usuariosConJugadores = await prisma.usuario.findMany({
        include: {
          itemsGanados: {
            where: { subastado: true }
          }
        }
      });

      // Verificar si algún usuario ya tiene el número máximo de jugadores
      for (const usuario of usuariosConJugadores) {
        if (usuario.itemsGanados.length >= jugadoresPorEquipo) {
          console.log(`🏁 Usuario ${usuario.nombre} ya tiene ${usuario.itemsGanados.length} jugadores (máximo: ${jugadoresPorEquipo})`);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error al verificar si debe terminar la subasta:', error);
      return false;
    }
  }

  // Obtener estadísticas de jugadores por usuario
  static async getPlayerStats(): Promise<Array<{usuarioId: number, nombre: string, jugadoresCount: number, maxJugadores: number}>> {
    try {
      const jugadoresPorEquipo = await this.getConfigAsNumber('jugadores_por_equipo', 25);
      
      const usuariosConJugadores = await prisma.usuario.findMany({
        include: {
          itemsGanados: {
            where: { subastado: true }
          }
        }
      });

      return usuariosConJugadores.map(usuario => ({
        usuarioId: usuario.id,
        nombre: usuario.nombre,
        jugadoresCount: usuario.itemsGanados.length,
        maxJugadores: jugadoresPorEquipo
      }));
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return [];
    }
  }
}



