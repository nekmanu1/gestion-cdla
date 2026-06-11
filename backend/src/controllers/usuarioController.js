const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const registrarAuditoria = require('../lib/auditoria');

async function listarUsuarios(req, res) {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true,
                creadoEn: true,
                actualizadoEn: true
            },
            orderBy: {
                id: 'asc'
            }
        });

        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al listar usuarios' });
    }
}

async function obtenerUsuario(req, res) {
    try {
        const { id } = req.params;

        const usuario = await prisma.usuario.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true,
                creadoEn: true,
                actualizadoEn: true
            }
        });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
}

async function crearUsuario(req, res) {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password || !rol) {
            return res.status(400).json({
                message: 'Nombre, correo, contraseña y rol son obligatorios'
            });
        }

        const rolesPermitidos = ['ADMIN', 'OPERADOR', 'CONSULTOR'];

        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                message: 'Rol no válido'
            });
        }

        const existe = await prisma.usuario.findUnique({
            where: { email }
        });

        if (existe) {
            return res.status(409).json({
                message: 'Ya existe un usuario con ese correo'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const usuario = await prisma.usuario.create({
            
            data: {
                nombre,
                email,
                password: passwordHash,
                rol
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true,
                creadoEn: true
            }
        });

        await registrarAuditoria({
    usuarioId: req.usuario.id,
    accion: 'CREAR',
    modulo: 'USUARIOS',
    detalle: `Usuario creado: ${usuario.nombre}`
});

        res.status(201).json({
            message: 'Usuario creado correctamente',
            usuario
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
}

async function actualizarUsuario(req, res) {
    try {
        const { id } = req.params;
        const { nombre, email, password, rol, activo } = req.body;

        const usuarioExiste = await prisma.usuario.findUnique({
            where: { id: Number(id) }
        });

        if (!usuarioExiste) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        const data = {};

        if (nombre !== undefined) data.nombre = nombre;
        if (email !== undefined) data.email = email;
        if (rol !== undefined) data.rol = rol;
        if (activo !== undefined) data.activo = activo;

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const usuario = await prisma.usuario.update({
            where: { id: Number(id) },
            data,
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true,
                actualizadoEn: true
            }
        });

        res.json({
            message: 'Usuario actualizado correctamente',
            usuario
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al actualizar usuario'
        });
    }
}

async function eliminarUsuario(req, res) {
    try {
        const { id } = req.params;

        const usuarioExiste = await prisma.usuario.findUnique({
            where: { id: Number(id) }
        });

        if (!usuarioExiste) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        await prisma.usuario.update({
            where: { id: Number(id) },
            data: {
                activo: false
            }
        });

        res.json({
            message: 'Usuario desactivado correctamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al desactivar usuario'
        });
    }
}

module.exports = {
    listarUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
};