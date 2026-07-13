const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');
const {
    buscarClientePorNombreSimilar
} = require('../lib/clienteNombre');

const ESTADOS_SOLICITUD = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA'];
const ESTADOS_EDITABLES_DESDE_FORMULARIO = ['PENDIENTE', 'RECHAZADA', 'CANCELADA'];

function convertirId(valor, nombre = 'id') {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0) {
        const error = new Error(`${nombre} inválido`);
        error.statusCode = 400;
        throw error;
    }
    return numero;
}

function convertirFecha(valor, nombre, obligatoria = false) {
    if (valor === undefined || valor === null || valor === '') {
        if (obligatoria) {
            const error = new Error(`${nombre} es obligatoria`);
            error.statusCode = 400;
            throw error;
        }
        return null;
    }

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
        const error = new Error(`${nombre} no contiene una fecha válida`);
        error.statusCode = 400;
        throw error;
    }
    return fecha;
}

function validarParFechas(inicio, fin, etiqueta, obligatorio = false) {
    if (obligatorio && (!inicio || !fin)) {
        const error = new Error(`Las fechas de inicio y fin de ${etiqueta} son obligatorias`);
        error.statusCode = 400;
        throw error;
    }

    if ((inicio && !fin) || (!inicio && fin)) {
        const error = new Error(`Debe indicar tanto el inicio como el fin de ${etiqueta}`);
        error.statusCode = 400;
        throw error;
    }

    if (inicio && fin && fin <= inicio) {
        const error = new Error(`La fecha final de ${etiqueta} debe ser posterior a la fecha inicial`);
        error.statusCode = 400;
        throw error;
    }
}

function normalizarFechas(datos) {
    const fechas = {
        fechaInicioMontaje: convertirFecha(datos.fechaInicioMontaje, 'Fecha de inicio de montaje'),
        fechaFinMontaje: convertirFecha(datos.fechaFinMontaje, 'Fecha de fin de montaje'),
        fechaInicioEvento: convertirFecha(datos.fechaInicioEvento, 'Fecha de inicio del evento', true),
        fechaFinEvento: convertirFecha(datos.fechaFinEvento, 'Fecha de fin del evento', true),
        fechaInicioDesmontaje: convertirFecha(datos.fechaInicioDesmontaje, 'Fecha de inicio de desmontaje'),
        fechaFinDesmontaje: convertirFecha(datos.fechaFinDesmontaje, 'Fecha de fin de desmontaje'),
        fechaInicioCerrado: convertirFecha(datos.fechaInicioCerrado, 'Fecha de inicio de cierre'),
        fechaFinCerrado: convertirFecha(datos.fechaFinCerrado, 'Fecha de fin de cierre')
    };

    validarParFechas(fechas.fechaInicioMontaje, fechas.fechaFinMontaje, 'montaje');
    validarParFechas(fechas.fechaInicioEvento, fechas.fechaFinEvento, 'evento', true);
    validarParFechas(fechas.fechaInicioDesmontaje, fechas.fechaFinDesmontaje, 'desmontaje');
    validarParFechas(fechas.fechaInicioCerrado, fechas.fechaFinCerrado, 'cierre');

    return fechas;
}

function obtenerRangoOcupacion(datos) {
    const inicios = [
        datos.fechaInicioMontaje,
        datos.fechaInicioEvento,
        datos.fechaInicioDesmontaje,
        datos.fechaInicioCerrado
    ].filter(Boolean).map((fecha) => new Date(fecha));

    const finales = [
        datos.fechaFinMontaje,
        datos.fechaFinEvento,
        datos.fechaFinDesmontaje,
        datos.fechaFinCerrado
    ].filter(Boolean).map((fecha) => new Date(fecha));

    if (!inicios.length || !finales.length) {
        return { fechaInicioOcupacion: null, fechaFinOcupacion: null };
    }

    return {
        fechaInicioOcupacion: new Date(Math.min(...inicios.map((fecha) => fecha.getTime()))),
        fechaFinOcupacion: new Date(Math.max(...finales.map((fecha) => fecha.getTime())))
    };
}

function calcularHoras(inicio, fin) {
    if (!inicio || !fin) return 0;
    return Math.max(0, (new Date(fin) - new Date(inicio)) / 3600000);
}

function calcularDias(inicio, fin) {
    if (!inicio || !fin) return 0;
    return Math.max(0, Math.ceil((new Date(fin) - new Date(inicio)) / 86400000));
}

function calcularCostoSolicitud(espacio, datos) {
    if (['ESCUELA_CDLA', 'GRATUITO'].includes(datos.modalidadCosto)) return 0;

    return Number((
        calcularHoras(datos.fechaInicioMontaje, datos.fechaFinMontaje) * Number(espacio.precioMontaje || 0) +
        calcularHoras(datos.fechaInicioEvento, datos.fechaFinEvento) * Number(espacio.precioEvento || 0) +
        calcularHoras(datos.fechaInicioDesmontaje, datos.fechaFinDesmontaje) * Number(espacio.precioDesmontaje || 0) +
        calcularDias(datos.fechaInicioCerrado, datos.fechaFinCerrado) * Number(espacio.precioCerrado || 0)
    ).toFixed(2));
}

async function generarCodigoUnico(modelo, prefijo, campo = 'codigo', tx = prisma) {
    const year = new Date().getFullYear();

    for (let intento = 0; intento < 20; intento += 1) {
        const codigo = `${prefijo}-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
        const existente = await tx[modelo].findFirst({ where: { [campo]: codigo }, select: { id: true } });
        if (!existente) return codigo;
    }

    const error = new Error(`No fue posible generar un código único para ${prefijo}`);
    error.statusCode = 500;
    throw error;
}

async function buscarConflicto({
    espacioId,
    fechaInicio,
    fechaFin,
    excluirSolicitudId = null,
    excluirReservaId = null,
    tx = prisma
}) {
    if (!fechaInicio || !fechaFin) return null;

    const reserva = await tx.reserva.findFirst({
        where: {
            espacioId,
            estado: 'ACTIVA',
            ...(excluirReservaId ? { id: { not: excluirReservaId } } : {}),
            fechaInicio: { lt: fechaFin },
            fechaFin: { gt: fechaInicio }
        },
        include: { solicitud: { select: { id: true, codigo: true, nombreEvento: true } } }
    });

    if (reserva) {
        return {
            tipo: 'RESERVA',
            codigo: reserva.solicitud?.codigo || `Reserva #${reserva.id}`,
            nombreEvento: reserva.solicitud?.nombreEvento || null,
            fechaInicio: reserva.fechaInicio,
            fechaFin: reserva.fechaFin
        };
    }

    const solicitud = await tx.solicitud.findFirst({
        where: {
            espacioId,
            estado: { in: ['PENDIENTE', 'APROBADA'] },
            ...(excluirSolicitudId ? { id: { not: excluirSolicitudId } } : {}),
            AND: [
                { fechaInicioEvento: { lt: fechaFin } },
                { fechaFinEvento: { gt: fechaInicio } }
            ]
        },
        select: {
            id: true,
            codigo: true,
            nombreEvento: true,
            estado: true,
            fechaInicioEvento: true,
            fechaFinEvento: true
        }
    });

    if (!solicitud) return null;

    return {
        tipo: 'SOLICITUD',
        codigo: solicitud.codigo,
        nombreEvento: solicitud.nombreEvento,
        estado: solicitud.estado,
        fechaInicio: solicitud.fechaInicioEvento,
        fechaFin: solicitud.fechaFinEvento
    };
}

