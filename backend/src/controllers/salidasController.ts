import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const salidasController = {
  // Marcar usuario como salido de la puja
  async salirDePuja(req: Request, res: Response) {
    try {
      const { usuarioId } = req.body;

      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          error: 'usuarioId es requerido'
        });
      }

      // Verificar que el usuario existe
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(usuarioId) }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Verificar que el usuario no haya salido ya
      if (usuario.salioDePuja) {
        return res.status(400).json({
          success: false,
          error: 'El usuario ya ha salido de la puja'
        });
      }

      // Marcar usuario como salido
      const usuarioActualizado = await prisma.usuario.update({
        where: { id: parseInt(usuarioId) },
        data: { salioDePuja: true }
      });

      console.log('👋 Usuario salió de la puja:', {
        usuario: usuarioActualizado.nombre,
        email: usuarioActualizado.email
      });

      res.json({
        success: true,
        data: {
          usuarioId: usuarioActualizado.id,
          nombre: usuarioActualizado.nombre,
          email: usuarioActualizado.email
        }
      });
    } catch (error) {
      console.error('Error al salir de puja:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Obtener usuarios que han salido de la puja
  async getUsuariosSalidos(req: Request, res: Response) {
    try {
      const usuariosSalidos = await prisma.usuario.findMany({
        where: { salioDePuja: true },
        select: { 
          id: true, 
          nombre: true, 
          email: true, 
          orden: true 
        },
        orderBy: { orden: 'asc' }
      });

      res.json({
        success: true,
        data: usuariosSalidos
      });
    } catch (error) {
      console.error('Error al obtener usuarios salidos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Verificar si un usuario ha salido de la puja
  async verificarSalida(req: Request, res: Response) {
    try {
      const { usuarioId } = req.params;

      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          error: 'usuarioId es requerido'
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(usuarioId) },
        select: { id: true, salioDePuja: true }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          haSalido: usuario.salioDePuja
        }
      });
    } catch (error) {
      console.error('Error al verificar salida:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
};
