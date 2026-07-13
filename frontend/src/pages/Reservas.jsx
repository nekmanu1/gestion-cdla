import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

import {
    DocumentArrowDownIcon,
    XCircleIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

import Table, {
    Th,
    Td
} from '../components/ui/Table';

export default function Reservas() {
    const [reservas, setReservas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [espacios, setEspacios] = useState([]);

    const [cargando, setCargando] = useState(false);
    const [procesandoId, setProcesandoId] = useState(null);

    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [clienteFiltro, setClienteFiltro] = useState('');
    const [espacioFiltro, setEspacioFiltro] = useState('');
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
    const [fechaFinFiltro, setFechaFinFiltro] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos() {
        try {
            setCargando(true);

            const [
                respuestaReservas,
                respuestaClientes,
                respuestaEspacios
            ] = await Promise.all([
                api.get('/reservas'),
                api.get('/clientes?activo=true'),
                api.get('/espacios')
            ]);

            setReservas(respuestaReservas.data || []);
            setClientes(respuestaClientes.data || []);
            setEspacios(respuestaEspacios.data || []);
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message ||
                'Error al cargar reservas'
            );
        } finally {
            setCargando(false);
        }
    }

    async function filtrarReservas(e) {
        e?.preventDefault();

        try {
            setCargando(true);

            const params = new URLSearchParams();


            if (estadoFiltro) {
                params.append('estado', estadoFiltro);
            }

            if (clienteFiltro) {
                params.append('clienteId', clienteFiltro);
            }

            if (espacioFiltro) {
                params.append('espacioId', espacioFiltro);
            }

            if (fechaInicioFiltro) {
                params.append('fechaInicio', fechaInicioFiltro);
            }

            if (fechaFinFiltro) {
                params.append('fechaFin', fechaFinFiltro);
            }

            const query = params.toString();

            const response = await api.get(
                query
                    ? `/reservas?${query}`
                    : '/reservas'
            );

            setReservas(response.data || []);
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message ||
                'Error al filtrar reservas'
            );
        } finally {
            setCargando(false);
        }
    }

    async function limpiarFiltros() {
        setEstadoFiltro('');
        setClienteFiltro('');
        setEspacioFiltro('');
        setFechaInicioFiltro('');
        setFechaFinFiltro('');

        try {
            setCargando(true);

            const response = await api.get('/reservas');

            setReservas(response.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar reservas');
        } finally {
            setCargando(false);
        }
    }

    async function cancelarReserva(reserva) {
        const confirmar = window.confirm(
            `¿Deseas cancelar la reserva del evento "${reserva.solicitud?.nombreEvento || reserva.id}"?`
        );

        if (!confirmar) return;

        try {
            setProcesandoId(reserva.id);

            const response = await api.put(
                `/reservas/${reserva.id}/cancelar`
            );

            toast.success(
                response.data?.message ||
                'Reserva cancelada correctamente'
            );

            await filtrarReservas();
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message ||
                'Error al cancelar reserva'
            );
        } finally {
            setProcesandoId(null);
        }
    }

    async function descargarReporteReserva(id) {
        try {
            setProcesandoId(id);

            const response = await api.get(
                `/reportes/reservas/${id}`,
                {
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(
                new Blob([response.data])
            );

            const link = document.createElement('a');

            link.href = url;
            link.download = `reserva-${id}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message ||
                'Error al descargar reserva'
            );
        } finally {
            setProcesandoId(null);
        }
    }

    return (
        <div>
            <PageHeader
                title="Reservas"
                subtitle="Listado de reservas generadas por solicitudes aprobadas"
            />

        <Card className="p-4 mb-6">
    <form
        onSubmit={filtrarReservas}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3"
    >
        <Select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
        >
            <option value="">Todos los estados</option>
            <option value="ACTIVA">Activa</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="CANCELADA">Cancelada</option>
        </Select>

        <Select
            value={espacioFiltro}
            onChange={(e) => setEspacioFiltro(e.target.value)}
        >
            <option value="">Todos los espacios</option>

            {espacios.map((espacio) => (
                <option
                    key={espacio.id}
                    value={espacio.id}
                >
                    {espacio.nombre}
                </option>
            ))}
        </Select>

        <Select
            value={clienteFiltro}
            onChange={(e) => setClienteFiltro(e.target.value)}
        >
            <option value="">Todos los clientes</option>

            {clientes.map((cliente) => (
                <option
                    key={cliente.id}
                    value={cliente.id}
                >
                    {cliente.nombre}
                </option>
            ))}
        </Select>

        <Input
            type="date"
            aria-label="Fecha inicial"
            value={fechaInicioFiltro}
            onChange={(e) =>
                setFechaInicioFiltro(e.target.value)
            }
        />

        <Input
            type="date"
            aria-label="Fecha final"
            value={fechaFinFiltro}
            onChange={(e) =>
                setFechaFinFiltro(e.target.value)
            }
        />

        <div className="flex gap-2">
            <Button
                type="submit"
                disabled={cargando}
            >
                {cargando ? 'Buscando...' : 'Filtrar'}
            </Button>

            <Button
                type="button"
                variant="secondary"
                onClick={limpiarFiltros}
                disabled={cargando}
            >
                Limpiar
            </Button>
        </div>
    </form>
</Card>
            <Table>
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <Th>ID</Th>
                        <Th>Evento</Th>
                        <Th>Cliente</Th>
                        <Th>Espacio</Th>
                        <Th>Inicio</Th>
                        <Th>Fin</Th>
                        <Th>Estado</Th>
                        <Th>Acciones</Th>
                    </tr>
                </thead>

                <tbody>
                    {reservas.map((reserva) => {
                        const procesando =
                            procesandoId === reserva.id;

                        return (
                            <tr
                                key={reserva.id}
                                className="border-b border-gray-100 hover:bg-gray-50"
                            >
                                <Td>{reserva.id}</Td>

                                <Td className="font-medium text-gray-900">
                                    {reserva.solicitud?.nombreEvento || '-'}
                                </Td>

                                <Td>
                                    {reserva.solicitud?.cliente?.nombre || '-'}
                                </Td>

                                <Td>
                                    {reserva.espacio?.nombre || '-'}
                                </Td>

                                <Td>
                                    {formatearFechaHora(
                                        reserva.fechaInicio
                                    )}
                                </Td>

                                <Td>
                                    {formatearFechaHora(
                                        reserva.fechaFin
                                    )}
                                </Td>

                                <Td>
                                    <EstadoBadge
                                        estado={reserva.estado}
                                    />
                                </Td>

                                <Td className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            title="Descargar PDF"
                                            disabled={procesando}
                                            onClick={() =>
                                                descargarReporteReserva(
                                                    reserva.id
                                                )
                                            }
                                            className="
                                                inline-flex items-center justify-center
                                                w-9 h-9 rounded-lg
                                                border border-gray-200
                                                text-gray-600
                                                hover:bg-green-50
                                                hover:text-green-700
                                                hover:border-green-200
                                                transition
                                                disabled:opacity-50
                                                disabled:cursor-not-allowed
                                            "
                                        >
                                            <DocumentArrowDownIcon className="w-5 h-5" />
                                        </button>

                                        {reserva.estado === 'ACTIVA' && (
                                            <button
                                                type="button"
                                                title="Cancelar reserva"
                                                disabled={procesando}
                                                onClick={() =>
                                                    cancelarReserva(
                                                        reserva
                                                    )
                                                }
                                                className="
                                                    inline-flex items-center justify-center
                                                    w-9 h-9 rounded-lg
                                                    border border-red-200
                                                    text-red-700
                                                    hover:bg-red-50
                                                    hover:border-red-300
                                                    transition
                                                    disabled:opacity-50
                                                    disabled:cursor-not-allowed
                                                "
                                            >
                                                <XCircleIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </Td>
                            </tr>
                        );
                    })}

                    {!cargando && reservas.length === 0 && (
                        <tr>
                            <td
                                colSpan="8"
                                className="px-4 py-8 text-center text-gray-500"
                            >
                                No se encontraron reservas
                            </td>
                        </tr>
                    )}

                    {cargando && (
                        <tr>
                            <td
                                colSpan="8"
                                className="px-4 py-8 text-center text-gray-500"
                            >
                                Cargando reservas...
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
        ACTIVA: 'bg-green-100 text-green-800',
        FINALIZADA: 'bg-blue-100 text-blue-800',
        CANCELADA: 'bg-red-100 text-red-800'
    };

    const nombres = {
        ACTIVA: 'Activa',
        FINALIZADA: 'Finalizada',
        CANCELADA: 'Cancelada'
    };

    return (
        <span
            className={`
                inline-flex px-2 py-1 rounded-full
                text-xs font-semibold
                ${clases[estado] || 'bg-gray-100 text-gray-700'}
            `}
        >
            {nombres[estado] || estado || '-'}
        </span>
    );
}

function formatearFechaHora(fecha) {
    if (!fecha) return '-';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat('es-PA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Panama'
    }).format(valor);
}