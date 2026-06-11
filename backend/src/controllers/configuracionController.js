const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');

async function obtenerConfiguracion(req, res) {
    try {
        let configuracion = await prisma.configuracion.findFirst();

        if (!configuracion) {
            configuracion = await prisma.configuracion.create({
                data: {
                    nombre: 'Ciudad de las Artes',
                    moneda: 'USD'
                }
            });
        }

        res.json(configuracion);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener configuración'
        });
    }
}

async function actualizarConfiguracion(req, res) {
    try {
        const {
            nombre,
            correo,
            telefono,
            direccion,
            moneda,
            logoUrl
        } = req.body;

        let configuracion = await prisma.configuracion.findFirst();

        if (!configuracion) {
            configuracion = await prisma.configuracion.create({
                data: {
                    nombre: nombre || 'Ciudad de las Artes',
                    correo,
                    telefono,
                    direccion,
                    moneda: moneda || 'USD',
                    logoUrl
                }
            });
        } else {
            configuracion = await prisma.configuracion.update({
                where: {
                    id: configuracion.id
                },
                data: {
                    nombre,
                    correo,
                    telefono,
                    direccion,
                    moneda,
                    logoUrl
                }
            });
        }

        await registrarAuditoria({
            usuarioId: req.usuario.id,
            accion: 'ACTUALIZAR',
            modulo: 'CONFIGURACION',
            detalle: 'Configuración institucional actualizada'
        });

        res.json({
            message: 'Configuración actualizada correctamente',
            configuracion
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al actualizar configuración'
        });
    }
}

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion
};