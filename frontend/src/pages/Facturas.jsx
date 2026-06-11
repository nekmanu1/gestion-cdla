import { useEffect, useState } from 'react';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import toast from 'react-hot-toast';
import {
    DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

import Table, {
    Th,
    Td
} from '../components/ui/Table';

export default function Facturas() {
    const [facturas, setFacturas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [clienteFiltro, setClienteFiltro] = useState('');
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
    const [fechaFinFiltro, setFechaFinFiltro] = useState('');

    const [form, setForm] = useState({
        clienteId: '',
        reservaId: '',
        concepto: '',
        monto: '',
        observaciones: ''
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
    try {
        const [resFacturas, resClientes, resReservas] = await Promise.all([
            api.get('/facturas'),
            api.get('/clientes?activo=true'),
            api.get('/reservas')
        ]);

        setFacturas(resFacturas.data);
        setClientes(resClientes.data);
        setReservas(resReservas.data);
    } catch (error) {
        console.error(error);
        toast.error('Error al cargar facturación');
    }
    }

    function cambiar(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    function limpiarFormulario() {
        setForm({
            clienteId: '',
            reservaId: '',
            concepto: '',
            monto: '',
            observaciones: ''
        });
    }

    async function guardarFactura(e) {
    e.preventDefault();

    try {
        await api.post('/facturas', {
            ...form,
            clienteId: form.clienteId ? Number(form.clienteId) : null,
            reservaId: form.reservaId ? Number(form.reservaId) : null,
            monto: Number(form.monto)
        });

        toast.success('Factura creada correctamente');
        limpiarFormulario();
        cargarDatos();
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al guardar factura');
    }
    }

    async function cambiarEstadoFactura(id, estado) {
    try {
        await api.put(`/facturas/${id}`, { estado });

        toast.success('Estado de factura actualizado');
        cargarDatos();
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al actualizar estado');
    }
}

   async function filtrarFacturas() {
    try {
        const params = new URLSearchParams();

        if (estadoFiltro) params.append('estado', estadoFiltro);
        if (clienteFiltro) params.append('clienteId', clienteFiltro);
        if (fechaInicioFiltro) params.append('fechaInicio', fechaInicioFiltro);
        if (fechaFinFiltro) params.append('fechaFin', fechaFinFiltro);

        const url = params.toString()
            ? `/facturas?${params.toString()}`
            : '/facturas';

        const response = await api.get(url);
        setFacturas(response.data);
    } catch (error) {
        console.error(error);
        toast.error('Error al filtrar facturas');
    }
}

    async function pagarFactura(id) {
    if (!confirm('¿Deseas marcar esta factura como pagada?')) return;

    try {
        await api.put(`/facturas/${id}/pagar`);
        toast.success('Factura marcada como pagada');
        cargarDatos();
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al pagar factura');
    }
    }

    async function anularFactura(id) {
    if (!confirm('¿Deseas anular esta factura?')) return;

    try {
        await api.put(`/facturas/${id}/anular`);
        toast.success('Factura anulada correctamente');
        cargarDatos();
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al anular factura');
    }
    }

    async function descargarReporteFactura(id) {
    try {
        const response = await api.get(`/reportes/facturas/${id}`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', `factura-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        toast.error('Error al descargar factura');
    }
}

    return (
        <div>
            <PageHeader
                title="Facturación"
                subtitle="Gestión de facturas, pagos y anulaciones"
            />


            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-3">
                    <Select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="PAGADA">Pagada</option>
                        <option value="ANULADA">Anulada</option>
                    </Select>

                    <Select
    value={clienteFiltro}
    onChange={(e) => setClienteFiltro(e.target.value)}
>
    <option value="">Todos los clientes</option>
    {clientes.map((cliente) => (
        <option key={cliente.id} value={cliente.id}>
            {cliente.nombre}
        </option>
    ))}
</Select>

<Input
    type="date"
    value={fechaInicioFiltro}
    onChange={(e) => setFechaInicioFiltro(e.target.value)}
/>

<Input
    type="date"
    value={fechaFinFiltro}
    onChange={(e) => setFechaFinFiltro(e.target.value)}
/>

                    <Button onClick={filtrarFacturas}>
                        Filtrar
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                             setEstadoFiltro('');
    setClienteFiltro('');
    setFechaInicioFiltro('');
    setFechaFinFiltro('');
    cargarDatos();
                        }}
                    >
                        Ver todas
                    </Button>
                </div>
            </Card>

            <Table>
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <Th>Factura</Th>
                        <Th>Cliente</Th>
                        <Th>Concepto</Th>
                        <Th>Monto</Th>
                        <Th>Estado</Th>
                        <Th>Fecha</Th>
                        <Th>Acciones</Th>
                    </tr>
                </thead>

                <tbody>
                    {facturas.map((factura) => (
                        <tr
                            key={factura.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                        >
                            <Td className="font-medium text-gray-900">
                                {factura.numero}
                            </Td>

                            <Td>{factura.cliente?.nombre || '-'}</Td>
                            <Td>{factura.concepto}</Td>
                            <Td className="text-right">B/. {formatearMonto(factura.monto)}</Td>

                            <Td>
                                <EstadoBadge estado={factura.estado} />
                            </Td>

                            <Td>
                                {new Date(factura.fechaEmision).toLocaleDateString()}
                            </Td>
<Td>
    <div className="flex items-center gap-2">
        <Select
            value={factura.estado}
            onChange={(e) => cambiarEstadoFactura(factura.id, e.target.value)}
            className="min-w-[130px]"
        >
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada</option>
            <option value="ANULADA">Anulada</option>
        </Select>

        <button
            type="button"
            title="Descargar PDF"
            onClick={() => descargarReporteFactura(factura.id)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition"
        >
            <DocumentArrowDownIcon className="w-5 h-5" />
        </button>
    </div>
</Td>
                        </tr>
                    ))}

                    {facturas.length === 0 && (
                        <tr>
                            <td
                                colSpan="7"
                                className="px-4 py-8 text-center text-gray-500"
                            >
                                No hay facturas registradas
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
}

function EstadoBadge({ estado }) {
    const clases = {
        PENDIENTE: 'bg-yellow-100 text-yellow-800',
        PAGADA: 'bg-green-100 text-green-800',
        ANULADA: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${clases[estado] || 'bg-gray-100 text-gray-700'}`}>
            {estado}
        </span>
    );
}

function formatearMonto(valor) {
    return Number(valor || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}