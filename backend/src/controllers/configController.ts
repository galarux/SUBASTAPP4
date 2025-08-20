import { Request, Response } from 'express';
import { ConfigService } from '../services/configService';

export const getConfig = async (req: Request, res: Response) => {
  try {
    const { clave } = req.params;
    const valor = await ConfigService.getConfig(clave);
    
    if (valor === null) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }

    res.json({
      success: true,
      data: { clave, valor }
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const getAllConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await ConfigService.getAllConfigs();
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { clave, valor, descripcion } = req.body;
    
    if (!clave || valor === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Clave y valor son requeridos'
      });
    }

    const success = await ConfigService.updateConfig(clave, valor, descripcion);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar configuración'
      });
    }

    res.json({
      success: true,
      message: 'Configuración actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const getPlayerStats = async (req: Request, res: Response) => {
  try {
    const stats = await ConfigService.getPlayerStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

export const shouldAuctionEnd = async (req: Request, res: Response) => {
  try {
    const shouldEnd = await ConfigService.shouldAuctionEnd();
    
    res.json({
      success: true,
      data: { shouldEnd }
    });
  } catch (error) {
    console.error('Error al verificar si debe terminar la subasta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};



