import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import Tesseract from 'tesseract.js';
import logger from './logger.js';
import path from 'path';
import fs from 'fs';
import * as TwoCaptcha from '2captcha';

chromium.use(StealthPlugin());

/**
 * Resuelve captchas usando el servicio 2captcha
 */
async function solveWith2Captcha(screenshotPath) {
    try {
        const apiKey = process.env.TWO_CAPTCHA_API_KEY;
        if (!apiKey) {
            logger.warn('2captcha API key no configurada en .env');
            return null;
        }

        const solver = new TwoCaptcha.Solver(apiKey);
        logger.info(`Enviando captcha a 2captcha...`);
        
        const base64Image = fs.readFileSync(screenshotPath, 'base64');
        const result = await solver.imageCaptcha(base64Image);
        logger.info(`2captcha resolvió el captcha: ${result.data}`);
        return result.data;
    } catch (error) {
        logger.error(`Error en 2captcha: ${error.message}`);
        return null;
    }
}

/**
 * Resuelve reCAPTCHA V2 Enterprise usando el servicio 2captcha
 */
async function solveRecaptchaV2Enterprise(page, url, siteKey) {
    try {
        const apiKey = process.env.TWO_CAPTCHA_API_KEY;
        if (!apiKey) {
            logger.warn('2captcha API key no configurada en .env');
            return null;
        }

        const solver = new TwoCaptcha.Solver(apiKey);
        logger.info(`Enviando reCAPTCHA V2 Enterprise a 2captcha...`);
        
        const result = await solver.recaptcha(siteKey, url, {
            enterprise: 1
        });
        
        logger.info(`2captcha resolvió el reCAPTCHA`);
        return result.data;
    } catch (error) {
        logger.error(`Error en 2captcha (reCAPTCHA): ${error.message}`);
        return null;
    }
}

/**
 * Resuelve reCAPTCHA V2 Estándar usando el servicio 2captcha
 */
async function solveRecaptchaV2(page, url, siteKey) {
    try {
        const apiKey = process.env.TWO_CAPTCHA_API_KEY;
        if (!apiKey) {
            logger.warn('2captcha API key no configurada en .env');
            return null;
        }

        const solver = new TwoCaptcha.Solver(apiKey);
        logger.info(`Enviando reCAPTCHA V2 a 2captcha...`);
        
        const result = await solver.recaptcha(siteKey, url);
        
        logger.info(`2captcha resolvió el reCAPTCHA`);
        return result.data;
    } catch (error) {
        logger.error(`Error en 2captcha (reCAPTCHA V2): ${error.message}`);
        return null;
    }
}

/**
 * Resuelve captchas básicos de imagen usando OCR (Tesseract.js) o 2captcha
 */
