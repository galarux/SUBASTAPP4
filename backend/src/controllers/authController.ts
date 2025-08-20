import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authController = {
  // Login simple con email
  async login(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email es requerido' 
        });
      }

      // Buscar usuario por email
      let usuario = await prisma.usuario.findUnique({
        where: { email }
      });

      // Si no existe, crear uno nuevo para pruebas
      if (!usuario) {
        usuario = await prisma.usuario.create({
          data: {
            email,
            nombre: email.split('@')[0], // Usar parte del email como nombre
            creditos: 2000,
            orden: 1 // Por defecto
          }
        });
      }

      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Logout
  async logout(req: Request, res: Response) {
    try {
      // Para una implementación simple, solo devolvemos éxito
      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  },

  // Obtener información del turno actual
  async getTurnoActual(req: Request, res: Response) {
    try {
      // Obtener todos los usuarios ordenados por su orden
      const usuarios = await prisma.usuario.findMany({
        orderBy: { orden: 'asc' },
        select: {
          id: true,
          email: true,
          nombre: true,
          orden: true,
          creditos: true
        }
      });

      // Determinar el turno actual (por ahora, el usuario con orden 1)
      const turnoActual = 1; // Esto debería venir de una configuración global

      res.json({
        success: true,
        data: {
          turnoActual,
          usuarios
        }
      });
    } catch (error) {
      console.error('Error al obtener turno actual:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
};
