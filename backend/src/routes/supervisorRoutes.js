import express from 'express';
import { getSupervisores, deleteSupervisor } from '../controllers/supervisorController.js';
import { loginSupervisor, registerSupervisor } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', loginSupervisor);
router.post('/register', registerSupervisor);

router.route('/')
    .get(protect, getSupervisores);

router.route('/:id')
    .delete(protect, deleteSupervisor);

export default router;
