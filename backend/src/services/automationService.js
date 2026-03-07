import Contratista from '../models/Contratista.js';
import Record from '../models/Record.js';
import { downloadCertificate } from '../utils/scrapingService.js';
import { processCertificate } from '../utils/fileService.js';
import googleDriveService from '../utils/googleDriveService.js';
import logger from '../utils/logger.js';
import fs from 'fs';

/**
 * Core logic to run automation for all active contractors
 */
export const executeFullAutomation = async () => {
    const contratistas = await Contratista.find({ isActive: true });

    if (contratistas.length === 0) {
        return { message: 'No hay contratistas activos para procesar.', summary: [] };
    }

    const results = [];

    for (const contratista of contratistas) {
        try {
            logger.info(`Procesando contratista: ${contratista.nombreCompleto}`);

            // 1. Scraping
            const zipPath = await downloadCertificate(contratista);

            // 2. Procesamiento local
            if (zipPath) {
                const pdfPath = await processCertificate(zipPath, contratista);

                // 3. Subida a Google Drive
                const folderId = await googleDriveService.getOrCreateYearMonthFolder();
                if (folderId) {
                    const fileName = pdfPath.split('\\').pop() || pdfPath.split('/').pop();
                    await googleDriveService.uploadFile(pdfPath, fileName, folderId);
                    logger.info(`Certificado de ${contratista.nombreCompleto} subido a Drive.`);
                }

                // Clean up local files after processing and upload
                if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            }

            results.push({ documento: contratista.documento, status: 'success' });

            // 4. Save Record in DB
            const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM
            await Record.findOneAndUpdate(
                { documento: contratista.documento, entidad: 'automatic', periodo: currentPeriod },
                {
                    nombreContratista: contratista.nombreCompleto,
                    documento: contratista.documento,
                    entidad: 'automatic',
                    periodo: currentPeriod,
                    status: 'success'
                },
                { upsert: true }
            );

        } catch (err) {
            logger.error(`Fallo en automatización para ${contratista.nombreCompleto} (documento: ${contratista.documento}): ${err.message}`);
            results.push({ documento: contratista.documento, status: 'failed', error: err.message });
        }
    }

    return {
        message: 'Proceso de automatización finalizado',
        summary: results
    };
};

/**
 * Core logic to run automation for a specific entity
 */
export const executeEntityAutomation = async (entity, data) => {
    logger.info(`Ejecutando automatización para entidad: ${entity}`);

    // 1. Scraping
    const resultPath = await downloadCertificate(null, { entity, data });

    // 2. Subida a Drive si se generó archivo
    if (resultPath && fs.existsSync(resultPath)) {
        const folderId = await googleDriveService.getOrCreateYearMonthFolder();
        if (folderId) {
            const fileName = resultPath.split('\\').pop() || resultPath.split('/').pop();
            await googleDriveService.uploadFile(resultPath, fileName, folderId);
            fs.unlinkSync(resultPath);
        }
    }

    // 3. Save Record in DB
    if (data.nombreCompleto && data.numeroDocumento) {
        const currentPeriod = data.periodo || new Date().toISOString().substring(0, 7);
        await Record.findOneAndUpdate(
            { documento: data.numeroDocumento, entidad: entity, periodo: currentPeriod },
            {
                nombreContratista: data.nombreCompleto,
                documento: data.numeroDocumento,
                entidad: entity,
                periodo: currentPeriod,
                status: 'success'
            },
            { upsert: true }
        );
    }

    return {
        message: `Automatización para ${entity} completada con éxito.`,
        status: 'success',
        receivedData: data
    };
};
