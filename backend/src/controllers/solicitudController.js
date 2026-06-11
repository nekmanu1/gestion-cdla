const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');

function generarCodigoSolicitud() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);

    return `SOL-${year}-${random}`;
}

function generarNumeroFactura() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);

    return `FAC-${year}-${random}`;
}

function calcularHoras(inicio, fin) {
    if (!inicio || !fin) return 0;

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    const diferenciaMs = fechaFin - fechaInicio;

    if (diferenciaMs <= 0) return 0;

    return diferenciaMs / (1000 * 60 * 60);
}

function calcularDias(inicio, fin) {
    if (!inicio || !fin) return 0;

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    const diferenciaMs = fechaFin - fechaInicio;

    if (diferenciaMs <= 0) return 0;

    return Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
}

function obtenerRangoOcupacion(datos) {
    const fechasInicio = [
        datos.fechaInicioMontaje,
        datos.fechaInicioEvento,
        datos.fechaInicioDesmontaje,
        datos.fechaInicioCerrado
    ]
        .filter(Boolean)
        .map((fecha) => new Date(fecha));

    const fechasFin = [
        datos.fechaFinMontaje,
        datos.fechaFinEvento,
        datos.fechaFinDesmontaje,
        datos.fechaFinCerrado
    ]
        .filter(Boolean)
        .map((fecha) => new Date(fecha));

    if (fechasInicio.length === 0 || fechasFin.length === 0) {
        return {
            fechaInicioOcupacion: null,
            fechaFinOcupacion: null
        };
    }

    return {
        fechaInicioOcupacion: new Date(Math.min(...fechasInicio)),
        fechaFinOcupacion: new Date(Math.max(...fechasFin))
    };
}

function calcularCostoSolicitud(espacio, datos) {
    if (datos.modalidadCosto === 'ESCUELA_CDLA' || datos.modalidadCosto === 'GRATUITO') {
        return 0;
    }

    const horasMontaje = calcularHoras(
        datos.fechaInicioMontaje,
        datos.fechaFinMontaje
    );

    const horasEvento = calcularHoras(
        datos.fechaInicioEvento,
        datos.fechaFinEvento
    );

    const horasDesmontaje = calcularHoras(
        datos.fechaInicioDesmontaje,
        datos.fechaFinDesmontaje
    );

    const diasCerrado = calcularDias(
        datos.fechaInicioCerrado,
        datos.fechaFinCerrado
    );

    return (
        horasMontaje * Number(espacio.precioMontaje || 0) +
        horasEvento * Number(espacio.precioEvento || 0) +
        horasDesmontaje * Number(espacio.precioDesmontaje || 0) +
        diasCerrado * Number(espacio.precioCerrado || 0)
    );
}

async function listarSolicitudes(req, res) {
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

        if (buscar) {
            where.OR = [
                {
                    codigo: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                },
                {
                    nombreEvento: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                },
                {
                    actividad: {
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

        if (espacioId) {
            where.espacioId = Number(espacioId);
        }

        if (fechaInicio || fechaFin) {
    where.creadoEn = {};

    if (fechaInicio) {
        where.creadoEn.gte = new Date(fechaInicio);
    }

    if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);

        where.creadoEn.lte = fin;
    }
}

        const solicitudes = await prisma.solicitud.findMany({
            where,
            include: {
            cliente: true,
            espacio: true,
            reserva: {
        include: {
            facturas: true,
            espacio: true
          }
        }
      },
            orderBy: {
                id: 'desc'
            }
        });

        res.json(solicitudes);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al listar solicitudes'
        });
    }
}

async function obtenerSolicitud(req, res) {
    try {
        const { id } = req.params;

        const solicitud = await prisma.solicitud.findUnique({
            where: {
                id: Number(id)
            },
            include: {
    cliente: true,
    espacio: true,
    reserva: {
        include: {
            facturas: true,
            espacio: true
        }
    }
}
        });

        if (!solicitud) {
            return res.status(404).json({
                message: 'Solicitud no encontrada'
            });
        }

        res.json(solicitud);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener solicitud'
        });
    }
}

