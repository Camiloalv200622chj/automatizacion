import Contratista from '../models/Contratista.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import logger from '../utils/logger.js';

/**
 * @desc    Crear nuevo contratista
 * @route   POST /api/contratistas
 */
export const createContratista = async (req, res, next) => {
    try {
        const { nombreCompleto, numeroDocumento, tipoDocumento, passwd } = req.body;

        const exists = await Contratista.findOne({ numeroDocumento });
        if (exists) {
            res.status(400);
            throw new Error('El contratista ya existe');
        }

        const encryptedPass = encrypt(passwd);

        const contratista = await Contratista.create({
            nombreCompleto,
            numeroDocumento,
            tipoDocumento,
            passwd: encryptedPass
        });

        res.status(201).json(contratista);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Obtener todos los contratistas
 * @route   GET /api/contratistas
 */
export const getContratistas = async (req, res, next) => {
    try {
        const contratistas = await Contratista.find({});
        res.json(contratistas);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Editar contratista
 * @route   PUT /api/contratistas/:id
 */
export const updateContratista = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nombreCompleto, numeroDocumento, tipoDocumento, passwd, isActive } = req.body;

        const contratista = await Contratista.findById(id);

        if (contratista) {
            contratista.nombreCompleto = nombreCompleto || contratista.nombreCompleto;
            contratista.numeroDocumento = numeroDocumento || contratista.numeroDocumento;
            contratista.tipoDocumento = tipoDocumento || contratista.tipoDocumento;
            contratista.isActive = isActive !== undefined ? isActive : contratista.isActive;

            if (passwd) {
                contratista.passwd = encrypt(passwd);
            }

            const updatedContratista = await contratista.save();
            res.json(updatedContratista);
        } else {
            res.status(404);
            throw new Error('Contratista no encontrado');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Eliminar contratista
 * @route   DELETE /api/contratistas/:id
 */
export const deleteContratista = async (req, res, next) => {
    try {
        const result = await Contratista.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Contratista eliminado correctamente' });
        } else {
            res.status(404);
            throw new Error('Contratista no encontrado');
        }
    } catch (error) {
        next(error);
    }
};
