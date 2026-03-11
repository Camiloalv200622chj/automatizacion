import { chromium } from 'playwright';
import logger from './logger.js';
import path from 'path';
import fs from 'fs';
import { processCertificate } from './fileService.js'; // Importamos el procesador de archivos

/**
 * Escribe texto simulando a un humano
 */
async function typeLikeHuman(page, selector, text) {
    try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        const element = page.locator(selector);
        await element.click();
        await element.fill(''); 
        await element.pressSequentially(text, { delay: 120 });
        await page.waitForTimeout(400);
    } catch (e) {
        logger.warn(`No se pudo teclear en ${selector}: ${e.message}`);
    }
}

/**
 * Selecciona una opción con búsqueda flexible y clics humanos
 */
async function selectOptionLikeHuman(page, selector, searchText) {
    if (!searchText) return;
    try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        await page.locator(selector).click();
        await page.waitForTimeout(1000);

        const targetValue = await page.evaluate(({ sel, text }) => {
            const select = document.querySelector(sel);
            const options = Array.from(select.options);
            const search = text.trim().toLowerCase();
            const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanSearch = clean(search);

            let found = options.find(opt => clean(opt.text).includes(cleanSearch) || clean(opt.value) === cleanSearch);
            if (!found && /\d+/.test(search)) {
                const number = search.match(/\d+/)[0];
                found = options.find(opt => opt.text.includes(number));
            }
            if (!found) {
                const keywords = search.split(/[\s\-\.]+/).filter(k => k.length > 2);
                found = options.find(opt => keywords.every(key => opt.text.toLowerCase().includes(key)));
            }
            return found ? found.value : null;
        }, { sel: selector, text: searchText });

        if (targetValue) {
            await page.selectOption(selector, targetValue);
            await page.evaluate((sel) => {
                const el = document.querySelector(sel);
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }, selector);
        }
        await page.waitForTimeout(800);
    } catch (e) {
        logger.warn(`Fallo selección humana en ${selector}: ${e.message}`);
    }
}

/**
 * Lógica específica para SOI
 */
export const scrapeSOI = async (data) => {
    let browser;
    try {
        browser = await chromium.launch({ 
            headless: false,
            channel: 'msedge', 
            slowMo: 100 
        });
        
        const downloadPath = path.resolve('temp_downloads');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();

        logger.info(`Iniciando sesión para SOI - Doc: ${data.numeroDocumento}`);
        await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', { 
            waitUntil: 'networkidle',
            timeout: 60000 
        });

        await selectOptionLikeHuman(page, '#tipoDocumentoAportante', data.tipoDocumentoAportante || 'Cédula de Ciudadanía');
        await typeLikeHuman(page, 'input[name="numeroDocumentoAportante"]', data.numeroDocumentoAportante || data.numeroDocumento);

        await selectOptionLikeHuman(page, '#tipoDocumentoCotizante', data.tipoDocumento || 'Cédula de Ciudadanía');
        await typeLikeHuman(page, '#numeroDocumentoCotizante', data.numeroDocumento);
        
        if (data.eps) {
            await selectOptionLikeHuman(page, '#administradoraSalud', data.eps);
        }

        if (data.periodo) {
            const [year, month] = data.periodo.split('-');
            const monthInt = parseInt(month).toString();
            await page.selectOption('#periodoLiqSaludMes', monthInt);
            await page.selectOption('#periodoLiqSaludAnnio', year);
        }

        await page.waitForTimeout(2000);

        logger.info('SOI: Intentando descargar archivo...');
        const downloadPromise = page.waitForEvent('download', { timeout: 40000 });
        
        const downloadButton = page.locator('button:has-text("Descargar PDF"), input[value="Descargar PDF"], .btn-success:has-text("Descargar")').first();
        await downloadButton.click();
        
        const download = await downloadPromise;
        const originalName = download.suggestedFilename();
        const extension = originalName.toLowerCase().endsWith('.zip') ? '.zip' : '.pdf';
        
        const tempFilePath = path.join(downloadPath, `temp_download_${Date.now()}${extension}`);
        await download.saveAs(tempFilePath);
        
        logger.info(`Archivo descargado: ${originalName}. Procesando...`);

        // Usamos el servicio de archivos para descomprimir y renombrar correctamente
        const finalPdfPath = await processCertificate(tempFilePath, {
            nombreCompleto: data.nombreCompleto || 'Contratista',
            numeroDocumento: data.numeroDocumento,
            periodo: data.periodo
        });

        await page.waitForTimeout(2000);
        await browser.close();
        return finalPdfPath;

    } catch (error) {
        logger.error(`Error en flujo SOI: ${error.message}`);
        if (browser) {
            try { await browser.close(); } catch (e) { /* ignore */ }
        }
        throw error;
    }
};

/**
 * Orquestador de descargas
 */
export const downloadCertificate = async (contratista, entityData = null) => {
    if (entityData) {
        const { entity, data } = entityData;
        try {
            if (entity === 'soi') return await scrapeSOI(data);
            if (entity === 'miplanilla') return await scrapeMiPlanilla(data);
        } catch (e) {
            logger.error(`Error en orquestador para ${entity}: ${e.message}`);
            throw e;
        }
    }
    return null;
};

/**
 * Lógica específica para MiPlanilla
 */
export const scrapeMiPlanilla = async (data) => {
    let browser;
    try {
        browser = await chromium.launch({ headless: false, channel: 'msedge', slowMo: 100 });
        const downloadPath = path.resolve('temp_downloads');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();

        await page.goto('https://empresas.miplanilla.com/Registro/Certificado/CertificadoAgil', { waitUntil: 'networkidle' });
        await page.locator('input[name="rdTipoAporte"][value="1"]').click();
        await selectOptionLikeHuman(page, '#tipoDocumentoAportante', data.tipoDocumento || 'Cédula de Ciudadanía');
        await typeLikeHuman(page, '#numeroDocumentoAportante', data.numeroDocumento);

        if (data.periodo) {
            const [year, month] = data.periodo.split('-');
            const monthInt = parseInt(month).toString();
            await selectOptionLikeHuman(page, '#mesInicio', monthInt);
            await selectOptionLikeHuman(page, '#anioInicio', year);
            await selectOptionLikeHuman(page, '#mesFinal', monthInt);
            await selectOptionLikeHuman(page, '#anioFinal', year);
        }

        await page.locator('#btnContinuar').click();
        await page.waitForTimeout(5000);
        await browser.close();
        return null; 
    } catch (error) {
        logger.error(`Error en MiPlanilla: ${error.message}`);
        if (browser) await browser.close();
        throw error;
    }
};