async function crearSolicitud(req, res) {
    try {
        const {
            clienteId,
            clienteCedulaRuc,
            clienteNombre,
            espacioId,
            nombreEvento,
            contactoResponsable,
            celular,
            correo,
            modalidadCosto,
            fechaInicioMontaje,
            fechaFinMontaje,
            fechaInicioEvento,
            fechaFinEvento,
            fechaInicioDesmontaje,
            fechaFinDesmontaje,
            fechaInicioCerrado,
            fechaFinCerrado,
            tipoEvento,
            personas,
            agendadoPor,
            actividad,
            descripcion,
            observaciones
        } = req.body;

        if ((!clienteId && !clienteNombre) || !espacioId || !nombreEvento || !fechaInicioEvento || !fechaFinEvento) {
            return res.status(400).json({
                message: 'Cliente, espacio, nombre del evento, fecha inicio evento y fecha fin evento son obligatorios'
            });
        }

        let cliente = null;

if (clienteId) {
    cliente = await prisma.cliente.findUnique({
        where: {
            id: Number(clienteId)
        }
    });

    if (!cliente) {
        return res.status(404).json({
            message: 'Cliente no encontrado'
        });
    }
} else {
    cliente = await prisma.cliente.create({
    data: {
        nombre: clienteNombre,
        cedulaRuc: clienteCedulaRuc || null,
        correo: correo || null,
        telefono: celular || null,
        activo: true
    }
});
}

        const espacio = await prisma.espacio.findUnique({
            where: {
                id: Number(espacioId)
            }
        });

        if (!espacio) {
            return res.status(404).json({
                message: 'Espacio no encontrado'
            });
        }

        const { fechaInicioOcupacion, fechaFinOcupacion } = obtenerRangoOcupacion({
    fechaInicioMontaje,
    fechaFinMontaje,
    fechaInicioEvento,
    fechaFinEvento,
    fechaInicioDesmontaje,
    fechaFinDesmontaje,
    fechaInicioCerrado,
    fechaFinCerrado
});

const conflicto = await prisma.reserva.findFirst({
    where: {
        espacioId: Number(espacioId),
        estado: 'ACTIVA',
        fechaInicio: {
            lt: fechaFinOcupacion
        },
        fechaFin: {
            gt: fechaInicioOcupacion
        }
    }
});

if (conflicto) {
    return res.status(400).json({
        message: 'El espacio ya tiene una reserva activa en ese rango de fechas'
    });
}

const conflictoSolicitudPendiente = await prisma.solicitud.findFirst({
    where: {
        espacioId: Number(espacioId),
        estado: 'PENDIENTE',
        fechaInicioEvento: {
            lt: fechaFinOcupacion
        },
        fechaFinEvento: {
            gt: fechaInicioOcupacion
        }
    }
});

if (conflictoSolicitudPendiente) {
    return res.status(400).json({
        message: 'Ya existe una solicitud pendiente para ese espacio en ese rango de fechas'
    });
}

        const datosCalculo = {
            modalidadCosto: modalidadCosto || 'ESTANDAR',
            fechaInicioMontaje,
            fechaFinMontaje,
            fechaInicioEvento,
            fechaFinEvento,
            fechaInicioDesmontaje,
            fechaFinDesmontaje,
            fechaInicioCerrado,
            fechaFinCerrado
        };

        const costoEstimado = calcularCostoSolicitud(espacio, datosCalculo);

        const solicitud = await prisma.solicitud.create({
            data: {
                codigo: generarCodigoSolicitud(),

                clienteId: cliente.id,
                espacioId: Number(espacioId),

                nombreEvento,
                contactoResponsable,
                celular,
                correo,

                modalidadCosto: modalidadCosto || 'ESTANDAR',

                fechaInicioMontaje: fechaInicioMontaje ? new Date(fechaInicioMontaje) : null,
                fechaFinMontaje: fechaFinMontaje ? new Date(fechaFinMontaje) : null,

                fechaInicioEvento: new Date(fechaInicioEvento),
                fechaFinEvento: new Date(fechaFinEvento),

                fechaInicioDesmontaje: fechaInicioDesmontaje ? new Date(fechaInicioDesmontaje) : null,
                fechaFinDesmontaje: fechaFinDesmontaje ? new Date(fechaFinDesmontaje) : null,

                fechaInicioCerrado: fechaInicioCerrado ? new Date(fechaInicioCerrado) : null,
                fechaFinCerrado: fechaFinCerrado ? new Date(fechaFinCerrado) : null,

                tipoEvento,
                personas: personas ? Number(personas) : null,
                agendadoPor,

                actividad,
                descripcion,
                observaciones,

                costoEstimado
            },
            include: {
                cliente: true,
                espacio: true
            }
        });

    res.status(201).json({
    message: 'Solicitud creada correctamente',
    solicitud
});  

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al crear solicitud'
        });
    }
}

