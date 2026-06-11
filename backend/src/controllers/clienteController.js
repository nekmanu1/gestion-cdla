const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');

async function listarClientes(req, res) {
    try {
        const { buscar, activo, tipoCliente } = req.query;

        const where = {};

        if (buscar) {
            where.OR = [
                {
                    nombre: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                },
                {
                    cedulaRuc: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                },
                {
                    correo: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        if (activo !== undefined) {
            where.activo = activo === 'true';
        }

        if (tipoCliente) {
            where.tipoCliente = {
                contains: tipoCliente,
                mode: 'insensitive'
            };
        }

        const clientes = await prisma.cliente.findMany({
            where,
            orderBy: {
                id: 'asc'
            }
        });

        res.json(clientes);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al listar clientes'
        });
    }
}

async function obtenerCliente(req, res) {
    try {
        const { id } = req.params;

        const cliente = await prisma.cliente.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!cliente) {
            return res.status(404).json({
                message: 'Cliente no encontrado'
            });
        }

        res.json(cliente);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener cliente'
        });
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
            observaciones
        } = req.body;

        if (!nombre) {
            return res.status(400).json({
                message: 'El nombre del cliente es obligatorio'
            });
        }

        if (cedulaRuc) {
            const existe = await prisma.cliente.findUnique({
                where: {
                    cedulaRuc
                }
            });

            if (existe) {
                return res.status(409).json({
                    message: 'Ya existe un cliente con esa cédula o RUC'
                });
            }
        }

        const cliente = await prisma.cliente.create({
            data: {
                nombre,
                cedulaRuc,
                telefono,
                correo,
                direccion,
                tipoCliente,
                observaciones
            }
        });

        await registrarAuditoria({
    usuarioId: req.usuario.id,
    accion: 'CREAR',
    modulo: 'CLIENTES',
    detalle: `Cliente creado: ${cliente.nombre}`
});

        res.status(201).json({
            message: 'Cliente creado correctamente',
            cliente
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al crear cliente'
        });
    }
}

async function actualizarCliente(req, res) {
    try {
        const { id } = req.params;

        const {
            nombre,
            cedulaRuc,
            telefono,
            correo,
            direccion,
            tipoCliente,
            observaciones,
            activo
        } = req.body;

        const clienteExiste = await prisma.cliente.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!clienteExiste) {
            return res.status(404).json({
                message: 'Cliente no encontrado'
            });
        }

        const data = {};

        if (nombre !== undefined) data.nombre = nombre;
        if (cedulaRuc !== undefined) data.cedulaRuc = cedulaRuc;
        if (telefono !== undefined) data.telefono = telefono;
        if (correo !== undefined) data.correo = correo;
        if (direccion !== undefined) data.direccion = direccion;
        if (tipoCliente !== undefined) data.tipoCliente = tipoCliente;
        if (observaciones !== undefined) data.observaciones = observaciones;
        if (activo !== undefined) data.activo = activo;

        const cliente = await prisma.cliente.update({
            where: {
                id: Number(id)
            },
            data
        });

        res.json({
            message: 'Cliente actualizado correctamente',
            cliente
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al actualizar cliente'
        });
    }
}

async function eliminarCliente(req, res) {
    try {
        const { id } = req.params;

        const clienteExiste = await prisma.cliente.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!clienteExiste) {
            return res.status(404).json({
                message: 'Cliente no encontrado'
            });
        }

        await prisma.cliente.update({
            where: {
                id: Number(id)
            },
            data: {
                activo: false
            }
        });

        res.json({
            message: 'Cliente desactivado correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al desactivar cliente'
        });
    }
}

module.exports = {
    listarClientes,
    obtenerCliente,
    crearCliente,
    actualizarCliente,
    eliminarCliente
};