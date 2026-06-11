const express = require('express');
const router = express.Router();

const {
    listarReservas,
    obtenerReserva,
    cancelarReserva,
    calendarioReservas
} = require('../controllers/reservaController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

router.get(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    listarReservas
);

router.get(
    '/calendario',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    calendarioReservas
);

router.get(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    obtenerReserva
);

router.put(
    '/:id/cancelar',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    cancelarReserva
);

module.exports = router;