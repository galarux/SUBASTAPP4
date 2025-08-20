import { Router } from 'express';
import { pujasController } from '../controllers/pujasController';

const router = Router();

// GET /pujas/:itemId - Obtener pujas de un item
router.get('/:itemId', pujasController.getPujas);

// POST /pujas - Crear nueva puja
router.post('/', pujasController.crearPuja);

// GET /pujas/:itemId/actual - Obtener puja actual de un item
router.get('/:itemId/actual', pujasController.getPujaActual);

export default router;
