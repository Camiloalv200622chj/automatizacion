import jwt from 'jsonwebtoken';
import Supervisor from '../models/Supervisor.js';
import logger from '../utils/logger.js';

/**
 * @desc    Autenticar supervisor y obtener token
 * @route   POST /api/supervisores/login
 */
export const loginSupervisor = async (req, res, next) => {
    try {
        const { correo, password } = req.body;
        logger.info(`Intento de login supervisor: ${correo}`);

        const supervisor = await Supervisor.findOne({ correo });

        if (supervisor && (await supervisor.matchPassword(password))) {
            const token = jwt.sign(
                { id: supervisor._id },
                process.env.JWT_SECRET || 'secret_key_placeholder',
                { expiresIn: '30d' }
            );

            res.json({
                _id: supervisor._id,
                nombreCompleto: supervisor.nombreCompleto,
                correo: supervisor.correo,
                token
            });
        } else {
            res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Crear un nuevo supervisor (Solo para el setup inicial o administradores)
 * @route   POST /api/supervisores
 */
export const registerSupervisor = async (req, res, next) => {
    try {
        const { nombreCompleto, correo, password } = req.body;

        const supervisorExists = await Supervisor.findOne({ correo });
        if (supervisorExists) {
            return res.status(400).json({ message: 'El supervisor ya existe' });
        }

        const supervisor = await Supervisor.create({
            nombreCompleto,
            correo,
            password
        });

        res.status(201).json({
            _id: supervisor._id,
            nombreCompleto: supervisor.nombreCompleto,
            correo: supervisor.correo
        });
    } catch (error) {
        next(error);
    }
};
