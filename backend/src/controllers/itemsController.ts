import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const itemsController = {
  // Obtener todos los items
  async getItems(req: Request, res: Response) {
    try {
      const items = await prisma.item.findMany({
        orderBy: { nombre: 'asc' }
      });

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error al obtener items:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Obtener item actual en subasta
  async getItemActual(req: Request, res: Response) {
    try {
      console.log('🔍 Buscando estado actual de subasta...');
      
      // Buscar el estado actual de la subasta
      const estadoSubasta = await prisma.estadoSubasta.findFirst({
        include: {
          itemActual: true
        }
      });

      console.log('📊 Estado encontrado:', estadoSubasta);

      if (!estadoSubasta || !estadoSubasta.itemActual) {
        console.log('ℹ️ No hay estado de subasta o item actual');
        res.json({
          success: false,
          error: 'No hay item seleccionado para subasta'
        });
        return;
      }

      const responseData = {
        ...estadoSubasta.itemActual,
        subastaActiva: estadoSubasta.subastaActiva,
        tiempoRestante: estadoSubasta.tiempoRestante
      };

      console.log('✅ Enviando item actual:', responseData);

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('❌ Error al obtener item actual:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Seleccionar item para subasta y activar automáticamente
  async setItemActual(req: Request, res: Response) {
    try {
      const { itemId } = req.body;

      if (!itemId) {
        return res.status(400).json({
          success: false,
          error: 'ID del item es requerido'
        });
      }

      const item = await prisma.item.findUnique({
        where: { id: parseInt(itemId) }
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item no encontrado'
        });
      }

      if (item.subastado) {
        return res.status(400).json({
          success: false,
          error: 'El item ya ha sido subastado'
        });
      }

      // Crear o actualizar el estado de la subasta y activarla automáticamente
      const estadoSubasta = await prisma.estadoSubasta.upsert({
        where: { id: 1 }, // Siempre usar ID 1 para el estado actual
        update: {
          itemActualId: parseInt(itemId),
          subastaActiva: true, // Activar automáticamente
          tiempoRestante: 30
        },
        create: {
          id: 1,
          itemActualId: parseInt(itemId),
          subastaActiva: true, // Activar automáticamente
          tiempoRestante: 30
        },
        include: {
          itemActual: true
        }
      });

      // Obtener el primer usuario disponible para puja inicial
      const primerUsuario = await prisma.usuario.findFirst({
        orderBy: { id: 'asc' }
      });

      if (!primerUsuario) {
        return res.status(500).json({
          success: false,
          error: 'No hay usuarios disponibles para crear puja inicial'
        });
      }

      // Crear puja inicial automática
      const pujaInicial = await prisma.puja.create({
        data: {
          itemId: parseInt(itemId),
          monto: item.precioSalida,
          usuarioId: primerUsuario.id // Usar el primer usuario disponible
        }
      });

      res.json({
        success: true,
        data: {
          ...estadoSubasta.itemActual,
          subastaActiva: true,
          tiempoRestante: estadoSubasta.tiempoRestante,
          pujaInicial: pujaInicial
        }
      });
    } catch (error) {
      console.error('Error al establecer item actual:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Iniciar subasta (activar la subasta seleccionada)
  async iniciarSubasta(req: Request, res: Response) {
    try {
      // Obtener el estado actual
      const estadoActual = await prisma.estadoSubasta.findFirst({
        where: { id: 1 },
        include: {
          itemActual: true
        }
      });

      if (!estadoActual || !estadoActual.itemActual) {
        return res.status(400).json({
          success: false,
          error: 'No hay item seleccionado para iniciar la subasta'
        });
      }

      if (estadoActual.subastaActiva) {
        return res.status(400).json({
          success: false,
          error: 'La subasta ya está activa'
        });
      }

      // Activar la subasta
      const estadoSubasta = await prisma.estadoSubasta.update({
        where: { id: 1 },
        data: {
          subastaActiva: true,
          tiempoRestante: 30
        },
        include: {
          itemActual: true
        }
      });

      // Obtener el primer usuario disponible para puja inicial
      const primerUsuario = await prisma.usuario.findFirst({
        orderBy: { id: 'asc' }
      });

      if (!primerUsuario) {
        return res.status(500).json({
          success: false,
          error: 'No hay usuarios disponibles para crear puja inicial'
        });
      }

      // Crear puja inicial automática
      const pujaInicial = await prisma.puja.create({
        data: {
          itemId: estadoActual.itemActual.id,
          monto: estadoActual.itemActual.precioSalida,
          usuarioId: primerUsuario.id // Usar el primer usuario disponible
        }
      });

      res.json({
        success: true,
        data: {
          ...estadoSubasta.itemActual,
          subastaActiva: true,
          tiempoRestante: estadoSubasta.tiempoRestante,
          pujaInicial: pujaInicial
        }
      });
    } catch (error) {
      console.error('Error al iniciar subasta:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Obtener items disponibles (no subastados)
  async getItemsDisponibles(req: Request, res: Response) {
    try {
      const items = await prisma.item.findMany({
        where: { subastado: false },
        orderBy: { nombre: 'asc' }
      });

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Error al obtener items disponibles:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Crear item de prueba (para desarrollo)
  async crearItemPrueba(req: Request, res: Response) {
    try {
      const { nombre, equipo, posicion } = req.body;

      const item = await prisma.item.create({
        data: {
          rapidApiId: Math.floor(Math.random() * 10000),
          nombre: nombre || 'Jugador de Prueba',
          equipo: equipo || 'Equipo de Prueba',
          posicion: posicion || 'MEDIO',
          precioSalida: 5,
          subastado: false
        }
      });

      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Error al crear item de prueba:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
};
