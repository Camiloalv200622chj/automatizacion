import cron from 'node-cron';
import { runAutomation } from '../controllers/automationController.js';
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
                // We simulate a req/res object for the controller if needed, 
                // or refactor the controller to separate logic. 
                // For now, let's just log and prepare for the call.
                await runAutomation({}, { json: (data) => logger.info(`Resumen Cron: ${JSON.stringify(data)}`) }, (err) => logger.error(`Error en Cron: ${err.message}`));
            } catch (error) {
                logger.error(`Error ejecutando la tarea programada: ${error.message}`);
            }
        }
    });

    logger.info('⏰ Cron Job configurado para ejecutarse el último día de cada mes.');
};
