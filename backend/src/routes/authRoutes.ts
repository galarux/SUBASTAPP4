import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

// POST /auth/login
router.post('/login', authController.login);

// POST /auth/logout
router.post('/logout', authController.logout);

// GET /auth/turno-actual
router.get('/turno-actual', authController.getTurnoActual);

export default router;