function responderError(res, error, mensajeGeneral) {
    console.error(error);
    const status = error.statusCode || 500;
    return res.status(status).json({ message: status === 500 ? mensajeGeneral : error.message });
}

async function verificarDisponibilidad(req, res) {
    try {
        const espacioId = convertirId(req.body.espacioId, 'espacioId');
        const fechas = normalizarFechas(req.body);
        const { fechaInicioOcupacion, fechaFinOcupacion } = obtenerRangoOcupacion(fechas);

        const espacio = await prisma.espacio.findUnique({ where: { id: espacioId }, select: { id: true, nombre: true } });
        if (!espacio) return res.status(404).json({ message: 'Espacio no encontrado' });

        const conflicto = await buscarConflicto({
            espacioId,
            fechaInicio: fechaInicioOcupacion,
            fechaFin: fechaFinOcupacion,
            excluirSolicitudId: req.body.solicitudId ? convertirId(req.body.solicitudId, 'solicitudId') : null
        });

        return res.json({
            disponible: !conflicto,
            message: conflicto
                ? `El espacio ya está ocupado por ${conflicto.codigo}${conflicto.nombreEvento ? ` - ${conflicto.nombreEvento}` : ''}.`
                : 'El espacio está disponible en el rango seleccionado.',
            conflicto
        });
    } catch (error) {
        return responderError(res, error, 'Error al verificar la disponibilidad');
    }
}

async function listarSolicitudes(req, res) {
    try {
        const { buscar, estado, clienteId, espacioId, fechaInicio, fechaFin } = req.query;
        const where = {};

        if (buscar?.trim()) {
            where.OR = ['codigo', 'nombreEvento', 'actividad'].map((campo) => ({
                [campo]: { contains: buscar.trim(), mode: 'insensitive' }
            }));
        }
        if (estado) where.estado = estado;
        if (clienteId) where.clienteId = convertirId(clienteId, 'clienteId');
        if (espacioId) where.espacioId = convertirId(espacioId, 'espacioId');

        if (fechaInicio || fechaFin) {
            where.creadoEn = {};
            if (fechaInicio) {
                const inicio = convertirFecha(`${fechaInicio}T00:00:00`, 'fechaInicio');
                where.creadoEn.gte = inicio;
            }
            if (fechaFin) {
                const fin = convertirFecha(`${fechaFin}T23:59:59.999`, 'fechaFin');
                where.creadoEn.lte = fin;
            }
        }

        const solicitudes = await prisma.solicitud.findMany({
            where,
            include: {
                cliente: true,
                espacio: true,
                reserva: { include: { facturas: true, espacio: true } }
            },
            orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]
        });

        return res.json(solicitudes);
    } catch (error) {
        return responderError(res, error, 'Error al listar solicitudes');
    }
}

async function obtenerSolicitud(req, res) {
    try {
        const id = convertirId(req.params.id);
        const solicitud = await prisma.solicitud.findUnique({
            where: { id },
            include: {
                cliente: true,
                espacio: true,
                reserva: { include: { facturas: true, espacio: true } }
            }
        });

        if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
        return res.json(solicitud);
    } catch (error) {
        return responderError(res, error, 'Error al obtener la solicitud');
    }
}

async function resolverCliente(datos, tx) {
    if (datos.clienteId) {
        const clienteId = convertirId(
            datos.clienteId,
            'clienteId'
        );

        const cliente = await tx.cliente.findUnique({
            where: {
                id: clienteId
            }
        });

        if (!cliente) {
            const error = new Error(
                'El cliente seleccionado no existe'
            );

            error.statusCode = 404;
            throw error;
        }

        if (!cliente.activo) {
            const error = new Error(
                'El cliente seleccionado está inactivo'
            );

            error.statusCode = 409;
            throw error;
        }

        return cliente;
    }

    const nombre = datos.clienteNombre?.trim();

    if (!nombre) {
        const error = new Error(
            'Debe seleccionar un cliente o escribir el nombre de uno nuevo'
        );

        error.statusCode = 400;
        throw error;
    }

    /*
     * Evita crear:
     * "Ministerio de Cultura"
     * "ministerio de cultura"
     * "Ministerio Cultura"
     */
    const coincidencia =
        await buscarClientePorNombreSimilar(
            tx,
            nombre
        );

    if (coincidencia) {
        /*
         * En solicitudes es mejor reutilizar automáticamente
         * el cliente existente, en lugar de devolver un error.
         */
        return coincidencia.cliente;
    }

    return tx.cliente.create({
        data: {
            nombre,
            cedulaRuc:
                datos.clienteCedulaRuc?.trim() || null,

            telefono:
                datos.celular?.trim() || null,

            correo:
                datos.correo?.trim() || null,

            direccion:
                datos.clienteDireccion?.trim() || null,

            tipoCliente:
                datos.clienteTipoCliente?.trim() || null,

            contactoResponsable:
                datos.contactoResponsable?.trim() || null,

            activo: true
        }
    });
}

