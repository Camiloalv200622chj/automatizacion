import { executeFullAutomation, executeEntityAutomation } from '../services/automationService.js';
import Contratista from '../models/Contratista.js';
import Record from '../models/Record.js';
import logger from '../utils/logger.js';

export const runAutomation = async (req, res, next) => {
    try {
        const result = await executeFullAutomation();
        logger.info('Automatización completa ejecutada con éxito.'); // Added logger.info
        res.json(result);
    } catch (error) {
        logger.error(`Error al ejecutar la automatización completa: ${error.message}`); // Added logger.error
        next(error);
    }
};

/**
 * @desc    Ejecutar automatización para una entidad específica (desde el frontend)
 * @route   POST /api/automation/run-entity
 */
export const runEntityAutomation = async (req, res, next) => {
    try {
        const { entity, data } = req.body;
        logger.info(`Petición de automatización recibida: Entidad=${entity}, Doc=${data.numeroDocumento}`);

        if (!data.nombreCompleto) {
            logger.warn('Intento de automatización de entidad sin nombre completo del contratista.'); // Added logger.warn
            return res.status(400).json({ message: 'El nombre del contratista es obligatorio' });
        }

        const result = await executeEntityAutomation(entity, data);
        logger.info(`Automatización de entidad ${entity} para ${data.numeroDocumento} ejecutada con éxito.`); // Added logger.info
        res.json(result);
    } catch (error) {
        logger.error(`Error al ejecutar la automatización para la entidad ${req.body.entity} y documento ${req.body.data?.numeroDocumento}: ${error.message}`); // Added logger.error
        next(error);
    }
};

/**
 * @desc    Obtener estado de cumplimiento mensual
 * @route   GET /api/automation/status
 */
export const getAutomationStatus = async (req, res, next) => {
    try {
        const period = req.query.period || new Date().toISOString().substring(0, 7);

        const contratistas = await Contratista.find({ isActive: true });
        const records = await Record.find({ periodo: period });

        const statusReport = contratistas.map(c => {
            const successfulRecord = records.find(r => r.documento === c.numeroDocumento && r.status === 'success');
            return {
                nombre: c.nombreCompleto,
                documento: c.numeroDocumento,
                completado: !!successfulRecord,
                entidad: successfulRecord ? successfulRecord.entidad : '---',
                fecha: successfulRecord ? successfulRecord.fechaProcesamiento : null
            };
        });

        res.json({
            periodo: period,
            report: statusReport
        });
    } catch (error) {
        next(error);
    }
};
