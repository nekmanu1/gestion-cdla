const prisma = require('../lib/prisma');

async function listarAuditorias(req, res) {
    try {
        const auditorias = await prisma.auditoria.findMany({
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        email: true,
                        rol: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        res.json(auditorias);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al listar auditorías'
        });
    }
}

module.exports = {
    listarAuditorias
};