async function crearSolicitud(req, res) {
    try {
        const datos = req.body;
        const espacioId = convertirId(datos.espacioId, 'espacioId');
        if (!datos.nombreEvento?.trim()) {
            const error = new Error('El nombre del evento es obligatorio');
            error.statusCode = 400;
            throw error;
        }

        const fechas = normalizarFechas(datos);
        const { fechaInicioOcupacion, fechaFinOcupacion } = obtenerRangoOcupacion(fechas);

        const resultado = await prisma.$transaction(async (tx) => {
            const espacio = await tx.espacio.findUnique({ where: { id: espacioId } });
            if (!espacio) {
                const error = new Error('Espacio no encontrado');
                error.statusCode = 404;
                throw error;
            }

            const conflicto = await buscarConflicto({
                espacioId,
                fechaInicio: fechaInicioOcupacion,
                fechaFin: fechaFinOcupacion,
                tx
            });
            if (conflicto) {
                const error = new Error(`El espacio ya está ocupado por ${conflicto.codigo}${conflicto.nombreEvento ? ` - ${conflicto.nombreEvento}` : ''}.`);
                error.statusCode = 409;
                throw error;
            }

            const cliente = await resolverCliente(datos, tx);
            const modalidadCosto = datos.modalidadCosto || 'ESTANDAR';
            const codigo = await generarCodigoUnico('solicitud', 'SOL', 'codigo', tx);

            return tx.solicitud.create({
                data: {
                    codigo,
                    clienteId: cliente.id,
                    espacioId,
                    nombreEvento: datos.nombreEvento.trim(),
                    contactoResponsable: datos.contactoResponsable?.trim() || null,
                    celular: datos.celular?.trim() || null,
                    correo: datos.correo?.trim() || null,
                    modalidadCosto,
                    ...fechas,
                    tipoEvento: datos.tipoEvento || null,
                    personas: datos.personas === '' || datos.personas == null ? null : Number(datos.personas),
                    agendadoPor: datos.agendadoPor?.trim() || null,
                    actividad: datos.actividad?.trim() || null,
                    descripcion: datos.descripcion?.trim() || null,
                    observaciones: datos.observaciones?.trim() || null,
                    costoEstimado: calcularCostoSolicitud(espacio, { modalidadCosto, ...fechas }),
                    estado: 'PENDIENTE'
                },
                include: { cliente: true, espacio: true }
            });
        });

        return res.status(201).json({ message: 'Solicitud creada correctamente', solicitud: resultado });
    } catch (error) {
        return responderError(res, error, 'Error al crear la solicitud');
    }
}

async function actualizarSolicitud(req, res) {
    try {
        const id = convertirId(req.params.id);
        const datos = req.body;

        const actualizada = await prisma.$transaction(async (tx) => {
            const actual = await tx.solicitud.findUnique({ where: { id }, include: { reserva: true } });
            if (!actual) {
                const error = new Error('Solicitud no encontrada');
                error.statusCode = 404;
                throw error;
            }

            const combinado = {
                ...actual,
                ...datos,
                fechaInicioMontaje: datos.fechaInicioMontaje !== undefined ? datos.fechaInicioMontaje : actual.fechaInicioMontaje,
                fechaFinMontaje: datos.fechaFinMontaje !== undefined ? datos.fechaFinMontaje : actual.fechaFinMontaje,
                fechaInicioEvento: datos.fechaInicioEvento !== undefined ? datos.fechaInicioEvento : actual.fechaInicioEvento,
                fechaFinEvento: datos.fechaFinEvento !== undefined ? datos.fechaFinEvento : actual.fechaFinEvento,
                fechaInicioDesmontaje: datos.fechaInicioDesmontaje !== undefined ? datos.fechaInicioDesmontaje : actual.fechaInicioDesmontaje,
                fechaFinDesmontaje: datos.fechaFinDesmontaje !== undefined ? datos.fechaFinDesmontaje : actual.fechaFinDesmontaje,
                fechaInicioCerrado: datos.fechaInicioCerrado !== undefined ? datos.fechaInicioCerrado : actual.fechaInicioCerrado,
                fechaFinCerrado: datos.fechaFinCerrado !== undefined ? datos.fechaFinCerrado : actual.fechaFinCerrado
            };

            const fechas = normalizarFechas(combinado);
            const espacioId = datos.espacioId !== undefined ? convertirId(datos.espacioId, 'espacioId') : actual.espacioId;
            const espacio = await tx.espacio.findUnique({ where: { id: espacioId } });
            if (!espacio) {
                const error = new Error('Espacio no encontrado');
                error.statusCode = 404;
                throw error;
            }

            const { fechaInicioOcupacion, fechaFinOcupacion } = obtenerRangoOcupacion(fechas);
            const conflicto = await buscarConflicto({
                espacioId,
                fechaInicio: fechaInicioOcupacion,
                fechaFin: fechaFinOcupacion,
                excluirSolicitudId: id,
                excluirReservaId: actual.reserva?.id || null,
                tx
            });
            if (conflicto) {
                const error = new Error(`No se puede guardar: el espacio choca con ${conflicto.codigo}${conflicto.nombreEvento ? ` - ${conflicto.nombreEvento}` : ''}.`);
                error.statusCode = 409;
                throw error;
            }

            if (datos.estado !== undefined && !ESTADOS_EDITABLES_DESDE_FORMULARIO.includes(datos.estado)) {
                const error = new Error('La aprobación debe hacerse únicamente con el botón de aprobar');
                error.statusCode = 400;
                throw error;
            }

            const modalidadCosto = datos.modalidadCosto ?? actual.modalidadCosto;
            const data = {
                espacioId,
                ...fechas,
                modalidadCosto,
                costoEstimado: calcularCostoSolicitud(espacio, { modalidadCosto, ...fechas })
            };

            const camposTexto = ['nombreEvento', 'contactoResponsable', 'celular', 'correo', 'tipoEvento', 'agendadoPor', 'actividad', 'descripcion', 'observaciones'];
            camposTexto.forEach((campo) => {
                if (datos[campo] !== undefined) data[campo] = datos[campo]?.trim() || null;
            });
            if (datos.clienteId !== undefined) data.clienteId = convertirId(datos.clienteId, 'clienteId');
            if (datos.personas !== undefined) data.personas = datos.personas === '' || datos.personas === null ? null : Number(datos.personas);
            if (datos.estado !== undefined) data.estado = datos.estado;

            const solicitud = await tx.solicitud.update({
                where: { id },
                data,
                include: { cliente: true, espacio: true, reserva: true }
            });

            if (actual.reserva && actual.estado === 'APROBADA') {
                await tx.reserva.update({
                    where: { id: actual.reserva.id },
                    data: {
                        espacioId,
                        fechaInicio: fechaInicioOcupacion,
                        fechaFin: fechaFinOcupacion,
                        ...fechas
                    }
                });
            }

            return solicitud;
        });

        return res.json({ message: 'Solicitud actualizada correctamente', solicitud: actualizada });
    } catch (error) {
        return responderError(res, error, 'Error al actualizar la solicitud');
    }
}

