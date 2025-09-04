import { Router } from 'express';
import { pujasController } from '../controllers/pujasController';

const router = Router();

// GET /pujas/:id - Obtener pujas de un item
router.get('/:id', pujasController.getPujas);

// POST /pujas - Crear nueva puja
router.post('/', pujasController.crearPuja);

// GET /pujas/:id/actual - Obtener puja actual de un item
router.get('/:id/actual', pujasController.getPujaActual);

export default router;
