const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');

function generarNumeroFactura() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);

    return `FAC-${year}-${random}`;
}

async function listarFacturas(req, res) {
    try {
        const {
    buscar,
    estado,
    clienteId,
    fechaInicio,
    fechaFin
} = req.query;

        const where = {};

        if (buscar) {
            where.OR = [
                {
                    numero: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                },
                {
                    concepto: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        if (estado) {
            where.estado = estado;
        }

        if (clienteId) {
            where.clienteId = Number(clienteId);
        }

        if (fechaInicio || fechaFin) {
    where.fechaEmision = {};

    if (fechaInicio) {
        where.fechaEmision.gte = new Date(fechaInicio);
    }

    if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);

        where.fechaEmision.lte = fin;
    }
}

        const facturas = await prisma.factura.findMany({
            where,
            include: {
                cliente: true,
                reserva: {
                    include: {
                        espacio: true,
                        solicitud: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });

        res.json(facturas);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al listar facturas'
        });
    }
}

async function obtenerFactura(req, res) {
    try {
        const { id } = req.params;

        const factura = await prisma.factura.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                cliente: true,
                reserva: {
                    include: {
                        espacio: true,
                        solicitud: true
                    }
                }
            }
        });

        if (!factura) {
            return res.status(404).json({
                message: 'Factura no encontrada'
            });
        }

        res.json(factura);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener factura'
        });
    }
}

async function crearFactura(req, res) {
    try {
        const {
            clienteId,
            reservaId,
            concepto,
            monto,
            observaciones
        } = req.body;

        if (!concepto || !monto) {
            return res.status(400).json({
                message: 'Concepto y monto son obligatorios'
            });
        }

        if (clienteId) {
            const cliente = await prisma.cliente.findUnique({
                where: {
                    id: Number(clienteId)
                }
            });

            if (!cliente) {
                return res.status(404).json({
                    message: 'Cliente no encontrado'
                });
            }
        }

        if (reservaId) {
            const reserva = await prisma.reserva.findUnique({
                where: {
                    id: Number(reservaId)
                }
            });

            if (!reserva) {
                return res.status(404).json({
                    message: 'Reserva no encontrada'
                });
            }
        }

        const factura = await prisma.factura.create({
            data: {
                numero: generarNumeroFactura(),
                clienteId: clienteId ? Number(clienteId) : null,
                reservaId: reservaId ? Number(reservaId) : null,
                concepto,
                monto,
                observaciones
            },
            include: {
                cliente: true,
                reserva: true
            }
        });

        res.status(201).json({
            message: 'Factura creada correctamente',
            factura
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al crear factura'
        });
    }
}

async function actualizarFactura(req, res) {
    try {
        const { id } = req.params;

        const {
            clienteId,
            reservaId,
            concepto,
            monto,
            estado,
            observaciones
        } = req.body;

        const facturaExiste = await prisma.factura.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!facturaExiste) {
            return res.status(404).json({
                message: 'Factura no encontrada'
            });
        }

        const data = {};

        if (clienteId !== undefined) data.clienteId = clienteId ? Number(clienteId) : null;
        if (reservaId !== undefined) data.reservaId = reservaId ? Number(reservaId) : null;
        if (concepto !== undefined) data.concepto = concepto;
        if (monto !== undefined) data.monto = monto;
        if (estado !== undefined) data.estado = estado;
        if (observaciones !== undefined) data.observaciones = observaciones;

        const factura = await prisma.factura.update({
            where: {
                id: Number(id)
            },
            data,
            include: {
                cliente: true,
                reserva: true
            }
        });

        res.json({
            message: 'Factura actualizada correctamente',
            factura
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al actualizar factura'
        });
    }
}

async function pagarFactura(req, res) {
    try {
        const { id } = req.params;

        const facturaExiste = await prisma.factura.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!facturaExiste) {
            return res.status(404).json({
                message: 'Factura no encontrada'
            });
        }

        if (facturaExiste.estado === 'ANULADA') {
            return res.status(400).json({
                message: 'No se puede pagar una factura anulada'
            });
        }

        const factura = await prisma.factura.update({
            where: {
                id: Number(id)
            },
            data: {
                estado: 'PAGADA',
                fechaPago: new Date()
            }
        });
        await registrarAuditoria({
    usuarioId: req.usuario.id,
    accion: 'PAGAR',
    modulo: 'FACTURACION',
    detalle: `Factura ${factura.numero} marcada como pagada`
});

        res.json({
            message: 'Factura marcada como pagada',
            factura
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al pagar factura'
        });
    }
}

async function anularFactura(req, res) {
    try {
        const { id } = req.params;

        const facturaExiste = await prisma.factura.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!facturaExiste) {
            return res.status(404).json({
                message: 'Factura no encontrada'
            });
        }

        const factura = await prisma.factura.update({
            where: {
                id: Number(id)
            },
            data: {
                estado: 'ANULADA'
            }
        });

        res.json({
            message: 'Factura anulada correctamente',
            factura
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al anular factura'
        });
    }
}


module.exports = {
    listarFacturas,
    obtenerFactura,
    crearFactura,
    actualizarFactura,
    pagarFactura,
    anularFactura
};