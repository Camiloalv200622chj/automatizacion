import { chromium } from 'playwright';
import fs from 'fs';

async function runTest() {
    console.log("Iniciando prueba de scraping en SOI...");
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log("Navegando a SOI...");
        try {
            await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', {
                waitUntil: 'networkidle',
                timeout: 60000
            });
        } catch (gotoError) {
            console.error("Error en goto, reintentando una vez...");
            await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
        }

        console.log("Página cargada.");

        // Esperar a que el selector esté presente
        await page.waitForSelector('#tipoDocumentoAportante', { timeout: 20000 });
        console.log("Selector de tipo de documento encontrado.");

        // Obtener todas las opciones disponibles
        const options = await page.$$eval('#tipoDocumentoAportante option', (els) =>
            els.map(el => ({ text: el.textContent.trim(), value: el.value }))
        );
        console.log("Opciones encontradas: " + options.length);
        fs.writeFileSync('soi_options.json', JSON.stringify(options, null, 2));

        // Seleccionar CC (Cédula de Ciudadanía)
        await page.selectOption('#tipoDocumentoAportante', 'CC');
        await page.fill('#numeroDocumentoAportante', '1100971354');
        console.log("Datos de aportante ingresados.");

        // Tomar captura
        await page.screenshot({ path: 'temp_soi_full.png', fullPage: true });
        console.log("Screenshot guardado.");

        // Intentar presionar enter en el campo de número para ver si envía el form
        await page.focus('#numeroDocumentoAportante');
        await page.keyboard.press('Enter');
        console.log("Enter presionado.");

        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'temp_soi_after_enter.png', fullPage: true });
        console.log("Screenshot post-enter guardado.");

    } catch (error) {
        fs.writeFileSync('node_error.txt', error.stack || error.toString(), 'utf8');
        console.error("Fallo detectado. Ver node_error.txt");
    } finally {
        if (browser) await browser.close();
        console.log("Prueba finalizada.");
    }
}

runTest();
