module.exports = function soloAdministrador(
    req,
    res,
    next
) {
    if (req.usuario?.rol !== 'ADMIN') {
        return res.status(403).json({
            message:
                'Esta información está disponible únicamente para administradores'
        });
    }

    next();
};