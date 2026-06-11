import { useEffect, useState } from 'react';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import toast from 'react-hot-toast';
import {
    PencilSquareIcon,
    UserMinusIcon
} from '@heroicons/react/24/outline';

import Table, {
    Th,
    Td
} from '../components/ui/Table';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [editandoId, setEditandoId] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const [form, setForm] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'OPERADOR',
        activo: true
    });

    useEffect(() => {
        cargarUsuarios();
    }, []);

    async function cargarUsuarios() {
    try {
        const response = await api.get('/usuarios');
        setUsuarios(response.data);
    } catch (error) {
        console.error(error);
        toast.error('Error al cargar usuarios');
    }
    }

    function cambiar(e) {
        const { name, value, type, checked } = e.target;

        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value
        });
    }

    function limpiarFormulario() {
        setEditandoId(null);
        setForm({
            nombre: '',
            email: '',
            password: '',
            rol: 'OPERADOR',
            activo: true
        });
    }

    async function guardarUsuario(e) {
    e.preventDefault();

    try {
        const data = { ...form };

        if (editandoId && !data.password) {
            delete data.password;
        }

        if (editandoId) {
            await api.put(`/usuarios/${editandoId}`, data);
            toast.success('Usuario actualizado correctamente');
        } else {
            await api.post('/usuarios', data);
            toast.success('Usuario creado correctamente');
        }

        limpiarFormulario();
        cargarUsuarios();
        setMostrarFormulario(false);
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al guardar usuario');
    }
    }

    function editarUsuario(usuario) {
        setEditandoId(usuario.id);

        setForm({
            nombre: usuario.nombre || '',
            email: usuario.email || '',
            password: '',
            rol: usuario.rol || 'OPERADOR',
            activo: usuario.activo
        });

        setMostrarFormulario(true);
    }

    async function desactivarUsuario(id) {
    if (!confirm('¿Deseas desactivar este usuario?')) return;

    try {
        await api.delete(`/usuarios/${id}`);
        toast.success('Usuario desactivado correctamente');
        cargarUsuarios();
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al desactivar usuario');
    }
   }

    return (
        <div>
            <PageHeader
                title="Usuarios"
                subtitle="Administración de usuarios y roles del sistema"
            />
            <div className="mb-4 flex justify-end">
    <Button
        onClick={() => setMostrarFormulario(!mostrarFormulario)}
    >
        {mostrarFormulario ? 'Ocultar formulario' : 'Nuevo usuario'}
    </Button>
</div>

{mostrarFormulario && (

            <Card className="p-5 mb-6">
                <form onSubmit={guardarUsuario}>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {editandoId ? 'Editar usuario' : 'Nuevo usuario'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <Input
                            name="nombre"
                            placeholder="Nombre"
                            value={form.nombre}
                            onChange={cambiar}
                            required
                        />

                        <Input
                            name="email"
                            type="email"
                            placeholder="Correo"
                            value={form.email}
                            onChange={cambiar}
                            required
                        />

                        <Input
                            name="password"
                            type="password"
                            placeholder={editandoId ? 'Nueva contraseña opcional' : 'Contraseña'}
                            value={form.password}
                            onChange={cambiar}
                            required={!editandoId}
                        />

                        <Select
                            name="rol"
                            value={form.rol}
                            onChange={cambiar}
                        >
                            <option value="ADMIN">Administrador</option>
                            <option value="OPERADOR">Operador</option>
                            <option value="CONSULTOR">Consultor</option>
                        </Select>

                        {editandoId && (
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={cambiar}
                                />
                                Usuario activo
                            </label>
                        )}
                    </div>

                    <div className="flex gap-3 mt-5">
                        <Button type="submit">
                            {editandoId ? 'Actualizar' : 'Guardar'}
                        </Button>

                        {editandoId && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={limpiarFormulario}
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                </form>
            </Card>
)}

            <Table>
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <Th>ID</Th>
                        <Th>Nombre</Th>
                        <Th>Correo</Th>
                        <Th>Rol</Th>
                        <Th>Activo</Th>
                        <Th>Acciones</Th>
                    </tr>
                </thead>

                <tbody>
                    {usuarios.map((usuario) => (
                        <tr
                            key={usuario.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                        >
                            <Td>{usuario.id}</Td>

                            <Td className="font-medium text-gray-900">
                                {usuario.nombre}
                            </Td>

                            <Td>{usuario.email}</Td>

                            <Td>
                                <RolBadge rol={usuario.rol} />
                            </Td>

                            <Td>
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        usuario.activo
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {usuario.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </Td>

                            <Td>
                                <div className="flex gap-2">
                                    <Button
                                        variant="info"
                                        onClick={() => editarUsuario(usuario)}
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </Button>

                                    {usuario.activo && (
                                        <Button
                                            variant="danger"
                                            onClick={() => desactivarUsuario(usuario.id)}
                                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                                        >
                                         <UserMinusIcon className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>
                            </Td>
                        </tr>
                    ))}

                    {usuarios.length === 0 && (
                        <tr>
                            <td
                                colSpan="6"
                                className="px-4 py-8 text-center text-gray-500"
                            >
                                No hay usuarios registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
}

function RolBadge({ rol }) {
    const clases = {
        ADMIN: 'bg-purple-100 text-purple-800',
        OPERADOR: 'bg-blue-100 text-blue-800',
        CONSULTOR: 'bg-gray-100 text-gray-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${clases[rol] || 'bg-gray-100 text-gray-700'}`}>
            {rol}
        </span>
    );
}