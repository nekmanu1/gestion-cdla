const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');

const {
    buscarClientePorNombreSimilar
} = require('../lib/clienteNombre');

function convertirId(valor) {
    const id = Number(valor);

    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error('ID de cliente inválido');
        error.statusCode = 400;
        throw error;
    }

    return id;
}

function limpiarTexto(valor) {
    if (valor === undefined) return undefined;
    if (valor === null) return null;

    const texto = String(valor).trim();

    return texto || null;
}

function responderError(res, error, mensajeGeneral) {
    console.error(error);

    const status = error.statusCode || 500;

    return res.status(status).json({
        message: status === 500
            ? mensajeGeneral
            : error.message
    });
}

async function listarClientes(req, res) {
    try {
        const {
            buscar,
            activo,
            tipoCliente
        } = req.query;

        const where = {};

        if (buscar?.trim()) {
            const texto = buscar.trim();

            where.OR = [
                {
                    nombre: {
                        contains: texto,
                        mode: 'insensitive'
                    }
                },
                {
                    contactoResponsable: {
                        contains: texto,
                        mode: 'insensitive'
                    }
                },
                {
                    cedulaRuc: {
                        contains: texto,
                        mode: 'insensitive'
                    }
                },
                {
                    correo: {
                        contains: texto,
                        mode: 'insensitive'
                    }
                },
                {
                    telefono: {
                        contains: texto,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        if (activo !== undefined) {
            where.activo = activo === 'true';
        }

        if (tipoCliente?.trim()) {
            where.tipoCliente = {
                contains: tipoCliente.trim(),
                mode: 'insensitive'
            };
        }

        const clientes = await prisma.cliente.findMany({
            where,
            orderBy: [
                {
                    activo: 'desc'
                },
                {
                    nombre: 'asc'
                }
            ]
        });

        return res.json(clientes);
    } catch (error) {
        return responderError(
            res,
            error,
            'Error al listar clientes'
        );
    }
}

async function obtenerCliente(req, res) {
    try {
        const id = convertirId(req.params.id);

        const cliente = await prisma.cliente.findUnique({
            where: {
                id
            }
        });

        if (!cliente) {
            return res.status(404).json({
                message: 'Cliente no encontrado'
            });
        }

        return res.json(cliente);
    } catch (error) {
        return responderError(
            res,
            error,
            'Error al obtener cliente'
        );
    }
}

async function crearCliente(req, res) {
    try {
        const {
            nombre,
            cedulaRuc,
            telefono,
            correo,
            direccion,
            tipoCliente,
            contactoResponsable,
            observaciones
        } = req.body;

        const nombreLimpio = limpiarTexto(nombre);

        if (!nombreLimpio) {
            return res.status(400).json({
                message: 'El nombre del cliente es obligatorio'
            });
        }

        const coincidencia = await buscarClientePorNombreSimilar(
            prisma,
            nombreLimpio
        );

        if (coincidencia) {
            return res.status(409).json({
                message:
                    coincidencia.tipo === 'EXACTO'
                        ? `Ya existe un cliente llamado "${coincidencia.cliente.nombre}".`
                        : `Existe un cliente con un nombre muy parecido: "${coincidencia.cliente.nombre}".`,
                clienteExistente: coincidencia.cliente,
                similitud: coincidencia.similitud
            });
        }

        const cliente = await prisma.cliente.create({
            data: {
                nombre: nombreLimpio,
                cedulaRuc: limpiarTexto(cedulaRuc),
                telefono: limpiarTexto(telefono),
                correo: limpiarTexto(correo),
                direccion: limpiarTexto(direccion),
                tipoCliente: limpiarTexto(tipoCliente),
                contactoResponsable:
                    limpiarTexto(contactoResponsable),
                observaciones: limpiarTexto(observaciones),
                activo: true
            }
        });

        await registrarAuditoria({
            usuarioId: req.usuario.id,
            accion: 'CREAR',
            modulo: 'CLIENTES',
            detalle: `Cliente creado: ${cliente.nombre}`
        });

        return res.status(201).json({
            message: 'Cliente creado correctamente',
            cliente
        });
    } catch (error) {
        return responderError(
            res,
            error,
            'Error al crear cliente'
        );
    }
}

async function actualizarCliente(req, res) {
    try {
        const id = convertirId(req.params.id);

        const {
            nombre,
            cedulaRuc,
            telefono,
            correo,
            direccion,
            tipoCliente,
            contactoResponsable,
            observaciones,
            activo
        } = req.body;

        const clienteExiste = await prisma.cliente.findUnique({
            where: {
                id
            }
        });

        if (!clienteExiste) {
            return res.status(404).json({
                message: 'Cliente no encontrado'
            });
        }

        if (nombre !== undefined) {
            const nombreLimpio = limpiarTexto(nombre);

            if (!nombreLimpio) {
                return res.status(400).json({
                    message: 'El nombre del cliente es obligatorio'
                });
            }

            const coincidencia =
                await buscarClientePorNombreSimilar(
                    prisma,
                    nombreLimpio,
                    id
                );

            if (coincidencia) {
                return res.status(409).json({
                    message:
                        coincidencia.tipo === 'EXACTO'
                            ? `Ya existe otro cliente llamado "${coincidencia.cliente.nombre}".`
                            : `Existe otro cliente con un nombre muy parecido: "${coincidencia.cliente.nombre}".`,
                    clienteExistente: coincidencia.cliente,
                    similitud: coincidencia.similitud
                });
            }
        }

        const data = {};

        if (nombre !== undefined) {
            data.nombre = limpiarTexto(nombre);
        }

        if (cedulaRuc !== undefined) {
            data.cedulaRuc = limpiarTexto(cedulaRuc);
        }

        if (telefono !== undefined) {
            data.telefono = limpiarTexto(telefono);
        }

        if (correo !== undefined) {
            data.correo = limpiarTexto(correo);
        }

        if (direccion !== undefined) {
            data.direccion = limpiarTexto(direccion);
        }

        if (tipoCliente !== undefined) {
            data.tipoCliente = limpiarTexto(tipoCliente);
        }

        if (contactoResponsable !== undefined) {
            data.contactoResponsable =
                limpiarTexto(contactoResponsable);
        }

        if (observaciones !== undefined) {
            data.observaciones = limpiarTexto(observaciones);
        }

        if (activo !== undefined) {
            data.activo = Boolean(activo);
        }

        const cliente = await prisma.cliente.update({
            where: {
                id
            },
            data
        });

        await registrarAuditoria({
            usuarioId: req.usuario.id,
            accion: 'ACTUALIZAR',
            modulo: 'CLIENTES',
            detalle: `Cliente actualizado: ${cliente.nombre}`
        });

        return res.json({
            message: 'Cliente actualizado correctamente',
            cliente
        });
    } catch (error) {
        return responderError(
            res,
            error,
            'Error al actualizar cliente'
        );
    }
}

async function eliminarCliente(req, res) {
    try {
        const id = convertirId(req.params.id);

        const cliente = await prisma.cliente.findUnique({
            where: {
                id
            }
        });

        if (!cliente) {
            return res.status(404).json({
                message: 'Cliente no encontrado'
            });
        }

        /*
         * No se eliminan clientes vinculados a solicitudes,
         * porque se perdería la integridad del historial.
         */
        const solicitudesRelacionadas =
            await prisma.solicitud.count({
                where: {
                    clienteId: id
                }
            });

        if (solicitudesRelacionadas > 0) {
            return res.status(409).json({
                message:
                    `No se puede eliminar "${cliente.nombre}" porque tiene ` +
                    `${solicitudesRelacionadas} solicitud(es) relacionada(s). ` +
                    'Puedes marcarlo como inactivo desde el formulario de edición.'
            });
        }

        await prisma.cliente.delete({
            where: {
                id
            }
        });

        await registrarAuditoria({
            usuarioId: req.usuario.id,
            accion: 'ELIMINAR',
            modulo: 'CLIENTES',
            detalle: `Cliente eliminado: ${cliente.nombre}`
        });

        return res.json({
            message: 'Cliente eliminado correctamente'
        });
    } catch (error) {
        /*
         * P2003 corresponde a una restricción de llave foránea.
         */
        if (error.code === 'P2003') {
            return res.status(409).json({
                message:
                    'No se puede eliminar el cliente porque tiene registros relacionados.'
            });
        }

        return responderError(
            res,
            error,
            'Error al eliminar cliente'
        );
    }
}

module.exports = {
    listarClientes,
    obtenerCliente,
    crearCliente,
    actualizarCliente,
    eliminarCliente
};