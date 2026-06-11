const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');

async function listarEspacios(req, res) {
    try {
        const { buscar, estado, tipo } = req.query;

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
                    ubicacion: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                },
                {
                    descripcion: {
                        contains: buscar,
                        mode: 'insensitive'
                    }
                }
            ];
        }

        if (estado) {
            where.estado = estado;
        }

        if (tipo) {
            where.tipo = {
                contains: tipo,
                mode: 'insensitive'
            };
        }

        const espacios = await prisma.espacio.findMany({
            where,
            orderBy: {
                id: 'asc'
            }
        });

        res.json(espacios);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al listar espacios'
        });
    }
}

async function obtenerEspacio(req, res) {
    try {
        const { id } = req.params;

        const imagen =
    req.files?.imagen?.[0];

const plano =
    req.files?.plano?.[0];

        const espacio = await prisma.espacio.findUnique({
            where: { id: Number(id) }
        });

        if (!espacio) {
            return res.status(404).json({ message: 'Espacio no encontrado' });
        }

        res.json(espacio);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener espacio' });
    }
}

async function crearEspacio(req, res) {
    try {
        const {
            nombre,
            tipo,
            categoria,
            capacidad,
            ubicacion,
            estado,
            descripcion,
            precioMontaje,
            precioEvento,
            precioDesmontaje,
            precioCerrado,
            limitePoliza,
            textoPoliza,
            especificaciones
        } = req.body;

        if (!nombre) {
            return res.status(400).json({
                message: 'El nombre del espacio es obligatorio'
            });
        }

        const estadosPermitidos = ['DISPONIBLE', 'MANTENIMIENTO', 'INACTIVO'];

        if (estado && !estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                message: 'Estado no válido'
            });
        }

        const imagen = req.files?.imagen?.[0];
        const plano = req.files?.plano?.[0];

        const espacio = await prisma.espacio.create({
            data: {
                nombre,
                tipo,
                categoria: categoria || 'SALONES',
                capacidad: capacidad ? Number(capacidad) : null,
                ubicacion: ubicacion || null,
                estado: estado || 'DISPONIBLE',
                descripcion: descripcion || null,

                precioMontaje: precioMontaje ? Number(precioMontaje) : 0,
                precioEvento: precioEvento ? Number(precioEvento) : 0,
                precioDesmontaje: precioDesmontaje ? Number(precioDesmontaje) : 0,
                precioCerrado: precioCerrado ? Number(precioCerrado) : 0,

                limitePoliza: limitePoliza ? Number(limitePoliza) : 0,
                textoPoliza: textoPoliza || null,
                especificaciones: especificaciones || null,

                imagenArchivo: imagen
                    ? `/uploads/espacios/imagenes/${imagen.filename}`
                    : null,

                planoArchivo: plano
                    ? `/uploads/espacios/planos/${plano.filename}`
                    : null
            }
        });

        await registrarAuditoria({
            usuarioId: req.usuario.id,
            accion: 'CREAR',
            modulo: 'ESPACIOS',
            detalle: `Espacio creado: ${espacio.nombre}`
        });

        res.status(201).json({
            message: 'Espacio creado correctamente',
            espacio
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al crear espacio'
        });
    }
}
async function actualizarEspacio(req, res) {
    try {
        const { id } = req.params;

        const {
            nombre,
            tipo,
            categoria,
            capacidad,
            ubicacion,
            estado,
            descripcion,
            precioMontaje,
            precioEvento,
            precioDesmontaje,
            precioCerrado,
            limitePoliza,
            textoPoliza,
            especificaciones
        } = req.body;

        const espacioExiste = await prisma.espacio.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!espacioExiste) {
            return res.status(404).json({
                message: 'Espacio no encontrado'
            });
        }

        const imagen = req.files?.imagen?.[0];
        const plano = req.files?.plano?.[0];

        const data = {};

        if (nombre !== undefined) data.nombre = nombre;
        if (tipo !== undefined) data.tipo = tipo;
        if (categoria !== undefined) data.categoria = categoria;
        if (capacidad !== undefined) data.capacidad = capacidad ? Number(capacidad) : null;
        if (ubicacion !== undefined) data.ubicacion = ubicacion;
        if (estado !== undefined) data.estado = estado;
        if (descripcion !== undefined) data.descripcion = descripcion;

        if (precioMontaje !== undefined) data.precioMontaje = Number(precioMontaje || 0);
        if (precioEvento !== undefined) data.precioEvento = Number(precioEvento || 0);
        if (precioDesmontaje !== undefined) data.precioDesmontaje = Number(precioDesmontaje || 0);
        if (precioCerrado !== undefined) data.precioCerrado = Number(precioCerrado || 0);

        if (limitePoliza !== undefined) data.limitePoliza = Number(limitePoliza || 0);
        if (textoPoliza !== undefined) data.textoPoliza = textoPoliza;
        if (especificaciones !== undefined) data.especificaciones = especificaciones;

        if (imagen) {
            data.imagenArchivo = `/uploads/espacios/imagenes/${imagen.filename}`;
        }

        if (plano) {
            data.planoArchivo = `/uploads/espacios/planos/${plano.filename}`;
        }

        const espacio = await prisma.espacio.update({
            where: {
                id: Number(id)
            },
            data
        });

        res.json({
            message: 'Espacio actualizado correctamente',
            espacio
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al actualizar espacio'
        });
    }
}

async function eliminarEspacio(req, res) {
    try {
        const { id } = req.params;

        const espacioExiste = await prisma.espacio.findUnique({
            where: { id: Number(id) }
        });

        if (!espacioExiste) {
            return res.status(404).json({
                message: 'Espacio no encontrado'
            });
        }

        await prisma.espacio.delete({
            where: { id: Number(id) }
        });

        res.json({
            message: 'Espacio eliminado correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al eliminar espacio'
        });
    }
}

module.exports = {
    listarEspacios,
    obtenerEspacio,
    crearEspacio,
    actualizarEspacio,
    eliminarEspacio
};