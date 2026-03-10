import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Tesseract from 'tesseract.js';
import logger from './logger.js';
import path from 'path';
import fs from 'fs';

chromium.use(StealthPlugin());

/**
 * Añade un retraso aleatorio para simular comportamiento humano
 */
async function randomDelay(page, min = 1500, max = 4000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await page.waitForTimeout(delay);
}

/**
 * Resuelve captchas básicos de imagen usando OCR (Tesseract.js)
 */
async function solveImageCaptcha(page, selector) {
    try {
        logger.info('🔍 Detectando captcha de imagen...');
        const element = await page.$(selector);
        if (!element) {
            logger.warn('⚠️ No se encontró el selector del captcha.');
            return null;
        }

        const screenshotPath = path.resolve('temp_captcha.png');
        await element.screenshot({ path: screenshotPath });

        const { data: { text } } = await Tesseract.recognize(screenshotPath, 'eng');
        if (fs.existsSync(screenshotPath)) fs.unlinkSync(screenshotPath);

        const cleanedText = text.replace(/[^a-zA-Z0-9]/g, '').trim();
        logger.info(`✅ Captcha detectado (OCR): ${cleanedText}`);
        return cleanedText;
    } catch (error) {
        logger.error(`❌ Error resolviendo captcha: ${error.message}`);
        return null;
    }
}

/**
 * Lógica para Aportes en Línea (Autoservicio)
 */
export const scrapeAportes = async (data) => {
    const browser = await chromium.launch({ headless: false }); // User wants to see? Let's use headless but logs are key
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const downloadPath = path.resolve('temp_downloads');

    try {
        logger.info('🚀 [Aportes] Iniciando proceso en Autoservicio...');
        await page.goto('https://empresas.aportesenlinea.com/Autoservicio/CertificadoAportes.aspx', { waitUntil: 'networkidle' });
        await randomDelay(page, 2000, 4000);

        logger.info('📝 [Aportes] Completando formulario de identidad...');
        await page.selectOption('#ddlTipoDocumentoEmisor', data.tipoDocumento || 'CC');
        await randomDelay(page, 1000, 2500);
        await page.fill('#txtNumeroDocumentoEmisor', data.numeroDocumento);
        await randomDelay(page, 1000, 2500);

        if (data.fechaExpedicion) {
            logger.info(`📅 [Aportes] Ingresando Fecha de Expedición: ${data.fechaExpedicion}`);
            // Intentamos llenar si el campo existe en la interfaz real
            await page.fill('input[id*="Expedicion"]', data.fechaExpedicion).catch(() => logger.warn('⚠️ No se halló campo de Fecha de Expedición'));
            await randomDelay(page, 800, 1500);
        }

        if (data.eps) {
            logger.info(`🏥 [Aportes] Ingresando EPS: ${data.eps}`);
            await page.fill('input[id*="Eps"], input[id*="EPS"]', data.eps).catch(() => logger.warn('⚠️ No se halló campo de EPS'));
            await randomDelay(page, 800, 1500);
        }

        if (data.periodo) {
            const [year, month] = data.periodo.split('-');
            logger.info(`📅 [Aportes] Periodo seleccionado: ${year}-${month}`);
            // Selectores posibles para año y mes
            await page.selectOption('select[id*="Anio"], select[id*="Anno"]', year).catch(() => null);
            await randomDelay(page, 500, 1000);
            await page.selectOption('select[id*="Mes"]', parseInt(month).toString()).catch(() => null);
            await randomDelay(page, 500, 1000);
        }
        logger.info('⏳ [Aportes] Verificando si existe captcha...');
        await randomDelay(page, 2000, 3500);
        const captchaText = await solveImageCaptcha(page, '#imgCaptcha');
        if (captchaText) {
            await page.fill('#txtCaptcha', captchaText);
            await randomDelay(page, 1000, 2000);
        }

        logger.info('🖱️ [Aportes] Haciendo clic en consultar...');
        const downloadPromise = page.waitForEvent('download').catch(() => null);
        await page.click('#btnConsultar');

        const download = await downloadPromise;
        if (download) {
            const fileName = `Aportes_${data.numeroDocumento}.pdf`;
            const filePath = path.join(downloadPath, fileName);
            await download.saveAs(filePath);
            logger.info(`✅ [Aportes] Descarga completada: ${fileName}`);
            await browser.close();
            return filePath;
        }

        logger.warn('⚠️ [Aportes] No se inició descarga o requiere validación manual.');
        await browser.close();
        return null;
    } catch (error) {
        logger.error(`❌ [Aportes] Error: ${error.message}`);
        await browser.close();
        throw error;
    }
}

/**
 * Lógica para MiPlanilla
 */