async function solveImageCaptcha(page, selector, use2Captcha = true) {
    try {
        const element = await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });
        if (!element) return null;

        const screenshotPath = path.resolve('temp_captcha.png');
        await element.screenshot({ path: screenshotPath });

        let cleanedText = null;

        // Intentar con 2captcha solo si está habilitado
        if (use2Captcha) {
            cleanedText = await solveWith2Captcha(screenshotPath);
        }

        // Fallback a Tesseract si 2captcha falla o no se usa
        if (!cleanedText) {
            if (use2Captcha) {
                logger.info('Fallback a Tesseract OCR...');
            } else {
                logger.info('Usando Tesseract OCR (2captcha saltado)...');
            }
            const { data: { text } } = await Tesseract.recognize(screenshotPath, 'eng');
            cleanedText = text.replace(/[^a-zA-Z0-9]/g, '').trim();
            logger.info(`Captcha detectado (Tesseract): ${cleanedText}`);
        }

        if (fs.existsSync(screenshotPath)) {
            fs.unlinkSync(screenshotPath);
        }

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
    const browser = await chromium.launch({ headless: false });
    // Configurar descarga
    const downloadPath = path.resolve('temp_downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const context = await browser.newContext({
        acceptDownloads: true
    });
    const page = await context.newPage();

    try {
        logger.info(`Iniciando scraping para SOI - Doc: ${data.numeroDocumento}`);

        // Escuchar alertas o popups de la página web
        page.on('dialog', async dialog => {
            logger.warn(`================================================`);
            logger.warn(`🚨 POPUP / ALERTA DE SOI DETECTADA: "${dialog.message()}"`);
            logger.warn(`================================================`);
            await dialog.accept();
        });

        await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', { waitUntil: 'networkidle' });

        // ¡PARCHE CRÍTICO PARA BUG DE LA PÁGINA SOI! 
        logger.info('> Inyectando parche para evitar colapso del frontend de SOI (limpiarFormulario)...');
        await page.evaluate(() => {
            window.limpiarFormulario = function () {
                // Silently intercept missing function
            };
            window.onerror = function (msg) {
                return true;
            };
        });

        const mapDocTextToValue = {
            'Cédula de ciudadanía': '1',
            'Carné diplomático': '8',
            'Cédula de extranjería': '6',
            'NIT': '2',
            'Pasaporte': '5',
            'Permiso especial permanencia': '9',
            'Permiso por protección temporal': '10',
            'Salvo conducto': '7',
            'Tarjeta de identidad': '3',
            'CC': '1',
            'TI': '3',
            'CE': '6',
            'PEP': '9'
        };

        const rawTipoAportante = data.tipoDocumentoAportante || data.tipoDocumento || 'Cédula de ciudadanía';
        const valueToSelect = mapDocTextToValue[rawTipoAportante] || '1';
        logger.debug(`Tipo de documento aportante: ${rawTipoAportante} -> ${valueToSelect}`);

        logger.info(`> Seleccionando tipo de documento aportante: ${valueToSelect}`);
        await page.selectOption('#tipoDocumentoAportante', valueToSelect);

        const docAportante = data.documentoAportante || data.numeroDocumento;
        const rawTipoCotizante = data.tipoDocumento || 'Cédula de ciudadanía';
        const valueToSelectCotizante = mapDocTextToValue[rawTipoCotizante] || '1';

        logger.info('--- PASO 1 y 2: Inyectando todos los datos silenciosamente ---');
        await page.evaluate((d) => {
            const setVal = (sel, val) => {
                const el = document.querySelector(sel);
                if (el) el.value = val;
            };
            setVal('#tipoDocumentoAportante', d.vApo);
            setVal('input[name="numeroDocumentoAportante"]', d.dApo);
            setVal('#tipoDocumentoCotizante', d.vCot);
            setVal('#numeroDocumentoCotizante', d.dCot);
        }, {
            vApo: valueToSelect,
            dApo: docAportante,
            vCot: valueToSelectCotizante,
            dCot: data.numeroDocumento
        });
        await page.waitForTimeout(500);
        logger.info('> Datos de cédula introducidos con éxito sin alertar a la página.');

        if (data.eps) {
            logger.info(`--- PASO 3: Resolviendo la EPS: ${data.eps} ---`);
            const selectEps = page.locator('#administradoraSalud');
            try {
                await selectEps.waitFor({ state: 'attached', timeout: 10000 });
                await selectEps.click({ force: true });
                await page.waitForTimeout(1000);
            } catch (e) {
                logger.warn('> No se pudo hacer clic en administradoraSalud para desplegar');
            }

            try {
                await page.waitForFunction(() => {
                    const select = document.querySelector('#administradoraSalud');
                    return select && select.options.length > 1;
                }, { timeout: 10000 });
            } catch (e) {
                logger.warn('> Las opciones de EPS no cargaron a tiempo.');
            }

            const epsOptions = await page.evaluate(() => {
                const select = document.querySelector('#administradoraSalud');
                if (!select) return [];
                return Array.from(select.options)
                    .map(opt => ({ val: opt.value, text: opt.text.trim() }))
                    .filter(opt => opt.text !== '' && opt.text !== 'Seleccione...');
            });

            const matchedEps = epsOptions.find(opt => opt.text.toLowerCase().includes(data.eps.toLowerCase()));
            if (matchedEps) {
                logger.info(`✓ Coincidencia encontrada! Seleccionando exactamente: "${matchedEps.text}"`);
                await page.selectOption('#administradoraSalud', matchedEps.val);
            } else {
                logger.warn(`❌ No se encontró la EPS: "${data.eps}".`);
            }
        }

        // --- RESOLVER CAPTCHA DE SOI (Tesseract solamente) ---
        try {
            await page.waitForSelector('#captchaImage', { timeout: 10000 });
            const textoCaptcha = await solveImageCaptcha(page, '#captchaImage', false);
            if (textoCaptcha) {
                await page.fill('#captcha', textoCaptcha);
            }
        } catch (e) {
            logger.warn('No se pudo resolver el captcha de SOI o no apareció.');
        }

        if (data.periodo) {
            logger.info(`Seleccionando periodo: ${data.periodo}`);
            const [year, month] = data.periodo.split('-');
            await page.waitForSelector('#periodoLiqSaludAnnio', { state: 'visible', timeout: 15000 });
            await page.selectOption('#periodoLiqSaludAnnio', year);
            await page.waitForSelector('#periodoLiqSaludMes', { state: 'visible', timeout: 15000 });
            await page.selectOption('#periodoLiqSaludMes', parseInt(month).toString());
        }

        logger.info('SOI: Formulario completado. Iniciando descarga...');

        const downloadPromise = page.waitForEvent('download');
        await page.click('button.btn-success:has-text("Descargar PDF")');
        const download = await downloadPromise;
        const suggestedFileName = download.suggestedFilename();
        const ext = path.extname(suggestedFileName).toLowerCase();

        const fileName = `SOI_${data.numeroDocumento}_${data.periodo}${ext}`;
        const filePath = path.join(downloadPath, fileName);

        await download.saveAs(filePath);
        logger.info(`SOI: Guardado en: ${filePath}`);

        await browser.close();
        return filePath;
    } catch (error) {
        logger.error(`❌ Error fatal en scraping SOI: ${error.message}`);
        try {
            const emergencyPath = path.join(downloadPath, `ERROR_SOI_${Date.now()}.png`);
            await page.screenshot({ path: emergencyPath, fullPage: true });
        } catch (e) {}
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

/**
 * Lógica específica para Aportes en Línea
 */
export const scrapeAportesEnLinea = async (data) => {
    const browser = await chromium.launch({ headless: false });
    const downloadPath = path.resolve('temp_downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    try {
        logger.info(`Iniciando scraping para Aportes en Línea - Doc: ${data.numeroDocumento}`);
        
        const url = 'https://empresas.aportesenlinea.com/Autoservicio/CertificadoAportes.aspx';
        
        let attempts = 0;
        let success = false;
        let filePath = null;

        while (!success && attempts < 5) {
            attempts++;
            logger.info(`Intento ${attempts} de 5 para Aportes en Línea...`);
            
            try {
                await page.goto(url, { waitUntil: 'networkidle' });

                const mapDocAportes = {
                    'CC': '1',
                    'TI': '2',
                    'CE': '3',
                    'NIT': '4',
                    'Pasaporte': '5',
                    'PE': '12',
                    'PPT': '13'
                };

                const tipoDoc = mapDocAportes[data.tipoDocumento] || '1';
                await page.selectOption('#contenido_ddlTipoIdent', tipoDoc);
                await page.fill('#contenido_tbNumeroIdentificacion', data.numeroDocumento);
                
                if (data.fechaExpedicion) {
                    const formattedDate = data.fechaExpedicion.replace(/-/g, '/');
                    await page.fill('#contenido_txtFechaExp', formattedDate || '');
                }

                if (data.eps) {
                    logger.info(`  -> Escribiendo y seleccionando EPS: ${data.eps}`);
                    await page.locator('#contenido_txtAdmin').type(data.eps, { delay: 100 });
                    await page.waitForTimeout(2000); // Esperar a que se despliegue el autocompletar
                    await page.keyboard.press('ArrowDown');
                    await page.waitForTimeout(500);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(1000);
                }

                if (data.periodoInicio) {
                    const [year, month] = data.periodoInicio.split('-');
                    await page.selectOption('#contenido_ddlAnioIni', year);
                    await page.selectOption('#contenido_ddlMesIni', parseInt(month).toString());
                }

                if (data.periodoFin) {
                    const [year, month] = data.periodoFin.split('-');
                    await page.selectOption('#contenido_ddlAnioFin', year);
                    await page.selectOption('#contenido_ddlMesFin', parseInt(month).toString());
                }

                const siteKey = '6Lc6FDMUAAAAAKwQX0_xF92Z1MiUXm4sYbQ6bh6J';
                const token = await solveRecaptchaV2Enterprise(page, url, siteKey);

                if (token) {
                    logger.info("  -> Inyectando token de reCAPTCHA...");
                    await page.evaluate((t) => {
                        const el = document.getElementById('g-recaptcha-response');
                        if (el) el.innerHTML = t;
                        const el2 = document.getElementById('g-recaptcha-response-1');
                        if (el2) el2.innerHTML = t;
                    }, token);
                    
                    // Lógica "Verify Then Send": Verificar que el token esté realmente en el DOM
                    const isTokenPresent = await page.evaluate(() => {
                        const el = document.getElementById('g-recaptcha-response');
                        return el && el.innerHTML.length > 50;
                    });
                    
                    if (!isTokenPresent) {
                        throw new Error("Fallo al inyectar el token en el DOM. Reintentando...");
                    }
                    logger.info("  -> Token verificado en el DOM.");
                } else {
                    throw new Error("No se pudo resolver el reCAPTCHA.");
                }

                logger.info("  -> Enviando formulario y esperando nueva pestaña...");
                
                // --- ESTRATEGIA DE CAPTURA POR RED (Simplificada) ---
                let capturedBuffer = null;
                let capturedExt = '.pdf';
                const onResponse = async (response) => {
                    try {
                        const url = response.url();
                        const contentType = (response.headers()['content-type'] || '').toLowerCase();
                        const buffer = await response.body();
                        
                        if (buffer.length > 1000) { // Ignorar buffers pequeños
                            const isPdf = buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50; // %PDF
                            const isZip = buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B; // PK
                            
                            if (isPdf || isZip) {
                                logger.info(`  -> Archivo detectado en red (${isPdf ? 'PDF' : 'ZIP'}): ${url.substring(0, 100)}...`);
                                capturedBuffer = buffer;
                                capturedExt = isZip ? '.zip' : '.pdf';
                            }
                        }
                    } catch (e) { /* ignore */ }
                };
                context.on('response', onResponse);

                // Escuchar creación de nueva pestaña
                const newPagePromise = context.waitForEvent('page', { timeout: 60000 }).catch(() => null);
                
                await page.click('#contenido_btnCalcular');
                
                const newPage = await newPagePromise;
                
                const periodStr = data.periodo || (data.periodoInicio ? `${data.periodoInicio}_${data.periodoFin}` : 'unspecified');
                const baseFileName = `APORTES_${data.numeroDocumento}_${periodStr}`;
                filePath = path.join(downloadPath, baseFileName);

                // Esperar un momento para la intercepción (aumentamos a 12s)
                await page.waitForTimeout(12000);

                if (capturedBuffer) {
                    logger.info(`  -> Guardando archivo capturado por red (${capturedExt})`);
                    filePath += capturedExt;
                    fs.writeFileSync(filePath, capturedBuffer);
                    success = true;
                } else if (newPage) {
                    logger.info(`  -> Nueva pestaña abierta: ${newPage.url()}. Intentando clic manual...`);
                    
                    try {
                        await newPage.waitForLoadState('load', { timeout: 30000 });
                        await newPage.waitForTimeout(5000);

                        const downloadPromise = newPage.waitForEvent('download', { timeout: 30000 }).catch(() => null);
                        
                        // Selectores de iconos más amplios
                        const iconSelectors = [
                            'button[title*="Descargar"]', 'button[title*="descargar"]',
                            '#download', '#btnDescargar', '.e-pv-download-icon', 
                            '[class*="download"]', 'path[d*="M19 9h-4V3H9v6H5l7 7 7-7z"]',
                            'a:has-text("Descargar")', 'button:has-text("Descargar")',
                            '#contenido_btnDescargar'
                        ];

                        for (const selector of iconSelectors) {
                            try {
                                const btn = newPage.locator(selector).first();
                                if (await btn.isVisible({ timeout: 1500 })) {
                                    logger.info(`  -> Clic en selector manual: ${selector}`);
                                    await btn.click({ force: true });
                                    break;
                                }
                            } catch (e) {}
                        }

                        const download = await downloadPromise;
                        if (download) {
                            const suggestedExt = path.extname(download.suggestedFilename()).toLowerCase() || '.pdf';
                            filePath += suggestedExt;
                            logger.info(`  -> Descarga manual detectada: ${suggestedExt}`);
                            await download.saveAs(filePath);
                            success = true;
                        }
                    } catch (e) {
                         logger.error(`Fallo en procesamiento de pestaña: ${e.message}`);
                    }
                }

                if (!success) {
                    // Penúltimo intento: ver si ya hay una descarga pendiente en el contexto original
                    const fallbackDownload = await page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
                    if (fallbackDownload) {
                        const ext = path.extname(fallbackDownload.suggestedFilename()).toLowerCase() || '.pdf';
                        filePath += ext;
                        logger.info(`  -> Descarga de respaldo detectada: ${ext}`);
                        await fallbackDownload.saveAs(filePath);
                        success = true;
                    }
                }

                // Limpiar listener de red
                context.off('response', onResponse);

                if (success) {
                    logger.info(`Aportes en Línea: Proceso completado exitosamente: ${filePath}`);
                    return filePath;
                } else {
                    throw new Error("No se pudo obtener el PDF ni por red ni por descarga manual.");
                }
            } catch (err) {
                logger.warn(`Intento ${attempts} falló: ${err.message}`);
                if (attempts >= 5) throw err;
            }
        }
    } catch (error) {
        logger.error(`❌ Error fatal en scraping Aportes en Línea: ${error.message}`);
        throw error;
    } finally {
        if (browser) await browser.close();
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
            case 'asopagos':
                return await scrapeAsopagos(data);
            case 'aportes':
                return await scrapeAportesEnLinea(data);
            default:
                logger.warn(`Entidad no soportada: ${entity}`);
        }
    }

    if (contratista) {
        return await scrapeSENA(contratista);
    }
    return null;
};

