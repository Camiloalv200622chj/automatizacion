import Contratista from '../models/Contratista.js';
import { downloadCertificate } from '../utils/scrapingService.js';
import { processDownloadedFile } from '../utils/fileService.js';
import googleDriveService from '../utils/googleDriveService.js';
import logger from '../utils/logger.js';
import fs from 'fs';

export const runAutomation = async (req, res, next) => {
    try {
        const contratistas = await Contratista.find({ isActive: true });

        if (contratistas.length === 0) {
            return res.json({ message: 'No hay contratistas activos para procesar.' });
        }

        const results = [];

        for (const contratista of contratistas) {
            try {
                logger.info(`Procesando contratista: ${contratista.nombreCompleto}`);

                // 1. Scraping
                const zipPath = await downloadCertificate(contratista);

                // 2. Procesamiento local
                const pdfPath = await processDownloadedFile(zipPath, contratista);

                // 3. Subida a Google Drive
                const folderId = await googleDriveService.getOrCreateYearMonthFolder();
                if (folderId) {
                    const fileName = pdfPath.split('\\').pop() || pdfPath.split('/').pop();
                    await googleDriveService.uploadFile(pdfPath, fileName, folderId);
                    logger.info(`Certificado de ${contratista.nombreCompleto} subido a Drive.`);
                }

                results.push({ documento: contratista.documento, status: 'success' });

                // Clean up local files after processing and upload
                fs.unlinkSync(zipPath);
                fs.unlinkSync(pdfPath);

            } catch (err) {
                logger.error(`Fallo en automatización para ${contratista.nombreCompleto} (documento: ${contratista.documento}): ${err.message}`);
                results.push({ documento: contratista.documento, status: 'failed', error: err.message });
            }
        }

        res.json({
            message: 'Proceso de automatización finalizado',
            summary: results
        });
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
        logger.info(`Solicitud recibida para entidad: ${entity}`);
        logger.debug(`Datos recibidos: ${JSON.stringify(data)}`);

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

        res.json({
            message: `Automatización para ${entity} completada con éxito.`,
            status: 'success',
            receivedData: data
        });
    } catch (error) {
        next(error);
    }
};