export const scrapeMiPlanilla = async (data) => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const downloadPath = path.resolve('temp_downloads');

    try {
        logger.info('🚀 [MiPlanilla] Navegando a Consulta Independiente...');
        await page.goto('https://www.miplanilla.com/Private/Consultaplanillaindependiente.aspx', { waitUntil: 'networkidle' });
        await randomDelay(page, 2000, 5000);

        logger.info('📝 [MiPlanilla] Configurando formulario...');
        await page.waitForSelector('select[id*="TipoIdentificacion"], select[name*="tipo_doc"]', { timeout: 15000 }).catch(() => logger.warn('⚠️ Select de tipo de documento tardó en cargar'));
        await page.selectOption('select[id*="TipoIdentificacion"], select[name*="tipo_doc"]', data.tipoDocumento || 'CC').catch(() => null);
        await randomDelay(page, 1000, 2000);
        await page.fill('input[id*="NumeroIdentificacion"], input[name*="documento"]', data.numeroDocumento).catch(() => null);
        await randomDelay(page, 1000, 2000);

        if (data.periodoSalud) {
            const [year, month] = data.periodoSalud.split('-');
            await page.selectOption('#cp1_ddlMesDesde', parseInt(month).toString()).catch(() => null);
            await randomDelay(page, 500, 1500);
            await page.selectOption('#cp1_ddlAnioDesde', year).catch(() => null);
            await randomDelay(page, 500, 1500);
        }

        if (data.numeroPlanilla) {
            logger.info(`📝 [MiPlanilla] Ingresando número de planilla: ${data.numeroPlanilla}`);
            await page.fill('input[id*="Planilla"], input[id*="NumPlanilla"]', data.numeroPlanilla).catch(() => null);
            await randomDelay(page, 500, 1000);
        }

        if (data.fechaPago) {
            logger.info(`📅 [MiPlanilla] Ingresando fecha de pago: ${data.fechaPago}`);
            await page.fill('input[id*="FechaPago"]', data.fechaPago).catch(() => null);
            await randomDelay(page, 500, 1000);
        }

        if (data.valorPagado) {
            logger.info(`💰 [MiPlanilla] Ingresando valor pagado: ${data.valorPagado}`);
            await page.fill('input[id*="Valor"], input[id*="Total"]', data.valorPagado).catch(() => null);
            await randomDelay(page, 500, 1000);
        }

        logger.info('⏳ [MiPlanilla] Buscando captchas o retos...');
        await randomDelay(page, 2000, 4000);
        // Selector genérico para atrapar la imagen del captcha en varias plataformas
        const captchaVal = await solveImageCaptcha(page, 'img[src*="captcha"], img[src*="Captcha"], #imgCaptcha, #cp1_imgCaptcha');
        if (captchaVal) {
            await page.fill('#cp1_txtCaptcha', captchaVal);
            await randomDelay(page, 1000, 2000);
        }

        logger.info('🖱️ [MiPlanilla] Consultando...');
        await page.click('#cp1_ButtonConsultar');
        await randomDelay(page, 3000, 6000);

        logger.info('📂 [MiPlanilla] Verificando generación de PDF...');
        // Selector placeholder
        const pdfLink = await page.$('a:has-text("Descargar")');
        if (pdfLink) {
            const downloadPromise = page.waitForEvent('download');
            await pdfLink.click();
            const download = await downloadPromise;
            const filePath = path.join(downloadPath, `MiPlanilla_${data.numeroDocumento}.pdf`);
            await download.saveAs(filePath);
            logger.info('✅ [MiPlanilla] PDF Guardado.');
            await browser.close();
            return filePath;
        }

        logger.warn('⚠️ [MiPlanilla] Consulta realizada pero no se encontró botón de descarga.');
        await browser.close();
        return null;
    } catch (error) {
        logger.error(`❌ [MiPlanilla] Error: ${error.message}`);
        await browser.close();
        throw error;
    }
};

/**
 * Lógica para Asopagos (antes Enlace Operativo)
 */
