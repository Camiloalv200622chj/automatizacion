import express from 'express';
import {
    createContratista,
    getContratistas,
    updateContratista,
    deleteContratista,
    getContratistaByDocumento
} from '../controllers/contratistaController.js';

const router = express.Router();

router.route('/')
    .post(createContratista)
    .get(getContratistas);

router.route('/:id')
    .put(updateContratista)
    .delete(deleteContratista);

router.route('/search/:numeroDocumento')
    .get(getContratistaByDocumento);

export default router;