async function eliminarSolicitud(req, res) {
    try {
        const id = convertirId(req.params.id);
        const solicitud = await prisma.solicitud.findUnique({ where: { id }, include: { reserva: true } });
        if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
        if (solicitud.reserva || solicitud.estado === 'APROBADA') {
            return res.status(409).json({ message: 'No se puede eliminar una solicitud aprobada o vinculada a una reserva. Debe cancelarla.' });
        }
        await prisma.solicitud.delete({ where: { id } });
        return res.json({ message: 'Solicitud eliminada correctamente' });
    } catch (error) {
        return responderError(res, error, 'Error al eliminar la solicitud');
    }
}

async function aprobarSolicitud(req, res) {
    try {
        const id = convertirId(req.params.id);

        const resultado = await prisma.$transaction(async (tx) => {
            const solicitud = await tx.solicitud.findUnique({ where: { id }, include: { reserva: true } });
            if (!solicitud) {
                const error = new Error('Solicitud no encontrada');
                error.statusCode = 404;
                throw error;
            }
            if (solicitud.estado !== 'PENDIENTE') {
                const error = new Error('La solicitud ya fue procesada');
                error.statusCode = 409;
                throw error;
            }
            if (solicitud.reserva) {
                const error = new Error('La solicitud ya tiene una reserva asociada');
                error.statusCode = 409;
                throw error;
            }

            const { fechaInicioOcupacion, fechaFinOcupacion } = obtenerRangoOcupacion(solicitud);
            const conflicto = await buscarConflicto({
                espacioId: solicitud.espacioId,
                fechaInicio: fechaInicioOcupacion,
                fechaFin: fechaFinOcupacion,
                excluirSolicitudId: solicitud.id,
                tx
            });
            if (conflicto) {
                const error = new Error(`No se puede aprobar: existe un conflicto con ${conflicto.codigo}.`);
                error.statusCode = 409;
                throw error;
            }

            const reserva = await tx.reserva.create({
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
                    fechaFinCerrado: solicitud.fechaFinCerrado,
                    estado: 'ACTIVA'
                }
            });

            const numero = await generarCodigoUnico('factura', 'FAC', 'numero', tx);
            const factura = await tx.factura.create({
                data: {
                    numero,
                    clienteId: solicitud.clienteId,
                    reservaId: reserva.id,
                    concepto: `Uso de espacio: ${solicitud.nombreEvento}`,
                    monto: solicitud.costoEstimado || 0,
                    estado: 'PENDIENTE',
                    observaciones: 'Factura generada automáticamente al aprobar la solicitud'
                }
            });

            const solicitudActualizada = await tx.solicitud.update({
                where: { id },
                data: { estado: 'APROBADA' }
            });

            return { reserva, factura, solicitud: solicitudActualizada };
        });

        if (req.usuario?.id) {
            await registrarAuditoria({
                usuarioId: req.usuario.id,
                accion: 'APROBAR',
                modulo: 'SOLICITUDES',
                detalle: `Solicitud ${resultado.solicitud.codigo} aprobada`
            });
        }

        return res.json({ message: 'Solicitud aprobada correctamente', ...resultado });
    } catch (error) {
        return responderError(res, error, 'Error al aprobar la solicitud');
    }
}

async function rechazarSolicitud(req, res) {
    try {
        const id = convertirId(req.params.id);
        const solicitud = await prisma.solicitud.findUnique({ where: { id } });
        if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
        if (solicitud.estado !== 'PENDIENTE') return res.status(409).json({ message: 'Solo se pueden rechazar solicitudes pendientes' });

        const actualizada = await prisma.solicitud.update({ where: { id }, data: { estado: 'RECHAZADA' } });
        return res.json({ message: 'Solicitud rechazada correctamente', solicitud: actualizada });
    } catch (error) {
        return responderError(res, error, 'Error al rechazar la solicitud');
    }
}

async function actualizarEstadoSolicitud(req, res) {
    try {
        const id = convertirId(req.params.id);
        const { estado } = req.body;

        if (!ESTADOS_SOLICITUD.includes(estado)) return res.status(400).json({ message: 'Estado no válido' });
        if (!ESTADOS_EDITABLES_DESDE_FORMULARIO.includes(estado)) {
            return res.status(400).json({ message: 'La aprobación debe realizarse con el botón de aprobar' });
        }

        const solicitud = await prisma.solicitud.findUnique({ where: { id }, include: { reserva: true } });
        if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
        if (solicitud.estado === 'APROBADA' && !['PENDIENTE', 'CANCELADA'].includes(estado)) {
            return res.status(409).json({
                message: 'Una solicitud aprobada solo puede volver a PENDIENTE o cambiarse a CANCELADA'
            });
        }

        const actualizada = await prisma.$transaction(async (tx) => {
            // Volver a pendiente debe liberar completamente el espacio.
            // Se elimina la factura automática y la reserva para permitir
            // que la solicitud pueda aprobarse nuevamente más adelante.
            if (estado === 'PENDIENTE' && solicitud.reserva) {
                await tx.factura.deleteMany({
                    where: { reservaId: solicitud.reserva.id }
                });

                await tx.reserva.delete({
                    where: { id: solicitud.reserva.id }
                });
            }

            if (estado === 'CANCELADA' && solicitud.reserva) {
                await tx.reserva.update({
                    where: { id: solicitud.reserva.id },
                    data: { estado: 'CANCELADA' }
                });
            }

            return tx.solicitud.update({
                where: { id },
                data: { estado }
            });
        });

        return res.json({ message: 'Estado actualizado correctamente', solicitud: actualizada });
    } catch (error) {
        return responderError(res, error, 'Error al actualizar el estado');
    }
}

async function calcularCosto(req, res) {
    try {
        const espacioId = convertirId(req.body.espacioId, 'espacioId');
        const fechas = normalizarFechas(req.body);
        const espacio = await prisma.espacio.findUnique({ where: { id: espacioId } });
        if (!espacio) return res.status(404).json({ message: 'Espacio no encontrado' });

        return res.json({
            costoEstimado: calcularCostoSolicitud(espacio, {
                modalidadCosto: req.body.modalidadCosto || 'ESTANDAR',
                ...fechas
            })
        });
    } catch (error) {
        return responderError(res, error, 'Error al calcular el costo');
    }
}