export const scrapeAsopagos = async (data) => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
        logger.info('🚀 [Asopagos] Accediendo a interssi/.plus o página de Asopagos...');
        await page.goto('https://www.enlace-apb.com/interssi/.plus', { waitUntil: 'networkidle' });
        await randomDelay(page, 2000, 4500);

        logger.info('📝 [Asopagos] Completando credenciales de identidad...');
        
        if (data.tipoDocumento) {
            logger.info(`📝 [Asopagos] Seleccionando tipo de documento: ${data.tipoDocumento}`);
            await page.selectOption('select[id*="TipoDoc"], select[name*="tipo_doc"]', data.tipoDocumento).catch(() => null);
            await randomDelay(page, 500, 1000);
        }

        await page.fill('input[name="usuario"], input[name*="documento"], input[id*="Documento"]', data.numeroDocumento).catch(() => null);
        await randomDelay(page, 1000, 2500);
        
        if (data.periodo) {
            const [year, month] = data.periodo.split('-');
            logger.info(`📅 [Asopagos] Año y mes seleccionados: ${year}-${month}`);
            await page.selectOption('select[id*="Anio"], select[name*="anio"]', year).catch(() => null);
            await randomDelay(page, 500, 1000);
            await page.selectOption('select[id*="Mes"], select[name*="mes"]', parseInt(month).toString()).catch(() => null);
            await randomDelay(page, 500, 1000);
        }

        const tipoReporte = data.tipoReporte || 'Pago sin valores';
        logger.info(`📄 [Asopagos] Seleccionando tipo de reporte: ${tipoReporte}`);
        await page.selectOption('select[id*="Reporte"], select[name*="tipo_reporte"]', tipoReporte).catch(() => null);
        await randomDelay(page, 500, 1000);

        logger.info('⏳ [Asopagos] Procesando página...');
        await randomDelay(page, 2000, 4000);

        logger.info('⚠️ [Asopagos] NOTA: Este sitio suele requerir login previo o sesión activa.');
        await browser.close();
        return null;
    } catch (error) {
        logger.error(`❌ [Asopagos] Error: ${error.message}`);
        await browser.close();
        throw error;
    }
}

/**
 * Lógica específica para SOI
 */
export const scrapeSOI = async (data) => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    const downloadPath = path.resolve('temp_downloads');

    try {
        logger.info(`🚀 [SOI] Iniciando scraping para Doc: ${data.numeroDocumento}`);
        await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', { waitUntil: 'networkidle' });
        await randomDelay(page, 2000, 4000);

        logger.info('📝 [SOI] Seleccionando tipo de documento aportante...');
        await page.selectOption('#tipoDocumentoAportante', data.tipoDocumento || 'CC');
        await randomDelay(page, 1000, 2000);
        await page.fill('#numeroDocumentoAportante', data.numeroDocumento);
        await randomDelay(page, 1000, 2000);

        logger.info('🖱️ [SOI] Clic en Certificados por cotizante...');
        await page.click('a.btn-success:has-text("Certificados por cotizante")');
        await randomDelay(page, 1500, 3000);

        logger.info('📝 [SOI] Completando datos del cotizante...');
        await page.selectOption('#tipoDocumentoCotizante', data.tipoDocumento || 'CC');
        await randomDelay(page, 1000, 2000);
        await page.fill('#numeroDocumentoCotizante', data.numeroDocumento);
        await randomDelay(page, 1000, 2000);

        if (data.periodo) {
            const [year, month] = data.periodo.split('-');
            logger.info(`📅 [SOI] Periodo seleccionado: ${year}-${month}`);
            await page.selectOption('#periodoLiqSaludAnnio', year);
            await randomDelay(page, 600, 1500);
            await page.selectOption('#periodoLiqSaludMes', parseInt(month).toString());
            await randomDelay(page, 600, 1500);
        }

        logger.info('⏳ [SOI] Buscando captcha final...');
        await randomDelay(page, 2000, 4000);
        const captcha = await solveImageCaptcha(page, '#captchaImg');
        if (captcha) {
            await page.fill('#captchaInput', captcha);
            await randomDelay(page, 1000, 2000);
        }

        logger.info('📥 [SOI] Solicitando descarga de PDF...');
        const downloadPromise = page.waitForEvent('download').catch(() => null);
        await page.click('button.btn-success:has-text("Descargar PDF")');
        
        const download = await downloadPromise;
        if (download) {
            const filePath = path.join(downloadPath, `SOI_${data.numeroDocumento}_${data.periodo}.pdf`);
            await download.saveAs(filePath);
            logger.info('✅ [SOI] Descarga exitosa.');
            await browser.close();
            return filePath;
        }

        logger.warn('⚠️ [SOI] El clic no resultó en una descarga inmediata.');
        await browser.close();
        return null;
    } catch (error) {
        logger.error(`❌ [SOI] Error: ${error.message}`);
        await browser.close();
        throw error;
    }
};

/**
 * Orquestador de descargas por entidad
 */
export const downloadCertificate = async (contratista, entityData = null) => {
    if (entityData) {
        const { entity, data } = entityData;
        logger.info(`⚙️ Orquestador: Identificando lógica para "${entity}"`);

        switch (entity) {
            case 'soi':
                return await scrapeSOI(data);
            case 'miplanilla':
                return await scrapeMiPlanilla(data);
            case 'aportes':
                return await scrapeAportes(data);
            case 'asopagos':
                return await scrapeAsopagos(data);
            default:
                logger.warn(`🛑 Entidad no soportada: ${entity}`);
        }
    }
    return null;
};
