const express = require('express');
const router = express.Router();

const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

router.get('/privada', verificarToken, (req, res) => {
    res.json({
        message: 'Ruta privada funcionando',
        usuario: req.usuario
    });
});

router.get('/admin', verificarToken, soloAdmin, (req, res) => {
    res.json({
        message: 'Ruta solo para administrador',
        usuario: req.usuario
    });
});

module.exports = router;