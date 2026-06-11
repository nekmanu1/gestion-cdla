const express = require('express');
const router = express.Router();

const {
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} = require('../controllers/usuarioController');

const {
    verificarToken,
    soloAdmin
} = require('../middlewares/authMiddleware');

router.get('/', verificarToken, soloAdmin, listarUsuarios);
router.get('/:id', verificarToken, soloAdmin, obtenerUsuario);
router.post('/', verificarToken, soloAdmin, crearUsuario);
router.put('/:id', verificarToken, soloAdmin, actualizarUsuario);
router.delete('/:id', verificarToken, soloAdmin, eliminarUsuario);

module.exports = router;