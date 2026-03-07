import express from 'express';
import { runAutomation, runEntityAutomation, getAutomationStatus } from '../controllers/automationController.js';

const router = express.Router();

router.post('/run', runAutomation);
router.post('/run-entity', runEntityAutomation);
router.get('/status', getAutomationStatus);

export default router;
