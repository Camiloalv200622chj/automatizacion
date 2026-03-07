import express from 'express';
import {
    createContratista,
    getContratistas,
    updateContratista,
    deleteContratista
} from '../controllers/contratistaController.js';

const router = express.Router();

router.route('/')
    .post(createContratista)
    .get(getContratistas);

router.route('/:id')
    .put(updateContratista)
    .delete(deleteContratista);

export default router;
