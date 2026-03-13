import jwt from 'jsonwebtoken';
import Supervisor from '../models/Supervisor.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Obtener token
            token = req.headers.authorization.split(' ')[1];

            // Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_placeholder');

            // Obtener supervisor del token (sin la contraseña)
            req.supervisor = await Supervisor.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            logger.error(`Error en autenticación: ${error.message}`);
            res.status(401).json({ message: 'No autorizado, token fallido' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};
