import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const pujasController = {
  // Obtener pujas de un item
  async getPujas(req: Request, res: Response) {
    try {
      const { itemId } = req.params;

      if (!itemId || isNaN(parseInt(itemId))) {
        return res.status(400).json({
          success: false,
          error: 'itemId válido es requerido'
        });
      }

      const pujas = await prisma.puja.findMany({
        where: { itemId: parseInt(itemId) },
        include: {
          usuario: {
            select: { nombre: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: pujas
      });
    } catch (error) {
      console.error('Error al obtener pujas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Crear nueva puja
  async crearPuja(req: Request, res: Response) {
    try {
      const { itemId, monto, usuarioId } = req.body;

      if (!itemId || !monto || !usuarioId) {
        return res.status(400).json({
          success: false,
          error: 'itemId, monto y usuarioId son requeridos'
        });
      }

      // Verificar que el usuario existe y tiene suficientes créditos
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(usuarioId) }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      if (usuario.creditos < monto) {
        return res.status(400).json({
          success: false,
          error: 'No tienes suficientes créditos'
        });
      }

      // Verificar que el item existe y no está subastado
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

      // Obtener la puja actual más alta
      const pujaActual = await prisma.puja.findFirst({
        where: { itemId: parseInt(itemId) },
        orderBy: { monto: 'desc' }
      });

      // Verificar que la puja es mayor que la actual
      const montoMinimo = pujaActual ? pujaActual.monto + 1 : item.precioSalida;
      if (monto < montoMinimo) {
        return res.status(400).json({
          success: false,
          error: `La puja debe ser al menos ${montoMinimo} créditos`
        });
      }

      // Crear la puja
      const puja = await prisma.puja.create({
        data: {
          monto: parseInt(monto),
          itemId: parseInt(itemId),
          usuarioId: parseInt(usuarioId)
        },
        include: {
          usuario: {
            select: { nombre: true, email: true }
          }
        }
      });

      // Actualizar créditos del usuario
      await prisma.usuario.update({
        where: { id: parseInt(usuarioId) },
        data: { creditos: usuario.creditos - parseInt(monto) }
      });

      res.json({
        success: true,
        data: puja
      });
    } catch (error) {
      console.error('Error al crear puja:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Obtener puja actual de un item
  async getPujaActual(req: Request, res: Response) {
    try {
      const { itemId } = req.params;

      const puja = await prisma.puja.findFirst({
        where: { itemId: parseInt(itemId) },
        include: {
          usuario: {
            select: { nombre: true, email: true }
          }
        },
        orderBy: { monto: 'desc' }
      });

      if (!puja) {
        return res.status(404).json({
          success: false,
          error: 'No hay pujas para este item'
        });
      }

      res.json({
        success: true,
        data: puja
      });
    } catch (error) {
      console.error('Error al obtener puja actual:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
};
