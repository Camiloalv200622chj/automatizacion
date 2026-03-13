import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000, // Esperar 15s antes de tirar timeout
            heartbeatFrequencyMS: 10000,
        });
        logger.info(`✅ MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`❌ Error de conexión: ${error.message}`);
        logger.warn('⚠️ El servidor continuará ejecutándose sin base de datos para depuración.');
        // process.exit(1); // COMENTADO: No matar el proceso para que el usuario pueda ver la web
    }
};

export default connectDB;
