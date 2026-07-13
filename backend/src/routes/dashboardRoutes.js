const express = require('express');

const {
    resumenDashboard,
    dashboardOperativo,
    estadisticasFacturacion
} = require('../controllers/dashboardController');

const {
    verificarToken,
    soloAdmin
} = require('../middlewares/authMiddleware');

const router = express.Router();

/*
 * Todas las rutas del dashboard requieren
 * que el usuario haya iniciado sesión.
 */
router.use(verificarToken);

/*
 * ADMIN y OPERADOR pueden consultar
 * las estadísticas generales.
 */
router.get(
    '/',
    resumenDashboard
);

router.get(
    '/operativo',
    dashboardOperativo
);

/*
 * Solo el administrador puede consultar
 * información financiera.
 */
router.get(
    '/facturacion',
    soloAdmin,
    estadisticasFacturacion
);

module.exports = router;