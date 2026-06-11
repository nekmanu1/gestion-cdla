const express = require('express');
const router = express.Router();

const {
    listarClientes,
    obtenerCliente,
    crearCliente,
    actualizarCliente,
    eliminarCliente
} = require('../controllers/clienteController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

router.get(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    listarClientes
);

router.get(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    obtenerCliente
);

router.post(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    crearCliente
);

router.put(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    actualizarCliente
);

router.delete(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    eliminarCliente
);

module.exports = router;