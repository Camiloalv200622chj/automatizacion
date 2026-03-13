import path from 'path';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';
import logger from './logger.js';

/**
 * Calculates the destination folder based on the current date
 * Logic: Current month folder contains certifications from previous month
 * Example: In March 2026, the folder is /certificados/2026/03-Marzo/ and contains Feb files.
 */
export const getTargetDirectory = () => {
    const now = new Date();
    const year = now.getFullYear();
    const monthNumber = (now.getMonth() + 1).toString().padStart(2, '0');

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = months[now.getMonth()];

    // Path: /certificados/2026/03-Marzo/
    const targetPath = path.resolve('certificados', year.toString(), `${monthNumber}-${monthName}`);
    return targetPath;
};

/**
 * Renames and organizes the downloaded certificate
 * Format: NombreCompleto_YYYY_MM.pdf
 */
export const processCertificate = async (tempFilePath, contratista) => {
    try {
        const targetDir = getTargetDirectory();
        await fs.ensureDir(targetDir);

        const now = new Date();
        // Month of the certificate (previous month)
        const certDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const certYear = certDate.getFullYear();
        const certMonth = (certDate.getMonth() + 1).toString().padStart(2, '0');

        let finalPdfPath = '';
        const buffer = await fs.readFile(tempFilePath);
        const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;

        if (isZip) {
            logger.info(`Validado contenido ZIP para ${contratista.nombreCompleto}. Extrayendo...`);
            const zip = new AdmZip(tempFilePath);
            const zipEntries = zip.getEntries();
            const pdfEntry = zipEntries.find(entry => entry.entryName.toLowerCase().endsWith('.pdf'));

            if (!pdfEntry) {
                throw new Error(`No se encontró un PDF dentro del archivo ZIP para ${contratista.nombreCompleto}`);
            }

            const nombreRaw = contratista.nombreCompleto || contratista.nombre || 'Certificado';
            const fileName = `${nombreRaw.replace(/\s+/g, '_')}_${certYear}_${certMonth}.pdf`;
            finalPdfPath = path.join(targetDir, fileName);

            // Extract and rename directly
            const pdfBuffer = pdfEntry.getData();
            await fs.writeFile(finalPdfPath, pdfBuffer);
            await fs.remove(tempFilePath); // Cleanup original
        } else {
            // Asumimos que es un PDF si no es ZIP (ya que pasamos los filtros previos)
            const fileName = `${contratista.nombreCompleto.replace(/\s+/g, '_')}_${certYear}_${certMonth}.pdf`;
            finalPdfPath = path.join(targetDir, fileName);
            await fs.move(tempFilePath, finalPdfPath, { overwrite: true });
        }

        logger.info(`✅ Certificado procesado: ${finalPdfPath}`);
        return finalPdfPath;
    } catch (error) {
        logger.error(`❌ Error procesando certificado para ${contratista.nombreCompleto}: ${error.message}`);
        throw error;
    }
};
