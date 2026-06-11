const express = require('express');
const router = express.Router();

const {
    listarEspacios,
    obtenerEspacio,
    crearEspacio,
    actualizarEspacio,
    eliminarEspacio
} = require('../controllers/espacioController');

const {
    verificarToken,
    permitirRoles
} = require('../middlewares/authMiddleware');

const uploadEspacios = require('../middlewares/uploadEspacios');

router.get(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    listarEspacios
);

router.get(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR', 'CONSULTOR'),
    obtenerEspacio
);

router.post(
    '/',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    uploadEspacios.fields([
        { name: 'imagen', maxCount: 1 },
        { name: 'plano', maxCount: 1 }
    ]),
    crearEspacio
);

router.put(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    uploadEspacios.fields([
        { name: 'imagen', maxCount: 1 },
        { name: 'plano', maxCount: 1 }
    ]),
    actualizarEspacio
);

router.delete(
    '/:id',
    verificarToken,
    permitirRoles('ADMIN', 'OPERADOR'),
    eliminarEspacio
);

module.exports = router;