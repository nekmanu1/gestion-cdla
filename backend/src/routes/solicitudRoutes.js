const express = require('express');
const router = express.Router();

const {
    listarSolicitudes,
    obtenerSolicitud,
    crearSolicitud,
    actualizarSolicitud,
    actualizarEstadoSolicitud,
    eliminarSolicitud,
    aprobarSolicitud,
    rechazarSolicitud,
    calcularCosto,
    calendarioSolicitudes,
    descargarCalendarioPDF,
    verificarDisponibilidad // <-- NUEVO
} = require('../controllers/solicitudController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');


/* ===========================
   CALENDARIO
=========================== */

router.get(
    '/calendario/descargar-pdf',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    descargarCalendarioPDF
);

router.get(
    '/calendario',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    calendarioSolicitudes
);


/* ===========================
   VALIDACIONES
=========================== */

// Verificar conflictos antes de guardar
router.post(
    '/verificar-disponibilidad',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    verificarDisponibilidad
);

// Calcular costo automático
router.post(
    '/calcular-costo',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    calcularCosto
);


/* ===========================
   ESTADO
=========================== */

router.put(
    '/:id/estado',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    actualizarEstadoSolicitud
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


/* ===========================
   CRUD
=========================== */

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

module.exports = router;