import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import {
    PencilSquareIcon,
    UserMinusIcon
} from '@heroicons/react/24/outline';

import Table, { Th, Td } from '../components/ui/Table';

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [buscar, setBuscar] = useState('');

    

    const [clienteEditando, setClienteEditando] = useState(null);

    const [formEditar, setFormEditar] = useState({
        nombre: '',
        cedulaRuc: '',
        telefono: '',
        correo: '',
        direccion: '',
        tipoCliente: '',
        observaciones: '',
        activo: true
    });

    useEffect(() => {
        cargarClientes();
    }, []);

    async function cargarClientes() {
        try {
            const response = await api.get('/clientes');
            setClientes(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar clientes');
        }
    }

    async function buscarClientes() {
        try {
            const response = await api.get(
                buscar ? `/clientes?buscar=${buscar}` : '/clientes'
            );

            setClientes(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al buscar clientes');
        }
    }

    function abrirEditarCliente(cliente) {
        setClienteEditando(cliente);

        setFormEditar({
            nombre: cliente.nombre || '',
            cedulaRuc: cliente.cedulaRuc || '',
            telefono: cliente.telefono || '',
            correo: cliente.correo || '',
            direccion: cliente.direccion || '',
            tipoCliente: cliente.tipoCliente || '',
            observaciones: cliente.observaciones || '',
            activo: cliente.activo ?? true
        });
    }

    function cambiarEditar(e) {
        const { name, value, type, checked } = e.target;

        setFormEditar({
            ...formEditar,
            [name]: type === 'checkbox' ? checked : value
        });
    }

    async function guardarEdicionCliente(e) {
        e.preventDefault();

        try {
            await api.put(`/clientes/${clienteEditando.id}`, formEditar);

            toast.success('Cliente actualizado correctamente');
            setClienteEditando(null);
            cargarClientes();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al actualizar cliente');
        }
    }

    async function desactivarCliente(id) {
        if (!confirm('¿Deseas desactivar este cliente?')) return;

        try {
            await api.delete(`/clientes/${id}`);
            toast.success('Cliente desactivado correctamente');
            cargarClientes();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al desactivar cliente');
        }
    }

    return (
        <div>
            <PageHeader
                title="Clientes"
                subtitle="Consulta y edición de clientes registrados desde solicitudes"
            />

            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-3">
                    <Input
                        placeholder="Buscar cliente, RUC o correo"
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                    />

                    <Button onClick={buscarClientes}>
                        Buscar
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setBuscar('');
                            cargarClientes();
                        }}
                    >
                        Ver todos
                    </Button>
                </div>
            </Card>

            <Table>
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <Th>ID</Th>
                        <Th>Nombre</Th>
                        <Th>Cédula/RUC</Th>
                        <Th>Correo</Th>
                        <Th>Teléfono</Th>
                        <Th>Activo</Th>
                        <Th>Acciones</Th>
                    </tr>
                </thead>

                <tbody>
                    {clientes.map((cliente) => (
                        <tr
                            key={cliente.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                        >
                            <Td>{cliente.id}</Td>

                            <Td className="font-medium text-gray-900">
                                {cliente.nombre}
                            </Td>

                            <Td>{cliente.cedulaRuc || '-'}</Td>
                            <Td>{cliente.correo || '-'}</Td>
                            <Td>{cliente.telefono || '-'}</Td>

                            <Td>
                                <EstadoCliente activo={cliente.activo} />
                            </Td>

                            <Td>
                                <div className="flex gap-2">
                                    <button
        title="Editar cliente"
        onClick={() => editarCliente(cliente)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-amber-50 transition"
    >
        <PencilSquareIcon className="w-5 h-5" />
    </button>

                                    {cliente.activo && (
                                           <button
        title="Desactivar cliente"
        onClick={() => desactivarCliente(cliente.id)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
    >
        <UserMinusIcon className="w-5 h-5" />
    </button>
                                    )}
                                </div>
                            </Td>
                        </tr>
                    ))}

                    {clientes.length === 0 && (
                        <tr>
                            <td
                                colSpan="7"
                                className="px-4 py-8 text-center text-gray-500"
                            >
                                No hay clientes registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {clienteEditando && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Editar cliente
                                </h2>

                                <p className="text-sm text-gray-500">
                                    {clienteEditando.nombre}
                                </p>
                            </div>

                            <button
                                onClick={() => setClienteEditando(null)}
                                className="text-gray-500 hover:text-gray-900 text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={guardarEdicionCliente} className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    name="nombre"
                                    placeholder="Nombre"
                                    value={formEditar.nombre}
                                    onChange={cambiarEditar}
                                    required
                                />

                                <Input
                                    name="cedulaRuc"
                                    placeholder="Cédula / RUC"
                                    value={formEditar.cedulaRuc}
                                    onChange={cambiarEditar}
                                />

                                <Input
                                    name="telefono"
                                    placeholder="Teléfono"
                                    value={formEditar.telefono}
                                    onChange={cambiarEditar}
                                />

                                <Input
                                    name="correo"
                                    type="email"
                                    placeholder="Correo"
                                    value={formEditar.correo}
                                    onChange={cambiarEditar}
                                />

                                <Input
                                    name="direccion"
                                    placeholder="Dirección"
                                    value={formEditar.direccion}
                                    onChange={cambiarEditar}
                                />

                                <Input
                                    name="tipoCliente"
                                    placeholder="Tipo de cliente"
                                    value={formEditar.tipoCliente}
                                    onChange={cambiarEditar}
                                />

                                <div className="md:col-span-2">
                                    <Textarea
                                        name="observaciones"
                                        placeholder="Observaciones"
                                        value={formEditar.observaciones}
                                        onChange={cambiarEditar}
                                    />
                                </div>

                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        name="activo"
                                        checked={formEditar.activo}
                                        onChange={cambiarEditar}
                                    />
                                    Cliente activo
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setClienteEditando(null)}
                                >
                                    Cancelar
                                </Button>

                                <Button type="submit">
                                    Guardar cambios
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function EstadoCliente({ activo }) {
    return (
        <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
            }`}
        >
            {activo ? 'Activo' : 'Inactivo'}
        </span>
    );
}