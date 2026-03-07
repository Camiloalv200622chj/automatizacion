import express from 'express';
import { runAutomation, runEntityAutomation } from '../controllers/automationController.js';

const router = express.Router();

router.post('/run', runAutomation);
router.post('/run-entity', runEntityAutomation);

export default router;
