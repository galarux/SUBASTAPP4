import express from 'express';
import {
  getConfig,
  getAllConfigs,
  updateConfig,
  getPlayerStats,
  shouldAuctionEnd
} from '../controllers/configController';

const router = express.Router();

// Obtener una configuración específica
router.get('/:key', getConfig);

// Obtener todas las configuraciones
router.get('/', getAllConfigs);

// Actualizar configuración
router.put('/', updateConfig);

// Obtener estadísticas de jugadores
router.get('/stats/players', getPlayerStats);

// Verificar si debe terminar la subasta
router.get('/check/auction-end', shouldAuctionEnd);

export default router;