async function actualizarSolicitud(req, res) {
    try {
        const { id } = req.params;

        const solicitudExiste = await prisma.solicitud.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!solicitudExiste) {
            return res.status(404).json({
                message: 'Solicitud no encontrada'
            });
        }

        const {
            clienteId,
            espacioId,
            nombreEvento,
            contactoResponsable,
            celular,
            correo,

            modalidadCosto,

            fechaInicioMontaje,
            fechaFinMontaje,

            fechaInicioEvento,
            fechaFinEvento,

            fechaInicioDesmontaje,
            fechaFinDesmontaje,

            fechaInicioCerrado,
            fechaFinCerrado,

            tipoEvento,
            personas,
            agendadoPor,

            actividad,
            descripcion,
            observaciones,
            estado
        } = req.body;

        const data = {};

        if (clienteId !== undefined)
            data.clienteId = Number(clienteId);

        if (espacioId !== undefined)
            data.espacioId = Number(espacioId);

        if (nombreEvento !== undefined)
            data.nombreEvento = nombreEvento;

        if (contactoResponsable !== undefined)
            data.contactoResponsable = contactoResponsable;

        if (celular !== undefined)
            data.celular = celular;

        if (correo !== undefined)
            data.correo = correo;

        if (modalidadCosto !== undefined)
            data.modalidadCosto = modalidadCosto;

        if (fechaInicioMontaje !== undefined)
            data.fechaInicioMontaje = fechaInicioMontaje
                ? new Date(fechaInicioMontaje)
                : null;

        if (fechaFinMontaje !== undefined)
            data.fechaFinMontaje = fechaFinMontaje
                ? new Date(fechaFinMontaje)
                : null;

        if (fechaInicioEvento !== undefined)
            data.fechaInicioEvento = fechaInicioEvento
                ? new Date(fechaInicioEvento)
                : null;

        if (fechaFinEvento !== undefined)
            data.fechaFinEvento = fechaFinEvento
                ? new Date(fechaFinEvento)
                : null;

        if (fechaInicioDesmontaje !== undefined)
            data.fechaInicioDesmontaje = fechaInicioDesmontaje
                ? new Date(fechaInicioDesmontaje)
                : null;

        if (fechaFinDesmontaje !== undefined)
            data.fechaFinDesmontaje = fechaFinDesmontaje
                ? new Date(fechaFinDesmontaje)
                : null;

        if (fechaInicioCerrado !== undefined)
            data.fechaInicioCerrado = fechaInicioCerrado
                ? new Date(fechaInicioCerrado)
                : null;

        if (fechaFinCerrado !== undefined)
            data.fechaFinCerrado = fechaFinCerrado
                ? new Date(fechaFinCerrado)
                : null;

        if (tipoEvento !== undefined)
            data.tipoEvento = tipoEvento;

        if (personas !== undefined)
            data.personas = personas
                ? Number(personas)
                : null;

        if (agendadoPor !== undefined)
            data.agendadoPor = agendadoPor;

        if (actividad !== undefined)
            data.actividad = actividad;

        if (descripcion !== undefined)
            data.descripcion = descripcion;

        if (observaciones !== undefined)
            data.observaciones = observaciones;

        if (estado !== undefined)
            data.estado = estado;

        const solicitud = await prisma.solicitud.update({
            where: {
                id: Number(id)
            },
            data,
            include: {
                cliente: true,
                espacio: true
            }
        });

        res.json({
            message: 'Solicitud actualizada correctamente',
            solicitud
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Error al actualizar solicitud'
        });
    }
}

async function eliminarSolicitud(req, res) {
    try {
        const { id } = req.params;

        const solicitudExiste = await prisma.solicitud.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!solicitudExiste) {
            return res.status(404).json({
                message: 'Solicitud no encontrada'
            });
        }

        await prisma.solicitud.delete({
            where: {
                id: Number(id)
            }
        });

        res.json({
            message: 'Solicitud eliminada correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al eliminar solicitud'
        });
    }
}

