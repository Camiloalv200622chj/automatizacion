import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import logger from './logger.js';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Servicio para interactuar con Google Drive usando OAuth2 (Refresh Token)
 */
class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.init();
    }

    init() {
        try {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

            if (!clientId || !clientSecret || !refreshToken) {
                logger.warn('Google Drive OAuth2: Faltan credenciales en el .env. Ejecuta setup-drive.js primero.');
                return;
            }

            const oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret,
                'urn:ietf:wg:oauth:2.0:oob'
            );

            oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            this.drive = google.drive({ version: 'v3', auth: oauth2Client });
            logger.info('✅ Google Drive Service Inicializado con OAuth2');
        } catch (error) {
            logger.error(`Error inicializando Google Drive (OAuth2): ${error.message}`);
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
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
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
            supportsAllDrives: true,
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

        try {
            const fileStats = fs.statSync(filePath);
            logger.info(`Preparando subida de ${fileName} (${fileStats.size} bytes)`);

            const fileMetadata = {
                name: fileName,
                parents: [folderId],
            };

            const media = {
                mimeType: 'application/pdf',
                body: Readable.from(fs.readFileSync(filePath)), // Buffer convertido a Stream para evitar bloqueos de OneDrive
            };

            const res = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, webViewLink',
                supportsAllDrives: true,
            });

            logger.info(`✅ Archivo subido a Drive: ${fileName} - ID: ${res.data.id}`);
            return res.data;
        } catch (error) {
            logger.error(`❌ Error subiendo a Drive: ${error.message}`);
            throw error;
        }
    }
}

export default new GoogleDriveService();
