const express = require('express');
const router = express.Router();

const {
    reporteClientes,
    reporteEspacios,
    reporteReservas,
    reporteFacturas,
    reporteSolicitudes,
    reporteSolicitudIndividual,
    reporteFacturaIndividual,
    reporteReservaIndividual
} = require('../controllers/reporteController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

router.get('/clientes', verificarToken, permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'), reporteClientes);
router.get('/espacios', verificarToken, permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'), reporteEspacios);
router.get('/reservas', verificarToken, permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'), reporteReservas);
router.get('/facturas', verificarToken, permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'), reporteFacturas);
router.get('/solicitudes', verificarToken, permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'), reporteSolicitudes);
router.get('/facturas/:id', verificarToken, reporteFacturaIndividual);
router.get('/solicitudes/:id', verificarToken, reporteSolicitudIndividual);
router.get('/reservas/:id',verificarToken,reporteReservaIndividual);

module.exports = router;