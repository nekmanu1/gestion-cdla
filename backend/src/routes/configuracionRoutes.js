const express = require('express');
const router = express.Router();

const {
    obtenerConfiguracion,
    actualizarConfiguracion
} = require('../controllers/configuracionController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

router.get(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    obtenerConfiguracion
);

router.put(
    '/',
    verificarToken,
    permitirRoles('ADMIN'),
    actualizarConfiguracion
);

module.exports = router;