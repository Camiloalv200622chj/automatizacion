import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * Servicio para interactuar con Google Drive usando una Cuenta de Servicio
 */
class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.init();
    }

    init() {
        try {
            // Nombre del archivo de credenciales de Google Cloud (Service Account JSON)
            const keyPath = path.resolve('google-credentials.json');
            
            if (!fs.existsSync(keyPath)) {
                logger.warn('Archivo "google-credentials.json" no encontrado en la raíz del backend. Google Drive no estará disponible.');
                return;
            }

            const auth = new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: SCOPES,
            });

            this.drive = google.drive({ version: 'v3', auth });
            logger.info('✅ Google Drive Service Inicializado correctamente');
        } catch (error) {
            logger.error(`❌ Error inicializando Google Drive: ${error.message}`);
        }
    }

    /**
     * Busca una carpeta por nombre y id padre
     */
    async findFolder(name, parentId = null) {
        if (!this.drive) return null;

        let query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        if (parentId) {
            query += ` and '${parentId}' in parents`;
        }

        const res = await this.drive.files.list({
            q: query,
            fields: 'files(id, name)',
        });

        return res.data.files.length > 0 ? res.data.files[0].id : null;
    }

    /**
     * Crea una carpeta y devuelve su ID
     */
    async createFolder(name, parentId = null) {
        if (!this.drive) return null;

        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
        };

        if (parentId) {
            fileMetadata.parents = [parentId];
        }

        const res = await this.drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });

        return res.data.id;
    }

    /**
     * Navega o crea la estructura de carpetas YYYY/MM dentro de una carpeta base
     */
    async getOrCreateYearMonthFolder() {
        const now = new Date();
        const year = now.getFullYear().toString();
        const monthNames = [
            '01-Enero', '02-Febrero', '03-Marzo', '04-Abril', '05-Mayo', '06-Junio',
            '07-Julio', '08-Agosto', '09-Septiembre', '10-Octubre', '11-Noviembre', '12-Diciembre'
        ];
        const month = monthNames[now.getMonth()];

        const baseFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

        let yearFolderId = await this.findFolder(year, baseFolderId);
        if (!yearFolderId) {
            yearFolderId = await this.createFolder(year, baseFolderId);
        }

        let monthFolderId = await this.findFolder(month, yearFolderId);
        if (!monthFolderId) {
            monthFolderId = await this.createFolder(month, yearFolderId);
        }

        return monthFolderId;
    }

    /**
     * Sube un archivo a la carpeta especificada
     */
    async uploadFile(filePath, fileName, folderId) {
        if (!this.drive) return null;

        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(filePath),
        };

        const res = await this.drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        logger.info(`Archivo subido a Drive: ${fileName} - ID: ${res.data.id}`);
        return res.data;
    }
}

export default new GoogleDriveService();
