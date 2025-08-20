import { Router } from 'express';
import { itemsController } from '../controllers/itemsController';

const router = Router();

// GET /items - Obtener todos los items
router.get('/', itemsController.getItems);

// GET /items/actual - Obtener item actual en subasta
router.get('/actual', itemsController.getItemActual);

// POST /items/actual - Establecer item actual
router.post('/actual', itemsController.setItemActual);

// POST /items/iniciar - Iniciar subasta
router.post('/iniciar', itemsController.iniciarSubasta);

// GET /items/disponibles - Obtener items disponibles
router.get('/disponibles', itemsController.getItemsDisponibles);

// POST /items/prueba - Crear item de prueba (solo desarrollo)
router.post('/prueba', itemsController.crearItemPrueba);

export default router;