async function aprobarSolicitud(req, res) {
    try {
        const { id } = req.params;

        const solicitud = await prisma.solicitud.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!solicitud) {
            return res.status(404).json({
                message: 'Solicitud no encontrada'
            });
        }

        if (solicitud.estado !== 'PENDIENTE') {
            return res.status(400).json({
                message: 'La solicitud ya fue procesada'
            });
        }

        if (!solicitud.espacioId) {
            return res.status(400).json({
                message: 'La solicitud no tiene espacio asignado'
            });
        }

        const { fechaInicioOcupacion, fechaFinOcupacion } = obtenerRangoOcupacion(solicitud);

        if (!fechaInicioOcupacion || !fechaFinOcupacion) {
            return res.status(400).json({
                message: 'La solicitud no tiene fechas válidas para aprobar'
            });
        }

        const conflicto = await prisma.reserva.findFirst({
            where: {
                espacioId: solicitud.espacioId,
                estado: 'ACTIVA',
                fechaInicio: {
                    lt: fechaFinOcupacion
                },
                fechaFin: {
                    gt: fechaInicioOcupacion
                }
            }
        });

        if (conflicto) {
            return res.status(400).json({
                message: 'Existe una reserva en ese horario'
            });
        }

        const reserva = await prisma.reserva.create({
            data: {
                solicitudId: solicitud.id,
                espacioId: solicitud.espacioId,

                fechaInicio: fechaInicioOcupacion,
                fechaFin: fechaFinOcupacion,

                fechaInicioMontaje: solicitud.fechaInicioMontaje,
                fechaFinMontaje: solicitud.fechaFinMontaje,

                fechaInicioEvento: solicitud.fechaInicioEvento,
                fechaFinEvento: solicitud.fechaFinEvento,

                fechaInicioDesmontaje: solicitud.fechaInicioDesmontaje,
                fechaFinDesmontaje: solicitud.fechaFinDesmontaje,

                fechaInicioCerrado: solicitud.fechaInicioCerrado,
                fechaFinCerrado: solicitud.fechaFinCerrado
            }
        });

        const facturaExistente = await prisma.factura.findFirst({
    where: {
        reservaId: reserva.id
    }
});

let factura = null;

if (!facturaExistente) {
    factura = await prisma.factura.create({
        data: {
            numero: generarNumeroFactura(),
            clienteId: solicitud.clienteId,
            reservaId: reserva.id,
            concepto: `Uso de espacio: ${solicitud.nombreEvento}`,
            monto: solicitud.costoEstimado || 0,
            estado: 'PENDIENTE',
            observaciones: 'Factura generada automáticamente al aprobar la solicitud'
        }
    });
}

        await prisma.solicitud.update({
            where: {
                id: solicitud.id
            },
            data: {
                estado: 'APROBADA'
            }
        });

        await registrarAuditoria({
            usuarioId: req.usuario.id,
            accion: 'APROBAR',
            modulo: 'SOLICITUDES',
            detalle: `Solicitud ${solicitud.codigo} aprobada`
        });

       res.json({
    message: 'Solicitud aprobada correctamente',
    reserva,
    factura
});

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al aprobar solicitud'
        });
    }
}

async function calendarioSolicitudes(req, res) {
    try {
        const solicitudes = await prisma.solicitud.findMany({
            where: {
                estado: {
                    in: ['APROBADA']
                }
            },
            include: {
                cliente: true,
                espacio: true
            },
            orderBy: {
                fechaInicioEvento: 'asc'
            }
        });

        const eventos = solicitudes.map((solicitud) => {
            const fechaInicio =
                solicitud.fechaInicioMontaje ||
                solicitud.fechaInicioEvento;

            const fechaFin =
                solicitud.fechaFinDesmontaje ||
                solicitud.fechaFinEvento;

            return {
                id: solicitud.id,
                codigo: solicitud.codigo,
                titulo: solicitud.nombreEvento,
                cliente: solicitud.cliente?.nombre,
                espacio: solicitud.espacio?.nombre,
                estado: solicitud.estado,
                fechaInicio,
                fechaFin,
                costoEstimado: solicitud.costoEstimado,
                solicitud
            };
        });

        res.json(eventos);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener calendario de solicitudes'
        });
    }
}

async function rechazarSolicitud(req, res) {

    try {

        const { id } = req.params;

        const solicitud = await prisma.solicitud.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!solicitud) {
            return res.status(404).json({
                message: 'Solicitud no encontrada'
            });
        }

        await prisma.solicitud.update({
            where: {
                id: Number(id)
            },
            data: {
                estado: 'RECHAZADA'
            }
        });

        res.json({
            message: 'Solicitud rechazada correctamente'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Error al rechazar solicitud'
        });

    }
}

async function calcularCosto(req, res) {
    try {
        const {
            espacioId,
            modalidadCosto,
            fechaInicioMontaje,
            fechaFinMontaje,
            fechaInicioEvento,
            fechaFinEvento,
            fechaInicioDesmontaje,
            fechaFinDesmontaje,
            fechaInicioCerrado,
            fechaFinCerrado
        } = req.body;

        if (!espacioId) {
            return res.status(400).json({
                message: 'El espacio es obligatorio'
            });
        }

        const espacio = await prisma.espacio.findUnique({
            where: {
                id: Number(espacioId)
            }
        });

        if (!espacio) {
            return res.status(404).json({
                message: 'Espacio no encontrado'
            });
        }

        const costoEstimado = calcularCostoSolicitud(espacio, {
            modalidadCosto: modalidadCosto || 'ESTANDAR',
            fechaInicioMontaje,
            fechaFinMontaje,
            fechaInicioEvento,
            fechaFinEvento,
            fechaInicioDesmontaje,
            fechaFinDesmontaje,
            fechaInicioCerrado,
            fechaFinCerrado
        });

        res.json({
            costoEstimado
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al calcular costo'
        });
    }
}

module.exports = {
    listarSolicitudes,
    obtenerSolicitud,
    crearSolicitud,
    actualizarSolicitud,
    eliminarSolicitud,
    aprobarSolicitud,
    rechazarSolicitud,
    calcularCosto,
    calendarioSolicitudes
};