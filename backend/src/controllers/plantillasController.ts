import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPlantillas = async (req: Request, res: Response) => {
  try {
    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany({
      orderBy: { orden: 'asc' }
    });

    // Obtener todos los items subastados con información del ganador
    const itemsSubastados = await prisma.item.findMany({
      where: {
        subastado: true,
        ganadorId: { isSet: true }
      },
      include: {
        ganador: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Obtener las pujas ganadoras para cada item
    const pujasGanadoras = await prisma.puja.findMany({
      where: {
        itemId: { in: itemsSubastados.map(item => item.id) }
      },
      orderBy: { monto: 'desc' },
      distinct: ['itemId']
    });

    // Función para ordenar jugadores por posición
    const ordenPosiciones = ['PORTERO', 'DEFENSA', 'MEDIO', 'DELANTERO'];
    const ordenarJugadoresPorPosicion = (jugadores: any[]) => {
      return jugadores.sort((a, b) => {
        const posA = a.posicion || '';
        const posB = b.posicion || '';
        const indexA = ordenPosiciones.indexOf(posA);
        const indexB = ordenPosiciones.indexOf(posB);
        
        // Si ambos tienen posición definida, ordenar por el orden predefinido
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // Si solo uno tiene posición definida, poner el definido primero
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // Si ninguno tiene posición definida, ordenar por nombre
        return a.nombre.localeCompare(b.nombre);
      });
    };

    // Agrupar jugadores por usuario
    const plantillas = usuarios.map(usuario => {
      const jugadoresDelUsuario = itemsSubastados.filter(item => item.ganadorId === usuario.id);
      
      const jugadores = jugadoresDelUsuario.map(item => {
        // Buscar la puja ganadora para este item
        const pujaGanadora = pujasGanadoras.find(puja => puja.itemId === item.id);
        const precioAdjudicacion = pujaGanadora ? pujaGanadora.monto : item.precioSalida;
        
        return {
          id: item.id,
          nombre: item.nombre,
          equipo: item.equipo,
          posicion: item.posicion,
          fotoUrl: item.fotoUrl,
          precioAdjudicacion,
          fechaAdjudicacion: item.updatedAt
        };
      });

      // Ordenar jugadores por posición
      const jugadoresOrdenados = ordenarJugadoresPorPosicion(jugadores);
      const totalCreditosGastados = jugadoresOrdenados.reduce((total, jugador) => total + jugador.precioAdjudicacion, 0);

      return {
        usuarioId: usuario.id,
        nombreUsuario: usuario.nombre,
        jugadores: jugadoresOrdenados,
        totalCreditosGastados
      };
    });

    res.json({
      success: true,
      plantillas
    });

  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};
