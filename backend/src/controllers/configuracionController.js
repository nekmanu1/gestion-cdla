const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');

const CONFIG_DEFAULT = {
    nombre: 'Ciudad de las Artes',
    moneda: 'USD',
    prefijoSolicitud: 'SOL',
    prefijoFactura: 'FAC',
    prefijoReserva: 'RES',
    colorPrincipal: '#111827'
};

async function obtenerConfiguracion(req, res) {
    try {
        let configuracion = await prisma.configuracion.findFirst();

        if (!configuracion) {
            configuracion = await prisma.configuracion.create({
                data: CONFIG_DEFAULT
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
            logoUrl,

            ruc,
            sitioWeb,
            nombreComercial,
            representanteLegal,

            prefijoSolicitud,
            prefijoFactura,
            prefijoReserva,

            notaFactura,
            terminosFactura,
            mensajeReportes,

            colorPrincipal
        } = req.body;

        if (!nombre?.trim()) {
            return res.status(400).json({
                message:
                    'El nombre de la institución es obligatorio'
            });
        }

        if (
            moneda &&
            !['USD', 'PAB'].includes(moneda)
        ) {
            return res.status(400).json({
                message: 'La moneda seleccionada no es válida'
            });
        }

        if (
            colorPrincipal &&
            !/^#[0-9A-Fa-f]{6}$/.test(colorPrincipal)
        ) {
            return res.status(400).json({
                message:
                    'El color principal debe tener formato hexadecimal'
            });
        }

        const limpiarPrefijo = (
            valor,
            predeterminado
        ) => {
            const limpio = String(
                valor || predeterminado
            )
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '');

            return limpio.substring(0, 8);
        };

        const data = {
            nombre: nombre.trim(),
            correo: correo?.trim() || null,
            telefono: telefono?.trim() || null,
            direccion: direccion?.trim() || null,
            moneda: moneda || 'USD',
            logoUrl: logoUrl?.trim() || null,

            ruc: ruc?.trim() || null,
            sitioWeb: sitioWeb?.trim() || null,
            nombreComercial:
                nombreComercial?.trim() || null,
            representanteLegal:
                representanteLegal?.trim() || null,

            prefijoSolicitud: limpiarPrefijo(
                prefijoSolicitud,
                'SOL'
            ),

            prefijoFactura: limpiarPrefijo(
                prefijoFactura,
                'FAC'
            ),

            prefijoReserva: limpiarPrefijo(
                prefijoReserva,
                'RES'
            ),

            notaFactura:
                notaFactura?.trim() || null,

            terminosFactura:
                terminosFactura?.trim() || null,

            mensajeReportes:
                mensajeReportes?.trim() || null,

            colorPrincipal:
                colorPrincipal || '#111827'
        };

        let configuracion =
            await prisma.configuracion.findFirst();

        if (!configuracion) {
            configuracion =
                await prisma.configuracion.create({
                    data: {
                        ...CONFIG_DEFAULT,
                        ...data
                    }
                });
        } else {
            configuracion =
                await prisma.configuracion.update({
                    where: {
                        id: configuracion.id
                    },
                    data
                });
        }

        if (req.usuario?.id) {
            await registrarAuditoria({
                usuarioId: req.usuario.id,
                accion: 'ACTUALIZAR',
                modulo: 'CONFIGURACION',
                detalle:
                    'Configuración institucional actualizada'
            });
        }

        return res.json({
            message:
                'Configuración actualizada correctamente',
            configuracion
        });
    } catch (error) {
        console.error(
            'Error al actualizar configuración:',
            error
        );

        return res.status(500).json({
            message:
                'Error al actualizar configuración'
        });
    }
}

module.exports = {
    obtenerConfiguracion,
    actualizarConfiguracion
};