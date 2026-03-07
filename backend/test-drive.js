import googleDriveService from './src/utils/googleDriveService.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function forceTest() {
    const targetId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log('--- VALIDACIÓN FINAL DE DRIVE ---');
    console.log(`ID Objetivo: ${targetId}`);

    try {
        // 1. Crear archivo local
        const path = './test_final.txt';
        fs.writeFileSync(path, 'Validación final de subida en carpeta compartida.');

        // 2. Subir directamente
        console.log('Subiendo directamente a la ID compartida...');
        const res = await googleDriveService.uploadFile(path, 'TEST_EXITOSO.pdf', targetId);

        if (res) {
            console.log('✅ ¡SUBIDA CONFIRMADA!');
            console.log(`ID del archivo: ${res.id}`);
            console.log(`Enlace: ${res.webViewLink}`);
        }

        // Limpiar
        if (fs.existsSync(path)) fs.unlinkSync(path);

    } catch (error) {
        console.error('❌ Error en subida directa:');
        console.error(error.message);
        if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

forceTest();
