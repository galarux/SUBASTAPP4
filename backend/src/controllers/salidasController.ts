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

      // Obtener el estado actual de la subasta
      const estadoSubasta = await prisma.estadoSubasta.findFirst({
        where: { id: 1 },
        include: {
          itemActual: true
        }
      });

      // Verificar que el usuario no sea el que tiene la puja más alta
      if (estadoSubasta && estadoSubasta.subastaActiva && estadoSubasta.itemActual) {
        const pujaMasAlta = await prisma.puja.findFirst({
          where: { itemId: estadoSubasta.itemActual.id },
          orderBy: { monto: 'desc' }
        });

        if (pujaMasAlta && pujaMasAlta.usuarioId === parseInt(usuarioId)) {
          return res.status(400).json({
            success: false,
            error: 'No puedes salir de la puja porque tienes la puja más alta'
          });
        }
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

      // Verificar si todos los usuarios excepto el que tiene la puja más alta han salido
      if (estadoSubasta && estadoSubasta.subastaActiva && estadoSubasta.itemActual) {
        // Obtener la puja más alta actual
        const pujaMasAlta = await prisma.puja.findFirst({
          where: { itemId: estadoSubasta.itemActual.id },
          orderBy: { monto: 'desc' },
          include: { usuario: true }
        });

        if (pujaMasAlta) {
          // Obtener todos los usuarios
          const todosUsuarios = await prisma.usuario.findMany();
          
          // Obtener todas las pujas para este item
          const todasLasPujas = await prisma.puja.findMany({
            where: { itemId: estadoSubasta.itemActual.id },
            orderBy: { monto: 'desc' }
          });
          
          // Si solo hay una puja (la inicial), el usuario que la hizo no puede salir
          // Si hay más de una puja, el usuario con la más alta no puede salir
          const usuarioGanadorId = pujaMasAlta.usuarioId;
          
          // Contar cuántos usuarios han salido (excluyendo al ganador)
          const usuariosSalidos = todosUsuarios.filter(u => 
            u.salioDePuja && u.id !== usuarioGanadorId
          ).length;
          
          // Contar cuántos usuarios deberían haber salido (todos excepto el ganador)
          const usuariosQueDeberianSalir = todosUsuarios.length - 1;
          
          console.log(`📊 Estado de salidas: ${usuariosSalidos}/${usuariosQueDeberianSalir} usuarios han salido`);
          
          // Si todos los usuarios excepto el que tiene la puja más alta han salido, adjudicar inmediatamente
          if (usuariosSalidos >= usuariosQueDeberianSalir) {
            console.log('🏆 Todos los usuarios han salido excepto el ganador, adjudicando inmediatamente...');
            
            // En lugar de adjudicar aquí, solo marcar que se debe adjudicar
            // La adjudicación se manejará en el socket cuando se detecte el cambio
            console.log('✅ Condición de adjudicación inmediata cumplida');
            
            return res.json({
              success: true,
              data: {
                usuarioId: usuarioActualizado.id,
                nombre: usuarioActualizado.nombre,
                email: usuarioActualizado.email,
                adjudicadoInmediatamente: true
              }
            });
          }
        }
      }

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
