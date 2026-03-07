import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './src/config/database.js';
import errorHandler from './src/middlewares/errorMiddleware.js';
import logger from './src/utils/logger.js';
import contratistaRoutes from './src/routes/contratistaRoutes.js';
import supervisorRoutes from './src/routes/supervisorRoutes.js';
import automationRoutes from './src/routes/automationRoutes.js';
import { setupCronJobs } from './src/utils/cronJob.js';

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Configurar Tareas Programadas
setupCronJobs();

const app = express();

// Middlewares Globales
app.use(helmet()); // Seguridad
app.use(cors());   // CORS
app.use(express.json()); // Body Parser
app.use(morgan('dev'));  // Logs de peticiones
app.use(express.static('public')); // Servir archivos estáticos

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('API de Automatización funcionando 🚀');
});

// Rutas
app.use('/api/contratistas', contratistaRoutes);
app.use('/api/supervisores', supervisorRoutes);
app.use('/api/automation', automationRoutes);

// Middleware de Manejo de Errores
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
