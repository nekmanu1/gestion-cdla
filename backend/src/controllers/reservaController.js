const prisma = require('../lib/prisma');

async function listarReservas(req, res) {
    try {
        const {
            buscar,
            estado,
            clienteId,
            espacioId,
            fechaInicio,
            fechaFin
        } = req.query;

        const where = {};

        /* =========================
           BÚSQUEDA GENERAL
        ========================= */

        if (buscar?.trim()) {
            const texto = buscar.trim();

            where.OR = [
                {
                    solicitud: {
                        nombreEvento: {
                            contains: texto,
                            mode: 'insensitive'
                        }
                    }
                },
                {
                    solicitud: {
                        cliente: {
                            nombre: {
                                contains: texto,
                                mode: 'insensitive'
                            }
                        }
                    }
                },
                {
                    espacio: {
                        nombre: {
                            contains: texto,
                            mode: 'insensitive'
                        }
                    }
                }
            ];
        }

        /* =========================
           ESTADO
        ========================= */

        if (estado) {
            where.estado = estado;
        }

        /* =========================
           CLIENTE
        ========================= */

        if (clienteId) {
            const clienteIdNumero = Number(clienteId);

            if (!Number.isInteger(clienteIdNumero)) {
                return res.status(400).json({
                    message: 'El cliente seleccionado no es válido'
                });
            }

            where.solicitud = {
                ...(where.solicitud || {}),
                clienteId: clienteIdNumero
            };
        }

        /* =========================
           ESPACIO
        ========================= */

        if (espacioId) {
            const espacioIdNumero = Number(espacioId);

            if (!Number.isInteger(espacioIdNumero)) {
                return res.status(400).json({
                    message: 'El espacio seleccionado no es válido'
                });
            }

            where.espacioId = espacioIdNumero;
        }

        /* =========================
           RANGO DE FECHAS
        ========================= */

        if (fechaInicio || fechaFin) {
            /*
             * Busca reservas que se crucen con el rango indicado.
             */
            if (fechaInicio) {
                const inicioFiltro = new Date(`${fechaInicio}T00:00:00`);

                if (Number.isNaN(inicioFiltro.getTime())) {
                    return res.status(400).json({
                        message: 'La fecha inicial no es válida'
                    });
                }

                where.fechaFin = {
                    ...(where.fechaFin || {}),
                    gte: inicioFiltro
                };
            }

            if (fechaFin) {
                const finFiltro = new Date(`${fechaFin}T23:59:59.999`);

                if (Number.isNaN(finFiltro.getTime())) {
                    return res.status(400).json({
                        message: 'La fecha final no es válida'
                    });
                }

                where.fechaInicio = {
                    ...(where.fechaInicio || {}),
                    lte: finFiltro
                };
            }
        }

        const reservas = await prisma.reserva.findMany({
            where,
            include: {
                espacio: true,
                solicitud: {
                    include: {
                        cliente: true
                    }
                }
            },
            orderBy: [
                {
                    fechaInicio: 'asc'
                },
                {
                    id: 'desc'
                }
            ]
        });

        return res.json(reservas);
    } catch (error) {
        console.error('Error al listar reservas:', error);

        return res.status(500).json({
            message: 'Error al listar reservas'
        });
    }
}

async function obtenerReserva(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'ID de reserva no válido'
            });
        }

        const reserva = await prisma.reserva.findUnique({
            where: {
                id
            },
            include: {
                espacio: true,
                solicitud: {
                    include: {
                        cliente: true
                    }
                }
            }
        });

        if (!reserva) {
            return res.status(404).json({
                message: 'Reserva no encontrada'
            });
        }

        return res.json(reserva);
    } catch (error) {
        console.error('Error al obtener reserva:', error);

        return res.status(500).json({
            message: 'Error al obtener reserva'
        });
    }
}

async function cancelarReserva(req, res) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'ID de reserva no válido'
            });
        }

        const reserva = await prisma.reserva.findUnique({
            where: {
                id
            }
        });

        if (!reserva) {
            return res.status(404).json({
                message: 'Reserva no encontrada'
            });
        }

        if (reserva.estado === 'CANCELADA') {
            return res.status(400).json({
                message: 'La reserva ya está cancelada'
            });
        }

        if (reserva.estado === 'FINALIZADA') {
            return res.status(400).json({
                message: 'No se puede cancelar una reserva finalizada'
            });
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const reservaActualizada = await tx.reserva.update({
                where: {
                    id
                },
                data: {
                    estado: 'CANCELADA'
                }
            });

            if (reserva.solicitudId) {
                await tx.solicitud.update({
                    where: {
                        id: reserva.solicitudId
                    },
                    data: {
                        estado: 'CANCELADA'
                    }
                });
            }

            return reservaActualizada;
        });

        return res.json({
            message: 'Reserva cancelada correctamente',
            reserva: resultado
        });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);

        return res.status(500).json({
            message: 'Error al cancelar reserva'
        });
    }
}

async function calendarioReservas(req, res) {
    try {
        const reservas = await prisma.reserva.findMany({
            where: {
                estado: 'ACTIVA'
            },
            include: {
                espacio: true,
                solicitud: {
                    include: {
                        cliente: true
                    }
                }
            },
            orderBy: {
                fechaInicio: 'asc'
            }
        });

        const eventos = reservas.map((reserva) => ({
            id: reserva.id,
            titulo: reserva.solicitud?.nombreEvento || 'Reserva',
            cliente: reserva.solicitud?.cliente?.nombre || '-',
            espacio: reserva.espacio?.nombre || '-',
            fechaInicio: reserva.fechaInicio,
            fechaFin: reserva.fechaFin,
            estado: reserva.estado
        }));

        return res.json(eventos);
    } catch (error) {
        console.error('Error al obtener calendario:', error);

        return res.status(500).json({
            message: 'Error al obtener calendario'
        });
    }
}

module.exports = {
    listarReservas,
    obtenerReserva,
    cancelarReserva,
    calendarioReservas
};