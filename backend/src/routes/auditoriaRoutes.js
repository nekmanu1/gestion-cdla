const express = require('express');
const router = express.Router();

const {
    listarAuditorias
} = require('../controllers/auditoriaController');

const {
    verificarToken,
    soloAdmin
} = require('../middlewares/authMiddleware');

router.get('/', verificarToken, soloAdmin, listarAuditorias);

module.exports = router;