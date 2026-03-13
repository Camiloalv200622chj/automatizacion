import express from 'express';
import { runAutomation, runEntityAutomation, getAutomationStatus } from '../controllers/automationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/run', runAutomation);
router.post('/run-entity', runEntityAutomation);
router.get('/status', protect, getAutomationStatus);

export default router;
