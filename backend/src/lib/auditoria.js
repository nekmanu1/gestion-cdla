const prisma = require('./prisma');

async function registrarAuditoria({ usuarioId, accion, modulo, detalle }) {
    try {
        await prisma.auditoria.create({
            data: {
                usuarioId: usuarioId || null,
                accion,
                modulo,
                detalle
            }
        });
    } catch (error) {
        console.error('Error registrando auditoría:', error);
    }
}

module.exports = registrarAuditoria;