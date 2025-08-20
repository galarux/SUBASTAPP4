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
      const usuario = await prisma.usuario.findUnique({
        where: { email }
      });

      // Si no existe, devolver error
      if (!usuario) {
        return res.status(401).json({
          success: false,
          error: 'Email no registrado. Contacta al administrador para registrarte.'
        });
      }

      console.log('✅ Login exitoso para usuario:', usuario.email);

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

      // Obtener el turno actual desde la base de datos
      const estadoSubasta = await prisma.estadoSubasta.findFirst({
        where: { id: 1 }
      });

      const turnoActual = estadoSubasta?.turnoActual || 1;

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
