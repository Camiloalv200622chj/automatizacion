import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Tesseract from 'tesseract.js';
import logger from './logger.js';
import path from 'path';
import fs from 'fs';

chromium.use(StealthPlugin());

/**
 * Resuelve captchas básicos de imagen usando OCR (Tesseract.js)
 */
async function solveImageCaptcha(page, selector) {
    try {
        const element = await page.$(selector);
        if (!element) return null;

        const screenshotPath = path.resolve('temp_captcha.png');
        await element.screenshot({ path: screenshotPath });

        const { data: { text } } = await Tesseract.recognize(screenshotPath, 'eng');
        fs.unlinkSync(screenshotPath);

        const cleanedText = text.replace(/[^a-zA-Z0-9]/g, '').trim();
        logger.info(`Captcha detectado (OCR): ${cleanedText}`);
        return cleanedText;
    } catch (error) {
        logger.error(`Error resolviendo captcha: ${error.message}`);
        return null;
    }
}

/**
 * Lógica específica para SOI
 */
export const scrapeSOI = async (data) => {
    const browser = await chromium.launch({ headless: true });
    // Configurar descarga
    const downloadPath = path.resolve('temp_downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const context = await browser.newContext({
        acceptDownloads: true
    });
    const page = await context.newPage();

    try {
        logger.info(`Iniciando scraping para SOI - Doc: ${data.numeroDocumento}`);
        await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', { waitUntil: 'networkidle' });

        // 1. Datos del aportante (Initial Section)
        // Nota: Los datos del aportante deberían venir en el objeto 'data' o estar pre-configurados
        // Por ahora usamos los que el usuario proporcione o valores por defecto si faltan
        await page.selectOption('#tipoDocumentoAportante', data.tipoDocumentoAportante || 'CC');
        await page.fill('input.form-control', data.documentoAportante || data.numeroDocumento);

        // Clic en Certificados por cotizante
        await page.click('a.btn.btn-success:has-text("Certificados por cotizante")');
        await page.waitForTimeout(1000);

        // 2. Información del cotizante
        await page.selectOption('#tipoDocumentoCotizante', data.tipoDocumento || 'CC');
        await page.fill('#numeroDocumentoCotizante', data.numeroDocumento);

        if (data.eps) {
            await page.selectOption('#administradoraSalud', { label: data.eps });
        }

        // Periodo (Año y Mes)
        // data.periodo viene como "YYYY-MM"
        if (data.periodo) {
            const [year, month] = data.periodo.split('-');
            await page.selectOption('#periodoLiqSaludAnnio', year);
            await page.selectOption('#periodoLiqSaludMes', parseInt(month).toString());
        }

        logger.info('SOI: Formulario completado. Iniciando descarga...');

        // 3. Manejar descarga
        const downloadPromise = page.waitForEvent('download');
        await page.click('button.btn-success:has-text("Descargar PDF")');
        const download = await downloadPromise;

        const fileName = `SOI_${data.numeroDocumento}_${data.periodo}.pdf`;
        const filePath = path.join(downloadPath, fileName);
        await download.saveAs(filePath);

        await browser.close();
        return filePath;
    } catch (error) {
        logger.error(`Error en scraping SOI: ${error.message}`);
        if (browser) await browser.close();
        throw error;
    }
};

/**
 * Orquestador de descargas por entidad
 */
export const downloadCertificate = async (contratista, entityData = null) => {
    if (entityData) {
        const { entity, data } = entityData;
        logger.info(`Solicitud de automatización manual para entidad: ${entity}`);

        switch (entity) {
            case 'soi':
                return await scrapeSOI(data);
            case 'miplanilla':
                return await scrapeMiPlanilla(data);
            case 'aportes':
                // return await scrapeAportesEnLinea(data);
                break;
            default:
                logger.warn(`Entidad no soportada: ${entity}`);
        }
    }

    // Lógica por defecto para cron job...
    return null;
};

/**
 * Lógica específica para MiPlanilla
 */
export const scrapeMiPlanilla = async (data) => {
    const browser = await chromium.launch({ headless: true });
    const downloadPath = path.resolve('temp_downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    try {
        logger.info(`Iniciando scraping para MiPlanilla - Doc: ${data.numeroDocumento}`);
        await page.goto('https://empresas.miplanilla.com/Registro/Certificado/CertificadoAgil', { waitUntil: 'networkidle' });

        // 1. Tipo de aporte (Aporte propio por defecto si no viene)
        await page.check('input[name="rdTipoAporte"][value="1"]');

        // 2. Datos del aportante
        await page.selectOption('#tipoDocumentoAportante', data.tipoDocumento || 'CC');
        await page.fill('#numeroDocumentoAportante', data.numeroDocumento);

        // 3. Periodo
        if (data.periodo) {
            const [year, month] = data.periodo.split('-');
            const monthInt = parseInt(month).toString();

            await page.selectOption('#mesInicio', monthInt);
            await page.selectOption('#anioInicio', year);
            await page.selectOption('#mesFinal', monthInt);
            await page.selectOption('#anioFinal', year);
        }

        logger.info('MiPlanilla: Formulario completado. NOTA: Este sitio requiere reCAPTCHA manual o servicio externo.');

        // Aquí es donde normalmente se resolvería el reCAPTCHA si estuviéramos usando un servicio como 2captcha
        // Por ahora, si no hay CAPTCHA visible o es simple, intentamos continuar.
        // Si hay reCAPTCHA, Playwright-extra con Stealth a veces ayuda, pero a menudo requiere intervención.

        await page.click('#btnContinuar');
        await page.waitForTimeout(3000);

        // Intentar manejar descarga si aparece el botón después de consultar
        // Este es un placeholder ya que el flujo real depende de si hay pagos encontrados
        logger.info('MiPlanilla: Consulta enviada. Verificando resultados...');

        await browser.close();
        return null; // Placeholder hasta confirmar el selector final del PDF en MiPlanilla
    } catch (error) {
        logger.error(`Error en scraping MiPlanilla: ${error.message}`);
        if (browser) await browser.close();
        throw error;
    }
};
