import { Router } from 'express';
import { salidasController } from '../controllers/salidasController';

const router = Router();

// Marcar usuario como salido de la puja
router.post('/salir', salidasController.salirDePuja);

// Obtener usuarios que han salido de la puja
router.get('/', salidasController.getUsuariosSalidos);

// Verificar si un usuario ha salido de la puja
router.get('/:id/verificar', salidasController.verificarSalida);

export default router;
