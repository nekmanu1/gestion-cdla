const prisma = require('../lib/prisma');

async function listarReservas(req, res) {
    try {
        const reservas = await prisma.reserva.findMany({
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

        res.json(reservas);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al listar reservas'
        });
    }
}

async function obtenerReserva(req, res) {
    try {
        const { id } = req.params;

        const reserva = await prisma.reserva.findUnique({
            where: {
                id: Number(id)
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

        res.json(reserva);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener reserva'
        });
    }
}

async function cancelarReserva(req, res) {
    try {
        const { id } = req.params;

        const reserva = await prisma.reserva.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!reserva) {
            return res.status(404).json({
                message: 'Reserva no encontrada'
            });
        }

        const reservaActualizada = await prisma.reserva.update({
            where: {
                id: Number(id)
            },
            data: {
                estado: 'CANCELADA'
            }
        });

        await prisma.solicitud.update({
            where: {
                id: reserva.solicitudId
            },
            data: {
                estado: 'CANCELADA'
            }
        });

        res.json({
            message: 'Reserva cancelada correctamente',
            reserva: reservaActualizada
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
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

        const eventos = reservas.map((reserva) => {
            return {
                id: reserva.id,
                titulo: reserva.solicitud.nombreEvento,
                cliente: reserva.solicitud.cliente.nombre,
                espacio: reserva.espacio.nombre,
                fechaInicio: reserva.fechaInicio,
                fechaFin: reserva.fechaFin,
                estado: reserva.estado
            };
        });

        res.json(eventos);
    } catch (error) {
        console.error(error);
        res.status(500).json({
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