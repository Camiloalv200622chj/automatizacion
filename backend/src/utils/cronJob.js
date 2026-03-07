import cron from 'node-cron';
import { executeFullAutomation } from '../services/automationService.js';
import logger from './logger.js';

/**
 * Scheduled task for the last day of every month at 23:00
 * Logic: '0 23 28-31 * *' and then check if it's the last day
 */
export const setupCronJobs = () => {
    // This runs every day at 11:00 PM to check if it's the last day
    cron.schedule('0 23 * * *', async () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // If tomorrow's month is different from today's, today is the last day
        if (tomorrow.getMonth() !== today.getMonth()) {
            logger.info('📅 Es el último día del mes. Iniciando automatización programada...');
            try {
                await executeFullAutomation();
            } catch (error) {
                logger.error(`Error ejecutando la tarea programada: ${error.message}`);
            }
        }
    });

    logger.info('⏰ Cron Job configurado para ejecutarse el último día de cada mes.');
};
