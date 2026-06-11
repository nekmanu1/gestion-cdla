const express = require('express');
const router = express.Router();

const {
    listarFacturas,
    obtenerFactura,
    crearFactura,
    actualizarFactura,
    pagarFactura,
    anularFactura
} = require('../controllers/facturaController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

router.get(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    listarFacturas
);

router.get(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    obtenerFactura
);

router.post(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    crearFactura
);

router.put(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    actualizarFactura
);

router.put(
    '/:id/pagar',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    pagarFactura
);

router.put(
    '/:id/anular',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    anularFactura
);

module.exports = router;