async function calendarioSolicitudes(req, res) {
    try {
        const solicitudes = await prisma.solicitud.findMany({
            where: { estado: 'APROBADA' },
            include: { cliente: true, espacio: true },
            orderBy: { fechaInicioEvento: 'asc' }
        });

        return res.json(solicitudes.map((solicitud) => {
            const { fechaInicioOcupacion, fechaFinOcupacion } = obtenerRangoOcupacion(solicitud);
            return {
                id: solicitud.id,
                codigo: solicitud.codigo,
                titulo: solicitud.nombreEvento,
                cliente: solicitud.cliente?.nombre,
                espacio: solicitud.espacio?.nombre,
                estado: solicitud.estado,
                fechaInicio: fechaInicioOcupacion,
                fechaFin: fechaFinOcupacion,
                costoEstimado: solicitud.costoEstimado,
                solicitud
            };
        }));
    } catch (error) {
        return responderError(res, error, 'Error al obtener el calendario de solicitudes');
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Intl.DateTimeFormat('es-PA', {
        day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Panama'
    }).format(new Date(fecha));
}

function formatearHora(fecha) {
    if (!fecha) return '-';
    return new Intl.DateTimeFormat('es-PA', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Panama'
    }).format(new Date(fecha));
}

async function descargarCalendarioPDF(req, res) {
    try {
        const PDFDocument = require('pdfkit');

        const {
            fecha,
            mes: mesQuery,
            anio: anioQuery
        } = req.query;

        let inicio;
        let fin;
        let tituloPeriodo;
        let nombreArchivo;
        let mensajeSinEventos;

        /* ==========================================
           REPORTE POR DÍA
        ========================================== */

        if (fecha) {
            const partes = fecha.split('-');

            if (partes.length !== 3) {
                return res.status(400).json({
                    message:
                        'La fecha seleccionada no es válida'
                });
            }

            const anioFecha = Number(partes[0]);
            const mesFecha = Number(partes[1]);
            const diaFecha = Number(partes[2]);

            if (
                !Number.isInteger(anioFecha) ||
                !Number.isInteger(mesFecha) ||
                !Number.isInteger(diaFecha)
            ) {
                return res.status(400).json({
                    message:
                        'La fecha seleccionada no es válida'
                });
            }

            /*
             * Se construye la fecha de forma local para evitar
             * cambios de día causados por UTC.
             */
            inicio = new Date(
                anioFecha,
                mesFecha - 1,
                diaFecha,
                0,
                0,
                0,
                0
            );

            fin = new Date(
                anioFecha,
                mesFecha - 1,
                diaFecha + 1,
                0,
                0,
                0,
                0
            );

            if (
                Number.isNaN(inicio.getTime()) ||
                inicio.getFullYear() !== anioFecha ||
                inicio.getMonth() !== mesFecha - 1 ||
                inicio.getDate() !== diaFecha
            ) {
                return res.status(400).json({
                    message:
                        'La fecha seleccionada no es válida'
                });
            }

            tituloPeriodo =
                new Intl.DateTimeFormat(
                    'es-PA',
                    {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone:
                            'America/Panama'
                    }
                )
                    .format(inicio)
                    .toUpperCase();

            nombreArchivo =
                `calendario-${fecha}.pdf`;

            mensajeSinEventos =
                'No existen eventos aprobados para el día seleccionado.';
        } else {
            /* ======================================
               REPORTE POR MES
            ====================================== */

            const mes = Number(mesQuery);
            const anio = Number(anioQuery);

            if (
                !Number.isInteger(mes) ||
                mes < 1 ||
                mes > 12 ||
                !Number.isInteger(anio)
            ) {
                return res.status(400).json({
                    message:
                        'Debe seleccionar un mes y un año válidos'
                });
            }

            inicio = new Date(
                anio,
                mes - 1,
                1,
                0,
                0,
                0,
                0
            );

            fin = new Date(
                anio,
                mes,
                1,
                0,
                0,
                0,
                0
            );

            const nombresMeses = [
                'Enero',
                'Febrero',
                'Marzo',
                'Abril',
                'Mayo',
                'Junio',
                'Julio',
                'Agosto',
                'Septiembre',
                'Octubre',
                'Noviembre',
                'Diciembre'
            ];

            tituloPeriodo =
                `${nombresMeses[mes - 1]} ${anio}`
                    .toUpperCase();

            nombreArchivo =
                `calendario-${mes}-${anio}.pdf`;

            mensajeSinEventos =
                'No existen eventos aprobados para el mes seleccionado.';
        }

        /*
         * Incluye cualquier evento que se cruce
         * con el día o mes seleccionado.
         *
         * Ejemplo:
         * - El evento inició ayer y termina hoy.
         * - El evento inicia hoy y termina mañana.
         */
        const solicitudes =
            await prisma.solicitud.findMany({
                where: {
                    estado: 'APROBADA',

                    AND: [
                        {
                            fechaInicioEvento: {
                                lt: fin
                            }
                        },
                        {
                            fechaFinEvento: {
                                gt: inicio
                            }
                        }
                    ]
                },

                include: {
                    cliente: true,
                    espacio: true
                },

                orderBy: [
                    {
                        fechaInicioEvento: 'asc'
                    },
                    {
                        id: 'asc'
                    }
                ]
            });

        const doc = new PDFDocument({
            margin: 35,
            size: 'LETTER',
            layout: 'landscape'
        });

        res.setHeader(
            'Content-Type',
            'application/pdf'
        );

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${nombreArchivo}"`
        );

        doc.pipe(res);

        doc
            .font('Helvetica-Bold')
            .fontSize(16)
            .fillColor('#111827')
            .text(
                'CALENDARIO DE EVENTOS APROBADOS',
                {
                    align: 'center'
                }
            );

        doc.moveDown(0.4);

        doc
            .font('Helvetica')
            .fontSize(11)
            .fillColor('#374151')
            .text(
                tituloPeriodo,
                {
                    align: 'center'
                }
            );

        doc.moveDown();

        if (!solicitudes.length) {
            doc
                .moveDown(5)
                .font('Helvetica-Bold')
                .fontSize(13)
                .fillColor('#374151')
                .text(
                    mensajeSinEventos,
                    {
                        align: 'center'
                    }
                );

            doc.end();
            return;
        }

        const columnas = [
            {
                label: 'Fecha',
                key: 'fecha',
                x: 0,
                width: 100
            },
            {
                label: 'Horario',
                key: 'horario',
                x: 100,
                width: 120
            },
            {
                label: 'Evento',
                key: 'evento',
                x: 220,
                width: 180
            },
            {
                label: 'Cliente',
                key: 'cliente',
                x: 400,
                width: 145
            },
            {
                label: 'Espacio',
                key: 'espacio',
                x: 545,
                width: 125
            },
            {
                label: 'Personas',
                key: 'personas',
                x: 670,
                width: 70
            }
        ];

        const filas = solicitudes.map(
            (solicitud) => {
                const {
                    fechaInicioOcupacion,
                    fechaFinOcupacion
                } = obtenerRangoOcupacion(
                    solicitud
                );

                const inicioEvento =
                    fechaInicioOcupacion ||
                    solicitud.fechaInicioEvento;

                const finEvento =
                    fechaFinOcupacion ||
                    solicitud.fechaFinEvento;

                const mismaFecha =
                    formatearFecha(inicioEvento) ===
                    formatearFecha(finEvento);

                return {
                    fecha: mismaFecha
                        ? formatearFecha(
                            inicioEvento
                        )
                        : `${formatearFecha(
                            inicioEvento
                        )} al ${formatearFecha(
                            finEvento
                        )}`,

                    horario:
                        `${formatearHora(
                            inicioEvento
                        )} - ${formatearHora(
                            finEvento
                        )}`,

                    evento:
                        solicitud.nombreEvento ||
                        '',

                    cliente:
                        solicitud.cliente?.nombre ||
                        '',

                    espacio:
                        solicitud.espacio?.nombre ||
                        '',

                    personas:
                        solicitud.personas
                            ? String(
                                solicitud.personas
                            )
                            : '-'
                };
            }
        );

        dibujarTablaCalendarioPDF(
            doc,
            columnas,
            filas
        );

        doc.end();
    } catch (error) {
        console.error(
            'Error al descargar calendario PDF:',
            error
        );

        if (!res.headersSent) {
            return res.status(500).json({
                message:
                    'Error al descargar el calendario PDF'
            });
        }

        res.end();
    }
}

