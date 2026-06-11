import { useEffect, useState } from 'react';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import {
    DocumentArrowDownIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import Table, {
    Th,
    Td
} from '../components/ui/Table';

export default function Reservas() {
    const [reservas, setReservas] = useState([]);

    useEffect(() => {
        cargarReservas();
    }, []);

    async function cargarReservas() {
    try {
        const response = await api.get('/reservas');
        setReservas(response.data);
    } catch (error) {
        console.error(error);
        toast.error('Error al cargar reservas');
    }
    }

    async function cancelarReserva(id) {
    if (!confirm('¿Deseas cancelar esta reserva?')) return;

    try {
        await api.put(`/reservas/${id}/cancelar`);
        toast.success('Reserva cancelada correctamente');
        cargarReservas();
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al cancelar reserva');
    }
    }

    async function descargarReporteReserva(id) {
    try {
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
            'Error al descargar reserva'
        );
    }
}

    return (
        <div>
            <PageHeader
                title="Reservas"
                subtitle="Listado de reservas generadas por solicitudes aprobadas"
            />

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
                    {reservas.map((reserva) => (
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
                                {new Date(reserva.fechaInicio).toLocaleString()}
                            </Td>

                            <Td>
                                {new Date(reserva.fechaFin).toLocaleString()}
                            </Td>

                            <Td>
                                <EstadoBadge estado={reserva.estado} />
                            </Td>

                            <Td className="text-center">
    <div className="flex items-center justify-center gap-2">

        <button
            type="button"
            title="Descargar PDF"
            onClick={() => descargarReporteReserva(reserva.id)}
            className="inline-flex items-center justify-center
                       w-9 h-9 rounded-lg
                       border border-gray-200
                       text-gray-600
                       hover:bg-green-50
                       hover:text-green-700
                       hover:border-green-200
                       transition"
        >
            <DocumentArrowDownIcon className="w-5 h-5" />
        </button>

        {reserva.estado === 'ACTIVA' ? (
            <button
                type="button"
                title="Cancelar reserva"
                onClick={() => cancelarReserva(reserva.id)}
                className="inline-flex items-center justify-center
                           w-9 h-9 rounded-lg
                           border border-red-200
                           text-red-700
                           hover:bg-red-50
                           hover:border-red-300
                           transition"
            >
                <XCircleIcon className="w-5 h-5" />
            </button>
        ) : (
            <span className="text-xs text-gray-400">
                —
            </span>
        )}

    </div>
</Td>
                        </tr>
                    ))}

                    {reservas.length === 0 && (
                        <tr>
                            <td
                                colSpan="8"
                                className="px-4 py-8 text-center text-gray-500"
                            >
                                No hay reservas registradas
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

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${clases[estado] || 'bg-gray-100 text-gray-700'}`}>
            {estado}
        </span>
    );
}