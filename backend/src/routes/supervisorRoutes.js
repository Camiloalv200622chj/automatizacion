import express from 'express';
import { createSupervisor, getSupervisores, deleteSupervisor } from '../controllers/supervisorController.js';

const router = express.Router();

router.route('/')
    .post(createSupervisor)
    .get(getSupervisores);

router.route('/:id')
    .delete(deleteSupervisor);

export default router;