function dibujarTablaCalendarioPDF(doc, columnas, filas) {
    const startX = 35;
    let y = doc.y;
    const rowHeight = 32;

    const encabezado = () => {
        doc.font('Helvetica-Bold').fontSize(8);
        columnas.forEach((col) => {
            doc.rect(startX + col.x, y, col.width, rowHeight).fillAndStroke('#e5e7eb', '#cbd5e1');
            doc.fillColor('#111827').text(col.label, startX + col.x + 6, y + 10, { width: col.width - 12 });
        });
        y += rowHeight;
    };

    encabezado();
    doc.font('Helvetica').fontSize(8);
    filas.forEach((fila, index) => {
        if (y > 535) {
            doc.addPage();
            y = 45;
            encabezado();
        }
        const fondo = index % 2 === 0 ? '#ffffff' : '#f9fafb';
        columnas.forEach((col) => {
            doc.rect(startX + col.x, y, col.width, rowHeight).fillAndStroke(fondo, '#e5e7eb');
            doc.fillColor('#111827').text(fila[col.key] || '', startX + col.x + 6, y + 10, { width: col.width - 12 });
        });
        y += rowHeight;
    });
}

async function descargarSolicitudPDF(req, res) {
    try {
        const PDFDocument = require('pdfkit');
        const id = convertirId(req.params.id, 'ID de solicitud');

        const solicitud = await prisma.solicitud.findUnique({
            where: {
                id
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

        const factura = solicitud.reserva?.facturas?.[0] || null;

        const doc = new PDFDocument({
            size: 'LETTER',
            margin: 45,
            bufferPages: true,
            info: {
                Title: `Solicitud ${solicitud.codigo}`,
                Author: 'Sistema de Gestión',
                Subject: 'Reporte de solicitud'
            }
        });

        res.setHeader('Content-Type', 'application/pdf');

        res.setHeader(
            'Content-Disposition',
            `attachment; filename="solicitud-${solicitud.codigo || solicitud.id}.pdf"`
        );

        doc.pipe(res);

        /* ==========================================
           ENCABEZADO
        ========================================== */

        dibujarEncabezadoSolicitudPDF(doc, solicitud);

        /* ==========================================
           RESUMEN PRINCIPAL
        ========================================== */

        dibujarTituloSeccionPDF(
            doc,
            'INFORMACIÓN GENERAL'
        );

        dibujarTablaDatosPDF(doc, [
            {
                etiqueta: 'Código',
                valor: solicitud.codigo || '-'
            },
            {
                etiqueta: 'Estado',
                valor: formatearEstadoSolicitud(
                    solicitud.estado
                )
            },
            {
                etiqueta: 'Evento',
                valor: solicitud.nombreEvento || '-'
            },
            {
                etiqueta: 'Tipo de evento',
                valor: solicitud.tipoEvento || '-'
            },
            {
                etiqueta: 'Espacio',
                valor: solicitud.espacio?.nombre || '-'
            },
            {
                etiqueta: 'Cantidad de personas',
                valor: solicitud.personas
                    ? String(solicitud.personas)
                    : '-'
            },
            {
                etiqueta: 'Modalidad de costo',
                valor: solicitud.modalidadCosto || '-'
            },
            {
                etiqueta: 'Costo estimado',
                valor: `B/. ${formatearMontoPDF(
                    solicitud.costoEstimado
                )}`
            }
        ]);

        /* ==========================================
           CLIENTE
        ========================================== */

        dibujarTituloSeccionPDF(
            doc,
            'INFORMACIÓN DEL CLIENTE'
        );

        dibujarTablaDatosPDF(doc, [
            {
                etiqueta: 'Cliente',
                valor: solicitud.cliente?.nombre || '-'
            },
            {
                etiqueta: 'Cédula / RUC',
                valor:
                    solicitud.cliente?.cedulaRuc ||
                    '-'
            },
            {
                etiqueta: 'Contacto responsable',
                valor:
                    solicitud.contactoResponsable ||
                    solicitud.cliente
                        ?.contactoResponsable ||
                    '-'
            },
            {
                etiqueta: 'Teléfono',
                valor:
                    solicitud.celular ||
                    solicitud.cliente?.telefono ||
                    '-'
            },
            {
                etiqueta: 'Correo',
                valor:
                    solicitud.correo ||
                    solicitud.cliente?.correo ||
                    '-'
            },
            {
                etiqueta: 'Dirección',
                valor:
                    solicitud.cliente?.direccion ||
                    '-'
            }
        ]);

        /* ==========================================
           FECHAS
        ========================================== */

        dibujarTituloSeccionPDF(
            doc,
            'PROGRAMACIÓN'
        );

        dibujarTablaFechasPDF(doc, [
            {
                etapa: 'Montaje',
                inicio: solicitud.fechaInicioMontaje,
                fin: solicitud.fechaFinMontaje
            },
            {
                etapa: 'Evento',
                inicio: solicitud.fechaInicioEvento,
                fin: solicitud.fechaFinEvento
            },
            {
                etapa: 'Desmontaje',
                inicio: solicitud.fechaInicioDesmontaje,
                fin: solicitud.fechaFinDesmontaje
            },
            {
                etapa: 'Cierre',
                inicio: solicitud.fechaInicioCerrado,
                fin: solicitud.fechaFinCerrado
            }
        ]);

        /* ==========================================
           INFORMACIÓN ADICIONAL
        ========================================== */

        dibujarTituloSeccionPDF(
            doc,
            'INFORMACIÓN ADICIONAL'
        );

        dibujarBloqueTextoPDF(
            doc,
            'Actividad',
            solicitud.actividad
        );

        dibujarBloqueTextoPDF(
            doc,
            'Descripción',
            solicitud.descripcion
        );

        dibujarBloqueTextoPDF(
            doc,
            'Observaciones',
            solicitud.observaciones
        );

        dibujarBloqueTextoPDF(
            doc,
            'Agendado por',
            solicitud.agendadoPor
        );

        /* ==========================================
           RESERVA Y FACTURA
        ========================================== */

        dibujarTituloSeccionPDF(
            doc,
            'RESERVA Y FACTURACIÓN'
        );

        dibujarTablaDatosPDF(doc, [
            {
                etiqueta: 'Reserva asociada',
                valor: solicitud.reserva
                    ? `Reserva #${solicitud.reserva.id}`
                    : 'Sin reserva asociada'
            },
            {
                etiqueta: 'Estado de reserva',
                valor:
                    solicitud.reserva?.estado ||
                    'Sin reserva'
            },
            {
                etiqueta: 'Factura',
                valor:
                    factura?.numero ||
                    'Sin factura'
            },
            {
                etiqueta: 'Estado de factura',
                valor:
                    factura?.estado ||
                    'Sin factura'
            },
            {
                etiqueta: 'Monto facturado',
                valor: factura
                    ? `B/. ${formatearMontoPDF(
                        factura.monto
                    )}`
                    : 'B/. 0.00'
            },
            {
                etiqueta: 'Fecha de registro',
                valor: formatearFechaHoraPDF(
                    solicitud.creadoEn
                )
            }
        ]);

        /* ==========================================
           FIRMAS
        ========================================== */

        dibujarFirmasSolicitudPDF(doc);

        /* ==========================================
           PIE DE PÁGINA
        ========================================== */

        agregarPiePaginasSolicitudPDF(
            doc,
            solicitud.codigo
        );

        doc.end();
    } catch (error) {
        console.error(
            'Error al generar PDF de solicitud:',
            error
        );

        if (!res.headersSent) {
            return responderError(
                res,
                error,
                'Error al generar el PDF de la solicitud'
            );
        }

        res.end();
    }
}

function dibujarEncabezadoSolicitudPDF(doc, solicitud) {
    const anchoPagina =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right;

    const x = doc.page.margins.left;

    doc
        .roundedRect(x, 38, anchoPagina, 92, 8)
        .fill('#111827');

    doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(18)
        .text(
            'REPORTE DE SOLICITUD',
            x + 20,
            58,
            {
                width: anchoPagina - 40,
                align: 'center'
            }
        );

    doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#d1d5db')
        .text(
            'Sistema de Gestión de Espacios y Eventos',
            x + 20,
            85,
            {
                width: anchoPagina - 40,
                align: 'center'
            }
        );

    doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#ffffff')
        .text(
            solicitud.codigo || `Solicitud #${solicitud.id}`,
            x + 20,
            105,
            {
                width: anchoPagina - 40,
                align: 'center'
            }
        );

    doc.y = 150;
}

function dibujarTituloSeccionPDF(doc, titulo) {
    verificarEspacioSolicitudPDF(doc, 55);

    const x = doc.page.margins.left;
    const ancho =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right;

    doc
        .roundedRect(x, doc.y, ancho, 28, 4)
        .fill('#e5e7eb');

    doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
            titulo,
            x + 10,
            doc.y + 9,
            {
                width: ancho - 20
            }
        );

    doc.y += 38;
}

function dibujarTablaDatosPDF(doc, datos) {
    const x = doc.page.margins.left;
    const ancho =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right;

    const separacion = 10;
    const anchoColumna = (ancho - separacion) / 2;

    for (let i = 0; i < datos.length; i += 2) {
        verificarEspacioSolicitudPDF(doc, 58);

        const izquierda = datos[i];
        const derecha = datos[i + 1];

        const y = doc.y;

        dibujarCampoPDF(
            doc,
            x,
            y,
            anchoColumna,
            izquierda.etiqueta,
            izquierda.valor
        );

        if (derecha) {
            dibujarCampoPDF(
                doc,
                x + anchoColumna + separacion,
                y,
                anchoColumna,
                derecha.etiqueta,
                derecha.valor
            );
        }

        doc.y = y + 52;
    }

    doc.moveDown(0.3);
}

function dibujarCampoPDF(
    doc,
    x,
    y,
    ancho,
    etiqueta,
    valor
) {
    doc
        .roundedRect(x, y, ancho, 44, 5)
        .lineWidth(0.7)
        .fillAndStroke(
            '#ffffff',
            '#d1d5db'
        );

    doc
        .fillColor('#6b7280')
        .font('Helvetica')
        .fontSize(8)
        .text(
            etiqueta,
            x + 9,
            y + 8,
            {
                width: ancho - 18
            }
        );

    doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(
            valor === null ||
            valor === undefined ||
            valor === ''
                ? '-'
                : String(valor),
            x + 9,
            y + 23,
            {
                width: ancho - 18,
                ellipsis: true
            }
        );
}

function dibujarTablaFechasPDF(doc, filas) {
    const x = doc.page.margins.left;
    const ancho =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right;

    const columnas = [
        {
            titulo: 'Etapa',
            ancho: ancho * 0.2
        },
        {
            titulo: 'Inicio',
            ancho: ancho * 0.4
        },
        {
            titulo: 'Fin',
            ancho: ancho * 0.4
        }
    ];

    const altoFila = 34;

    verificarEspacioSolicitudPDF(
        doc,
        altoFila * (filas.length + 1) + 10
    );

    let y = doc.y;
    let posicionX = x;

    columnas.forEach((columna) => {
        doc
            .rect(
                posicionX,
                y,
                columna.ancho,
                altoFila
            )
            .fillAndStroke(
                '#111827',
                '#111827'
            );

        doc
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(8)
            .text(
                columna.titulo,
                posicionX + 7,
                y + 12,
                {
                    width: columna.ancho - 14
                }
            );

        posicionX += columna.ancho;
    });

    y += altoFila;

    filas.forEach((fila, index) => {
        posicionX = x;

        const valores = [
            fila.etapa,
            formatearFechaHoraPDF(fila.inicio),
            formatearFechaHoraPDF(fila.fin)
        ];

        columnas.forEach((columna, columnaIndex) => {
            const fondo =
                index % 2 === 0
                    ? '#ffffff'
                    : '#f9fafb';

            doc
                .rect(
                    posicionX,
                    y,
                    columna.ancho,
                    altoFila
                )
                .fillAndStroke(
                    fondo,
                    '#d1d5db'
                );

            doc
                .fillColor('#111827')
                .font(
                    columnaIndex === 0
                        ? 'Helvetica-Bold'
                        : 'Helvetica'
                )
                .fontSize(8)
                .text(
                    valores[columnaIndex],
                    posicionX + 7,
                    y + 11,
                    {
                        width:
                            columna.ancho - 14
                    }
                );

            posicionX += columna.ancho;
        });

        y += altoFila;
    });

    doc.y = y + 10;
}

function dibujarBloqueTextoPDF(
    doc,
    etiqueta,
    valor
) {
    verificarEspacioSolicitudPDF(doc, 70);

    const texto = valor?.trim() || '-';

    const x = doc.page.margins.left;
    const ancho =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right;

    const alturaTexto = doc
        .font('Helvetica')
        .fontSize(9)
        .heightOfString(texto, {
            width: ancho - 20
        });

    const altura = Math.max(
        58,
        alturaTexto + 34
    );

    verificarEspacioSolicitudPDF(
        doc,
        altura + 10
    );

    const y = doc.y;

    doc
        .roundedRect(
            x,
            y,
            ancho,
            altura,
            5
        )
        .fillAndStroke(
            '#ffffff',
            '#d1d5db'
        );

    doc
        .fillColor('#6b7280')
        .font('Helvetica')
        .fontSize(8)
        .text(
            etiqueta,
            x + 10,
            y + 9
        );

    doc
        .fillColor('#111827')
        .font('Helvetica')
        .fontSize(9)
        .text(
            texto,
            x + 10,
            y + 25,
            {
                width: ancho - 20,
                lineGap: 2
            }
        );

    doc.y = y + altura + 10;
}

function dibujarFirmasSolicitudPDF(doc) {
    verificarEspacioSolicitudPDF(doc, 130);

    doc.moveDown(1.5);

    const x = doc.page.margins.left;
    const ancho =
        doc.page.width -
        doc.page.margins.left -
        doc.page.margins.right;

    const anchoFirma = 190;
    const separacion =
        ancho - anchoFirma * 2;

    const y = doc.y + 45;

    doc
        .moveTo(x, y)
        .lineTo(x + anchoFirma, y)
        .strokeColor('#374151')
        .stroke();

    doc
        .moveTo(
            x + anchoFirma + separacion,
            y
        )
        .lineTo(
            x + anchoFirma * 2 + separacion,
            y
        )
        .strokeColor('#374151')
        .stroke();

    doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(
            'Firma del solicitante',
            x,
            y + 8,
            {
                width: anchoFirma,
                align: 'center'
            }
        );

    doc
        .text(
            'Firma del responsable',
            x + anchoFirma + separacion,
            y + 8,
            {
                width: anchoFirma,
                align: 'center'
            }
        );

    doc.y = y + 45;
}

function agregarPiePaginasSolicitudPDF(
    doc,
    codigo
) {
    const paginas = doc.bufferedPageRange();

    for (
        let i = paginas.start;
        i < paginas.start + paginas.count;
        i += 1
    ) {
        doc.switchToPage(i);

        const ancho =
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right;

        const y = doc.page.height - 35;

        doc
            .moveTo(
                doc.page.margins.left,
                y - 8
            )
            .lineTo(
                doc.page.width -
                doc.page.margins.right,
                y - 8
            )
            .strokeColor('#d1d5db')
            .stroke();

        doc
            .fillColor('#6b7280')
            .font('Helvetica')
            .fontSize(7)
            .text(
                `Solicitud ${codigo || '-'}`,
                doc.page.margins.left,
                y,
                {
                    width: ancho / 2,
                    align: 'left'
                }
            );

        doc.text(
            `Página ${i + 1} de ${paginas.count}`,
            doc.page.margins.left +
                ancho / 2,
            y,
            {
                width: ancho / 2,
                align: 'right'
            }
        );
    }
}

function verificarEspacioSolicitudPDF(
    doc,
    espacioNecesario
) {
    const limite =
        doc.page.height -
        doc.page.margins.bottom -
        45;

    if (
        doc.y + espacioNecesario >
        limite
    ) {
        doc.addPage();
        doc.y = doc.page.margins.top;
    }
}

function formatearFechaHoraPDF(fecha) {
    if (!fecha) return '-';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat(
        'es-PA',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/Panama'
        }
    ).format(valor);
}

function formatearMontoPDF(valor) {
    return Number(valor || 0).toLocaleString(
        'en-US',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}

function formatearEstadoSolicitud(estado) {
    const estados = {
        PENDIENTE: 'Pendiente',
        APROBADA: 'Aprobada',
        RECHAZADA: 'Rechazada',
        CANCELADA: 'Cancelada'
    };

    return estados[estado] || estado || '-';
}

module.exports = {
    listarSolicitudes,
    obtenerSolicitud,
    crearSolicitud,
    actualizarSolicitud,
    eliminarSolicitud,
    aprobarSolicitud,
    rechazarSolicitud,
    actualizarEstadoSolicitud,
    verificarDisponibilidad,
    calcularCosto,
    calendarioSolicitudes,
    descargarCalendarioPDF,
    descargarSolicitudPDF
};
