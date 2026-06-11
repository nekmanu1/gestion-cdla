const express = require('express');
const router = express.Router();

const {
    listarSolicitudes,
    obtenerSolicitud,
    crearSolicitud,
    actualizarSolicitud,
    eliminarSolicitud,
    aprobarSolicitud,
    rechazarSolicitud,
    calcularCosto,
    calendarioSolicitudes
} = require('../controllers/solicitudController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

router.post(
    '/calcular-costo',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    calcularCosto
);

router.get(
    '/calendario',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    calendarioSolicitudes
);

router.get(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    listarSolicitudes
);

router.get(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    obtenerSolicitud
);

router.post(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    crearSolicitud
);

router.put(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    actualizarSolicitud
);

router.delete(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    eliminarSolicitud
);

router.put(
    '/:id/aprobar',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    aprobarSolicitud
);

router.put(
    '/:id/rechazar',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    rechazarSolicitud
);

module.exports = router;