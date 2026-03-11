import Contratista from '../models/Contratista.js';
import Record from '../models/Record.js';
import { downloadCertificate } from '../utils/scrapingService.js';
import { processCertificate } from '../utils/fileService.js';
import googleDriveService from '../utils/googleDriveService.js';
import logger from '../utils/logger.js';
import { getCurrentProcessingPeriod } from '../utils/periodUtils.js';
import fs from 'fs';

/**
 * Core logic to run automation for all active contractors
 */
export const executeFullAutomation = async () => {
    const contratistas = await Contratista.find({ isActive: true });

    if (contratistas.length === 0) {
        return { message: 'No hay contratistas activos para procesar.', summary: [] };
    }

    const { period } = getCurrentProcessingPeriod();
    const results = [];

    for (const contratista of contratistas) {
        let driveData = null;
        try {
            logger.info(`Procesando contratista: ${contratista.nombreCompleto} para el periodo ${period}`);

            // 1. Scraping
            const zipPath = await downloadCertificate(contratista);

            // 2. Procesamiento local
            if (zipPath) {
                const pdfPath = await processCertificate(zipPath, contratista);

                // 3. Subida a Google Drive
                const folderId = await googleDriveService.getOrCreateYearMonthFolder();
                if (folderId) {
                    const fileName = pdfPath.split('\\').pop() || pdfPath.split('/').pop();
                    driveData = await googleDriveService.uploadFile(pdfPath, fileName, folderId);
                    logger.info(`Certificado de ${contratista.nombreCompleto} subido a Drive.`);
                }

                // Clean up local files after processing and upload
                if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            }

            results.push({ documento: contratista.numeroDocumento, status: 'success' });

            // 4. Save Record in DB
            await Record.findOneAndUpdate(
                { documento: contratista.numeroDocumento, entidad: 'automatic', periodo: period },
                {
                    nombreContratista: contratista.nombreCompleto,
                    documento: contratista.numeroDocumento,
                    entidad: 'automatic',
                    periodo: period,
                    status: 'success',
                    driveFileId: driveData?.id,
                    driveLink: driveData?.webViewLink
                },
                { upsert: true }
            );

        } catch (err) {
            logger.error(`Fallo en automatización para ${contratista.nombreCompleto} (documento: ${contratista.numeroDocumento}): ${err.message}`);
            results.push({ documento: contratista.numeroDocumento, status: 'failed', error: err.message });

            // 4b. Save Failed Record in DB
            await Record.findOneAndUpdate(
                { documento: contratista.numeroDocumento, entidad: 'automatic', periodo: period },
                {
                    nombreContratista: contratista.nombreCompleto,
                    documento: contratista.numeroDocumento,
                    entidad: 'automatic',
                    periodo: period,
                    status: 'failed',
                    errorMessage: err.message
                },
                { upsert: true }
            );
        }
    }

    return {
        message: 'Proceso de automatización finalizado',
        periodo: period,
        summary: results
    };
};

/**
 * Core logic to run automation for a specific entity
 */
export const executeEntityAutomation = async (entity, data) => {
    logger.info(`Ejecutando automatización para entidad: ${entity}`);

    try {
        let driveData = null;
        // 1. Scraping
        const resultPath = await downloadCertificate(null, { entity, data });

        // 2. Subida a Drive si se generó archivo
        if (resultPath && fs.existsSync(resultPath)) {
            const folderId = await googleDriveService.getOrCreateYearMonthFolder();
            if (folderId) {
                const fileName = resultPath.split('\\').pop() || resultPath.split('/').pop();
                driveData = await googleDriveService.uploadFile(resultPath, fileName, folderId);
                fs.unlinkSync(resultPath);
            }
        }

        // 3. Save Record in DB
        if (data.nombreCompleto && data.numeroDocumento) {
            // Si no viene periodo, asumimos el actual de procesamiento
            const periodToSave = data.periodo || getCurrentProcessingPeriod().period;
            
            await Record.findOneAndUpdate(
                { documento: data.numeroDocumento, entidad: entity, periodo: periodToSave },
                {
                    nombreContratista: data.nombreCompleto,
                    documento: data.numeroDocumento,
                    entidad: entity,
                    periodo: periodToSave,
                    status: 'success',
                    driveFileId: driveData?.id,
                    driveLink: driveData?.webViewLink
                },
                { upsert: true }
            );
        }

        return {
            message: `Automatización para ${entity} completada con éxito.`,
            status: 'success',
            receivedData: data
        };
    } catch (err) {
        logger.error(`Fallo en automatización manual para ${entity}: ${err.message}`);
        
        if (data.nombreCompleto && data.numeroDocumento) {
            const periodToSave = data.periodo || getCurrentProcessingPeriod().period;
            await Record.findOneAndUpdate(
                { documento: data.numeroDocumento, entidad: entity, periodo: periodToSave },
                {
                    nombreContratista: data.nombreCompleto,
                    documento: data.numeroDocumento,
                    entidad: entity,
                    periodo: periodToSave,
                    status: 'failed',
                    errorMessage: err.message
                },
                { upsert: true }
            );
        }
        
        throw err;
    }
};
