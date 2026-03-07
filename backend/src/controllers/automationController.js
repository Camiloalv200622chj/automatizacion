import { executeFullAutomation, executeEntityAutomation } from '../services/automationService.js';
import Contratista from '../models/Contratista.js';
import Record from '../models/Record.js';
import logger from '../utils/logger.js';

export const runAutomation = async (req, res, next) => {
    try {
        const result = await executeFullAutomation();
        res.json(result);
    } catch (error) {
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

        if (!data.nombreCompleto) {
            return res.status(400).json({ message: 'El nombre del contratista es obligatorio' });
        }

        const result = await executeEntityAutomation(entity, data);
        res.json(result);
    } catch (error) {
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
            const hasRecord = records.some(r => r.documento === c.numeroDocumento);
            return {
                nombre: c.nombreCompleto,
                documento: c.numeroDocumento,
                completado: hasRecord,
                fecha: hasRecord ? records.find(r => r.documento === c.numeroDocumento).fechaProcesamiento : null
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
