import express from 'express';
import { getPlantillas } from '../controllers/plantillasController';

const router = express.Router();

router.get('/', getPlantillas);

export default router;