/**
 * Lógica específica para SENA
 */
export const scrapeSENA = async (contratista) => {
    const browser = await chromium.launch({ headless: false });
    const downloadPath = path.resolve('temp_downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    try {
        logger.info(`Iniciando scraping SENA para: ${contratista.nombreCompleto}`);
        const fileName = `SENA_${contratista.numeroDocumento}.pdf`;
        const filePath = path.join(downloadPath, fileName);
        fs.writeFileSync(filePath, "PDF CONTENT STUB");

        await browser.close();
        return filePath;
    } catch (error) {
        logger.error(`Error en scraping SENA: ${error.message}`);
        if (browser) await browser.close();
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

/**
 * Lógica específica para MiPlanilla
 */
export const scrapeMiPlanilla = async (data) => {
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const downloadPath = path.resolve('temp_downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    try {
        logger.info(`Iniciando scraping MiPlanilla (Nueva URL) - Doc: ${data.numeroDocumento}`);
        const url = 'https://www.miplanilla.com/Private/Consultaplanillaindependiente.aspx';
        
        let attempts = 0;
        let success = false;
        let finalFilePath = null;

        while (!success && attempts < 5) {
            attempts++;
            logger.info(`Intento ${attempts} de 5 para MiPlanilla...`);

            try {
                logger.info("  -> Navegando a URL...");
                await page.goto(url, { waitUntil: 'load', timeout: 60000 });
                logger.info("  -> Llenando formulario...");

                const mapDocMiPlanilla = {
                    'CC': 'CC',
                    'TI': 'TI',
                    'CE': 'CE',
                    'PEP': 'PE' 
                };

                const rawTipo = data.tipoDocumento || 'CC';
                const inputToSelect = mapDocMiPlanilla[rawTipo] || rawTipo;
                logger.info(`  -> Llenando doc Aportante: ${inputToSelect} - ${data.numeroDocumento}`);
                
                await page.selectOption('#cp1_ddlTipoDocumento', inputToSelect);
                await page.locator('#cp1_txtNumeroDocumento').type(data.numeroDocumento, { delay: 100 });

                if (data.numeroPlanilla) {
                    await page.locator('#cp1_txtNumeroPlanilla').type(data.numeroPlanilla, { delay: 100 });
                }

                if (data.fechaPago) {
                    const [year, month, day] = data.fechaPago.split('-');
                    await page.selectOption('#cp1_cmbDiaPago', parseInt(day).toString());
                    await page.selectOption('#cp1_cmbMesPago', parseInt(month).toString());
                    await page.selectOption('#cp1_ddlAnoPago', year);
                }

                if (data.periodo) {
                    const [year, month] = data.periodo.split('-');
                    await page.selectOption('#cp1_ddlMesSalud', parseInt(month).toString());
                    await page.selectOption('#cp1_ddlAnoSalud', year);
                }

                if (data.valorPagado) {
                    await page.locator('#cp1_txtValorPagado').type(data.valorPagado.toString(), { delay: 100 });
                }

                logger.info("  -> Resolviendo Captcha de imagen...");
                const imgSelector = 'img[src*="captchaImage"]';
                await page.waitForSelector(imgSelector, { state: 'visible', timeout: 15000 });
                const textoCaptcha = await solveImageCaptcha(page, imgSelector, true);
                if (textoCaptcha) {
                    await page.locator('#cp1_txtCaptcha').type(textoCaptcha, { delay: 100 });
                }

                logger.info("  -> Enviando formulario...");
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }).catch(() => null),
                    page.click('#cp1_ButtonConsultar')
                ]);

                logger.info("  -> Verificando resultados...");
                
                // Esperar a que aparezca la tabla de éxito o algún mensaje de error
                try {
                    await page.waitForFunction(() => {
                        const text = document.body.innerText;
                        return text.includes('Administradoras pagadas') || 
                               text.includes('No se encontraron') || 
                               text.includes('Verifique su informacion') || 
                               text.includes('El código ingresado no coincide');
                    }, { timeout: 15000 });
                } catch(e) {
                    logger.warn("  -> Timeout esperando resultado claro. Evaluando DOM actual.");
                }

                const pageText = await page.locator('body').innerText();
                const errorAlert = await page.locator('.mensajeAdvertencia, span[id*="reqvalCaptcha"], span[style*="color:Red"]').isVisible().catch(() => false);

                if (pageText.includes('El código ingresado no coincide')) {
                    throw new Error("Captcha incorrecto. Reintentando...");
                }

                if (!pageText.includes('Administradoras pagadas')) {
                     if (pageText.includes('No se encontraron') || pageText.includes('Verifique su informacion')) {
                         throw new Error("PENDIENTE: No se generó la tabla de pagos (Planilla pendiente/no encontrada).");
                     } else if (errorAlert) {
                         throw new Error("Faltan datos o captcha incorrecto. Reintentando...");
                     } else {
                         throw new Error("PENDIENTE: Resultado no reconocido, no se vio la tabla. Asumiendo que falta pago.");
                     }
                }

                logger.info("  -> Tabla 'Administradoras pagadas' generada, tomando captura...");
                // Hacer scroll un poco para enfocar la tabla mejor en la captura si se quiere, pero fullPage suele ser suficiente
                const pngName = `MIPLANILLA_${data.numeroDocumento}_${Date.now()}.png`;
                const pngPath = path.join(downloadPath, pngName);
                
                await page.screenshot({ path: pngPath, fullPage: true });

                const { PDFDocument } = await import('pdf-lib');
                const fsPromises = await import('fs/promises');
                const pdfDoc = await PDFDocument.create();
                const pngImageBytes = await fsPromises.readFile(pngPath);
                const pngImage = await pdfDoc.embedPng(pngImageBytes);

                const pagePdf = pdfDoc.addPage([pngImage.width, pngImage.height]);
                pagePdf.drawImage(pngImage, {
                    x: 0,
                    y: 0,
                    width: pngImage.width,
                    height: pngImage.height,
                });

                const pdfBytes = await pdfDoc.save();
                const ext = '.pdf';
                const fileName = `MIPLANILLA_${data.numeroDocumento}_${data.periodo || Date.now()}${ext}`;
                finalFilePath = path.join(downloadPath, fileName);
                
                await fsPromises.writeFile(finalFilePath, pdfBytes);
                await fsPromises.unlink(pngPath).catch(() => {});

                logger.info(`MiPlanilla: Screenshot guardado y convertido a PDF en: ${finalFilePath}`);
                success = true;
                return finalFilePath;

            } catch (err) {
                logger.warn(`  -> Intento ${attempts} falló: ${err.message}`);
                if (err.message.includes('PENDIENTE')) {
                    throw new Error(`ESTADO: Pendiente - ${err.message}`); // Will be caught by main catch or orchestrator 
                }
                if (attempts >= 5) {
                    logger.error(`  -> Se agotaron los 5 intentos para MiPlanilla.`);
                    throw new Error(`Fallo definitivo en MiPlanilla después de 5 intentos: ${err.message}`);
                }
                await page.waitForTimeout(3000); 
            }
        }
    } catch (error) {
        logger.error(`❌ Error crítico en MiPlanilla: ${error.message}`);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

/**
 * Lógica específica para Asopagos
 */
export const scrapeAsopagos = async (data) => {
    const browser = await chromium.launch({ headless: false });
    const downloadPath = path.resolve('temp_downloads');
    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

    try {
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();
        const url = 'https://www.enlace-apb.com/interssi/descargarCertificacionPago.jsp';
        const captchaImageSelector = "img[src*='captchapopup']";
        const captchaInputSelector = '#captchaIn';

        const mapDoc = { 'Cédula de ciudadanía': 'CC', 'CC': 'CC', 'CE': 'CE', 'TI': 'TI', 'NIT': 'NI', 'PE': 'PE', 'PPT': 'PT' };
        const tipoDoc = mapDoc[data.tipoDocumento] || 'CC';
        const tipoRep = data.tipoReporte?.includes('con valores') ? 'conValores' : 'sinValores';

        let alertaMostrada = '';
        page.on('dialog', async d => { alertaMostrada = d.message(); logger.warn(`Alerta Asopagos: ${alertaMostrada}`); await d.dismiss(); });

        // Variable para capturar la respuesta del servidor interceptada
        let capturedPdfBuffer = null;
        let capturedErrorText = null;

        // =====================================================================
        // INTERCEPTAR la respuesta del servidor a ServletEmpleado.
        // Si el Content-Type es PDF, guardamos el buffer.
        // Si es HTML, capturamos el texto de error.
        // =====================================================================
        await page.route('**/ServletEmpleado**', async (route) => {
            logger.info('  -> [INTERCEPTOR] Interceptando request a ServletEmpleado...');
            const response = await route.fetch();
            const contentType = response.headers()['content-type'] || '';
            logger.info(`  -> [INTERCEPTOR] Content-Type: ${contentType}, Status: ${response.status()}`);

            if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
                // ¡ÉXITO! El servidor devolvió un PDF
                capturedPdfBuffer = await response.body();
                logger.info(`  -> [INTERCEPTOR] ✅ PDF capturado! Tamaño: ${capturedPdfBuffer.length} bytes`);
                // Devolver una página vacía para que el navegador NO se cierre
                await route.fulfill({
                    status: 200,
                    contentType: 'text/html',
                    body: '<html><body><h1>Certificado descargado exitosamente</h1></body></html>'
                });
            } else {
                // El servidor devolvió HTML (error)
                const body = await response.text();
                capturedErrorText = body;
                logger.warn(`  -> [INTERCEPTOR] ❌ Respuesta NO es PDF. Primeros 200 chars: ${body.substring(0, 200)}`);
                // Completar la navegación para que la página muestre el error
                await route.fulfill({ response });
            }
        });

        // =====================================================================
        // fillForm: Llenado con interacciones NATURALES
        // =====================================================================
        const fillForm = async () => {
            await page.waitForSelector('#tipoID', { state: 'visible', timeout: 20000 });
            await page.selectOption('#tipoID', tipoDoc);

            await page.click('#numeroID');
            await page.fill('#numeroID', '');
            await page.type('#numeroID', data.numeroDocumento, { delay: 30 });

            if (data.periodo) {
                const [year, month] = data.periodo.split('-');
                await page.click('#ano');
                await page.fill('#ano', '');
                await page.type('#ano', year, { delay: 30 });
                await page.selectOption('#mes', month);
            }

            await page.selectOption('#tipoReporte', tipoRep);

            // DISPARAR BLUR REAL con Tab para que jQuery ejecute consultarPlanillasPagas()
            await page.click('#numeroID');
            
            const ajaxPromise = page.waitForResponse(
                r => r.url().includes('ServletConsultaSucursal') && r.status() === 200,
                { timeout: 15000 }
            ).catch(() => null);

            await page.keyboard.press('Tab');

            logger.info('  -> Esperando AJAX ServletConsultaSucursal...');
            const ajaxResponse = await ajaxPromise;

            if (ajaxResponse) {
                logger.info('  -> ✅ Respuesta AJAX recibida.');
                await page.waitForTimeout(2000);
            } else {
                logger.warn('  -> ⚠️ No llegó AJAX. Intentando segundo blur...');
                await page.click('#ano');
                const p2 = page.waitForResponse(r => r.url().includes('ServletConsultaSucursal'), { timeout: 10000 }).catch(() => null);
                await page.keyboard.press('Tab');
                if (await p2) {
                    logger.info('  -> ✅ AJAX recibida en segundo intento.');
                    await page.waitForTimeout(2000);
                } else {
                    logger.warn('  -> ❌ No se pudo disparar AJAX.');
                }
            }

            // Verificar campo oculto
            const planillas = await page.evaluate(() => document.querySelector('input[name="tipos_numeros_planillas_pagas"]')?.value || '');
            logger.info(`  -> tipos_numeros_planillas_pagas = "${planillas.substring(0, 60) || 'VACÍO'}"`);

            // Asegurar campos ocultos
            await page.evaluate((d) => {
                const f = document.querySelector('#formCertPag');
                if (f) {
                    if (f.empleado) f.empleado.value = `${d.tipoDoc}--${d.numDoc}`;
                    if (f.clicks) f.clicks.value = '0';
                }
            }, { tipoDoc, numDoc: data.numeroDocumento });

            logger.info('  -> Formulario listo.');
        };

        const refreshCaptcha = async () => {
            const oldSrc = await page.getAttribute(captchaImageSelector, 'src').catch(() => null);
            await page.locator('i.fa-refresh').first().click({ force: true }).catch(() => {});
            if (oldSrc) {
                await page.waitForFunction(
                    (s, o) => document.querySelector(s)?.getAttribute('src') !== o,
                    { timeout: 5000 }, captchaImageSelector, oldSrc
                ).catch(() => {});
            }
            await page.waitForTimeout(1000);
        };

        // =====================================================================
        // Flujo principal
        // =====================================================================
        logger.info(`Scraping Asopagos: doc=${data.numeroDocumento}, periodo=${data.periodo}`);
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        await page.waitForSelector('#tipoID', { state: 'visible', timeout: 30000 });
        await fillForm();

        for (let i = 1; i <= 5; i++) {
            logger.info(`--- Intento ${i}/5 ---`);
            alertaMostrada = '';
            capturedPdfBuffer = null;
            capturedErrorText = null;

            // Si la página navegó a otra URL (por error previo), recargar
            if (!page.url().includes('descargarCertificacionPago.jsp')) {
                logger.info('  -> Recargando formulario...');
                await page.goto(url, { waitUntil: 'load', timeout: 60000 });
                await page.waitForSelector('#tipoID', { state: 'visible', timeout: 30000 });
                await fillForm();
            }

            try {
                // Resolver captcha
                const initialSrc = await page.getAttribute(captchaImageSelector, 'src');
                const textoCaptcha = await solveImageCaptcha(page, captchaImageSelector, true);
                if (!textoCaptcha || (await page.getAttribute(captchaImageSelector, 'src')) !== initialSrc) {
                    logger.warn('  -> Captcha no resuelto o cambió. Refrescando...');
                    await refreshCaptcha();
                    continue;
                }

                await page.click(captchaInputSelector, { clickCount: 3 });
                await page.keyboard.press('Backspace');
                await page.type(captchaInputSelector, textoCaptcha, { delay: 50 });

                // Asegurar clicks=0 antes de enviar
                await page.evaluate(() => {
                    const f = document.querySelector('#formCertPag');
                    if (f && f.clicks) f.clicks.value = '0';
                });

                // Log estado del formulario
                const st = await page.evaluate(() => {
                    const f = document.querySelector('#formCertPag');
                    if (!f) return 'NO FORM';
                    return JSON.stringify({
                        clicks: f.clicks?.value,
                        empleado: f.empleado?.value,
                        tipoID: f.tipoID?.value,
                        numeroID: f.numeroID?.value,
                        ano: f.ano?.value,
                        mes: f.mes?.value,
                        captchaLen: f.captchaIn?.value?.length,
                        planillas: f.tipos_numeros_planillas_pagas?.value?.substring(0, 50),
                        tarea: f.querySelector('input[name="tarea"]:checked')?.value
                    });
                });
                logger.info(`  -> PRE-ENVÍO: ${st}`);

                // =============================================================
                // ENVÍO DIRECTO: NO usamos page.click('#enviarConsRP') porque
                // el handler de validarCertificacion CAMBIA el campo 'tarea'
                // de 'verCertificadoTresNuevo' a 'enviarLinkDescargaCertificadoPago'
                // cuando tipoReporte='conValores'. Eso le dice al servidor que
                // envíe un link por email en vez de devolver el PDF directamente.
                //
                // En su lugar, hacemos form.submit() directamente, preservando
                // tarea='verCertificadoTresNuevo' para obtener el PDF siempre.
                // =============================================================
                logger.info('  -> Enviando formulario directamente (bypass validarCertificacion)...');
                await page.evaluate(() => {
                    const f = document.querySelector('#formCertPag');
                    if (f) {
                        // Asegurar que tarea NO sea cambiada
                        const tareaRadio = f.querySelector('input[name="tarea"]:checked');
                        if (tareaRadio) tareaRadio.value = 'verCertificadoTresNuevo';
                        // Asegurar empleado esté set
                        if (f.empleado && !f.empleado.value) {
                            f.empleado.value = f.tipoID.value + '--' + f.numeroID.value;
                        }
                        f.submit();
                    }
                });

                // Esperar a que el interceptor capture la respuesta (máx 25 seg)
                for (let w = 0; w < 50; w++) {
                    await page.waitForTimeout(500);
                    if (capturedPdfBuffer || capturedErrorText || alertaMostrada) break;
                }

                // Evaluar resultado
                if (capturedPdfBuffer) {
                    const pathFile = path.join(downloadPath, `ASOPAGOS_${data.numeroDocumento}_${data.periodo}.pdf`);
                    fs.writeFileSync(pathFile, capturedPdfBuffer);
                    logger.info(`  -> ¡ÉXITO! PDF guardado: ${pathFile} (${capturedPdfBuffer.length} bytes)`);
                    return pathFile;
                }

                if (alertaMostrada) {
                    logger.warn(`  -> Alerta: ${alertaMostrada}`);
                    if (alertaMostrada.toLowerCase().includes('no existe')) throw new Error(alertaMostrada);
                    if (alertaMostrada.toLowerCase().includes('captcha') || alertaMostrada.toLowerCase().includes('validación')) {
                        await refreshCaptcha();
                        continue;
                    }
                }

                if (capturedErrorText) {
                    logger.warn(`  -> Respuesta error del servidor: ${capturedErrorText.substring(0, 200)}`);
                    if (capturedErrorText.includes('no existe') || capturedErrorText.includes('no se encuentra')) {
                        throw new Error('Empleado no encontrado en planillas pagas.');
                    }
                    // Recargar formulario para reintentar
                    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
                    await page.waitForSelector('#tipoID', { state: 'visible', timeout: 30000 });
                    await fillForm();
                    continue;
                }

                logger.warn('  -> Timeout: no se recibió respuesta del interceptor.');
                // Verificar si la página cambió
                const currentUrl = page.url();
                logger.info(`  -> URL actual: ${currentUrl}`);
                if (!currentUrl.includes('descargarCertificacionPago.jsp')) {
                    // La página navegó sin pasar por el interceptor
                    const content = await page.content().catch(() => '');
                    logger.warn(`  -> Contenido página: ${content.substring(0, 200)}`);
                }
                await refreshCaptcha();

            } catch (err) {
                if (err.message.includes('existe') || err.message.includes('encontrado')) throw err;
                logger.warn(`  -> Error intento ${i}: ${err.message}`);
                await page.goto(url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
                await page.waitForSelector('#tipoID', { state: 'visible', timeout: 30000 }).catch(() => {});
                await fillForm().catch(() => {});
            }
        }

        throw new Error('No se pudo descargar después de 5 intentos.');
    } catch (error) {
        logger.error(`Error Asopagos: ${error.message}`);
        throw error;
    } finally {
        await browser.close();
    }
};
