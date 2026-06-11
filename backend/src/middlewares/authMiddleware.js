const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: 'Token no proporcionado'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Token inválido'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Token expirado o inválido'
        });
    }
}

function soloAdmin(req, res, next) {
    if (req.usuario.rol !== 'ADMIN') {
        return res.status(403).json({
            message: 'No tienes permisos de administrador'
        });
    }

    next();
}

function permitirRoles(...rolesPermitidos) {
    return (req, res, next) => {
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
}

module.exports = {
    verificarToken,
    soloAdmin,
    permitirRoles
};