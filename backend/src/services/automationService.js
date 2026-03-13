import Contratista from '../models/Contratista.js';
import Record from '../models/Record.js';
import { downloadCertificate } from '../utils/scrapingService.js';
import { processCertificate } from '../utils/fileService.js';
import googleDriveService from '../utils/googleDriveService.js';
import logger from '../utils/logger.js';
import path from 'path';
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
        let attempt = 0;
        let success = false;
        const maxAttempts = 3;

        while (attempt < maxAttempts && !success) {
            attempt++;
            try {
                logger.info(`Intento ${attempt} de ${maxAttempts} para ${contratista.nombreCompleto}`);

                // 1. Scraping
                const zipPath = await downloadCertificate(contratista);

                // 2. Procesamiento local
                let finalPdfPath = null;
                if (zipPath) {
                    finalPdfPath = await processCertificate(zipPath, contratista);

                    // 3. Subida a Google Drive
                    const folderId = await googleDriveService.getOrCreateYearMonthFolder();
                    if (folderId) {
                        const fileName = finalPdfPath.split('\\').pop() || finalPdfPath.split('/').pop();
                        await googleDriveService.uploadFile(finalPdfPath, fileName, folderId);
                        logger.info(`Certificado de ${contratista.nombreCompleto} subido a Drive.`);
                    }

                    // Clean up local files after processing and upload
                    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                    if (fs.existsSync(finalPdfPath)) fs.unlinkSync(finalPdfPath);
                }

                results.push({ documento: contratista.documento, status: 'success' });
                success = true; // Stop retries

                // 4. Save Record in DB
                const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM
                await Record.findOneAndUpdate(
                    { documento: contratista.numeroDocumento, entidad: 'automatic', periodo: currentPeriod },
                    {
                        nombreContratista: contratista.nombreCompleto,
                        documento: contratista.numeroDocumento,
                        entidad: 'automatic',
                        periodo: currentPeriod,
                        status: 'success',
                        rutaArchivo: finalPdfPath || 'Not Saved Locally'
                    },
                    { upsert: true }
                );

            } catch (err) {
                logger.error(`Fallo en automatización para ${contratista.nombreCompleto} (documento: ${contratista.numeroDocumento}) en intento ${attempt}: ${err.message}`);

                if (attempt === maxAttempts) {
                    results.push({ documento: contratista.numeroDocumento, status: 'failed', error: err.message });
                    const currentPeriod = new Date().toISOString().substring(0, 7);
                    await Record.findOneAndUpdate(
                        { documento: contratista.numeroDocumento, entidad: 'automatic', periodo: currentPeriod },
                        {
                            nombreContratista: contratista.nombreCompleto,
                            documento: contratista.numeroDocumento,
                            entidad: 'automatic',
                            periodo: currentPeriod,
                            status: 'failed',
                            rutaArchivo: 'Failed'
                        },
                        { upsert: true }
                    );
                } else {
                    // Esperar antes del siguiente intento
                    await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
                }
            }
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
    let resultPath = await downloadCertificate(null, { entity, data });
    let isSuccess = false;

    // 2. Procesamiento local (Manejo de ZIP y Renombrado)
    if (resultPath && fs.existsSync(resultPath)) {
        let processedPath = resultPath;

        try {
            // Detección robusta por "Magic Numbers" (PK para ZIP)
            const buffer = fs.readFileSync(resultPath);
            const isZipContent = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
            
            if (isZipContent) {
                logger.info(`Detectado contenido ZIP para ${entity}. Extrayendo PDF...`);
                // Extraemos el PDF usando processCertificate (que ya tiene la lógica de decompress)
                processedPath = await processCertificate(resultPath, {
                    nombreCompleto: data.nombreCompleto,
                    numeroDocumento: data.numeroDocumento,
                    nombre: data.nombreCompleto
                });
            }

            // A este punto, processedPath ya es un .pdf (sea de ZIP o original)
            // Ahora aplicamos el Renombrado Uniforme esperado por el usuario
            if (fs.existsSync(processedPath)) {
                const targetDir = path.dirname(processedPath);
                const now = new Date();
                const periodStr = data.periodo || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                // Limpiar nombre y asegurar formato: Nombre-Entidad-Periodo.pdf
                const cleanName = data.nombreCompleto.trim().replace(/\s+/g, '_');
                const newFileName = `${cleanName}-${entity.toLowerCase().replace(/\s+/g, '_')}-${periodStr}.pdf`;
                const finalPdfPath = path.join(targetDir, newFileName);

                if (processedPath !== finalPdfPath) {
                    logger.info(`Renombrando certificado final: ${path.basename(processedPath)} -> ${newFileName}`);
                    fs.renameSync(processedPath, finalPdfPath);
                    processedPath = finalPdfPath;
                }
                isSuccess = true;
            }

            // 3. Subida a Drive
            const folderId = await googleDriveService.getOrCreateYearMonthFolder();
            if (folderId && fs.existsSync(processedPath)) {
                const fileName = path.basename(processedPath);
                await googleDriveService.uploadFile(processedPath, fileName, folderId);
                logger.info(`Certificado de ${data.nombreCompleto} subido a Drive as ${fileName}.`);

                // Borrado seguro después de la subida
                if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
            }
        } catch (procError) {
            logger.error(`Error procesando/subiendo archivo: ${procError.message}`);
            // No cambiamos isSuccess a false si ya se procesó pero falló la subida (opcional, pero mejor ser estricto)
            isSuccess = false;
        }
    }

    // 4. Save Record in DB and Update Contratista
    if (data.nombreCompleto && data.numeroDocumento) {
        try {
            const currentPeriod = data.periodo || new Date().toISOString().substring(0, 7);
            const status = isSuccess ? 'success' : 'failed';

            // Guardar Historial
            await Record.findOneAndUpdate(
                { documento: data.numeroDocumento, entidad: entity, periodo: currentPeriod },
                {
                    nombreContratista: data.nombreCompleto,
                    documento: data.numeroDocumento,
                    entidad: entity,
                    periodo: currentPeriod,
                    status: status,
                    fechaProcesamiento: new Date()
                },
                { upsert: true }
            );

            // Actualizar o Crear Contratista (Estado Actual para el listado)
            await Contratista.findOneAndUpdate(
                { numeroDocumento: data.numeroDocumento },
                {
                    nombreCompleto: data.nombreCompleto,
                    numeroDocumento: data.numeroDocumento,
                    tipoDocumento: data.tipoDocumento || 'CC',
                    usuarioPortal: data.usuarioPortal || 'MANUAL',
                    passwd: data.passwd || 'MANUAL',
                    lastAutomationStatus: status,
                    lastAutomationDate: new Date()
                },
                { upsert: true }
            );

            logger.info(`DB: Datos de ${data.nombreCompleto} sincronizados en Records y Contratista (upsert)`);
        } catch (dbError) {
            logger.error(`Error de persistencia DB: ${dbError.message}`);
        }
    }

    if (!resultPath || !fs.existsSync(resultPath)) {
        return {
            message: `La automatización para ${entity} no generó un archivo. Revise los registros de SOI.`,
            status: 'failed',
            receivedData: data
        };
    }

    return {
        message: `Automatización para ${entity} completada con éxito.`,
        status: 'success',
        receivedData: data
    };
};
