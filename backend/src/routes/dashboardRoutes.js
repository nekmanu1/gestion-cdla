const express = require('express');
const router = express.Router();

const {
    resumenDashboard,
    estadisticasReservas,
    estadisticasFacturacion,
    dashboardAvanzado
} = require('../controllers/dashboardController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

router.get(
    '/avanzado',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    dashboardAvanzado
);

router.get(
    '/facturacion',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    estadisticasFacturacion
);

router.get(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    resumenDashboard
);

router.get(
    '/reservas',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    estadisticasReservas
);

module.exports = router;