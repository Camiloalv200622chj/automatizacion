import Supervisor from '../models/Supervisor.js';

export const createSupervisor = async (req, res, next) => {
    try {
        const { nombreCompleto, correo } = req.body;
        const supervisor = await Supervisor.create({ nombreCompleto, correo });
        res.status(201).json(supervisor);
    } catch (error) {
        next(error);
    }
};

export const getSupervisores = async (req, res, next) => {
    try {
        const supervisores = await Supervisor.find({});
        res.json(supervisores);
    } catch (error) {
        next(error);
    }
};

export const deleteSupervisor = async (req, res, next) => {
    try {
        await Supervisor.findByIdAndDelete(req.params.id);
        res.json({ message: 'Supervisor eliminado' });
    } catch (error) {
        next(error);
    }
};
