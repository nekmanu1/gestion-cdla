import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';

import api from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

export default function Dashboard() {
    const [resumen, setResumen] = useState(null);
    const [avanzado, setAvanzado] = useState(null);
    const [facturacion, setFacturacion] = useState(null);

    useEffect(() => {
        cargarDashboard();
    }, []);

    async function cargarDashboard() {
        try {
            const [resResumen, resAvanzado, resFacturacion] = await Promise.all([
                api.get('/dashboard'),
                api.get('/dashboard/avanzado'),
                api.get('/dashboard/facturacion')
            ]);

            setResumen(resResumen.data);
            setAvanzado(resAvanzado.data);
            setFacturacion(resFacturacion.data);
        } catch (error) {
            console.error(error);
        }
    }

    if (!resumen || !avanzado || !facturacion) {
        return <p className="text-gray-500">Cargando dashboard...</p>;
    }

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle="Resumen general, estadísticas y facturación"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <Kpi title="Clientes" value={resumen.totalClientes} />
                <Kpi title="Espacios" value={resumen.totalEspacios} />
                <Kpi title="Pendientes" value={resumen.solicitudesPendientes} />
                <Kpi title="Reservas activas" value={resumen.reservasActivas} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <Card className="p-5 xl:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">
                        Reservas por mes
                    </h2>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={avanzado.reservasPorMes}>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis dataKey="mes" />
                             <YAxis />
                             <Tooltip />

                             <Line
                               type="monotone"
                               dataKey="cantidad"
                               stroke="#111827"
                               strokeWidth={3}
                               dot={{ r: 5 }}
                               activeDot={{ r: 8 }}
                             />
                         </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-5">
                    <h2 className="text-lg font-semibold mb-4">
                        Resumen facturación
                    </h2>

                    <div className="space-y-4">
                        <Info label="Total facturado" value={`$${facturacion.totalFacturado.toFixed(2)}`} />
                        <Info label="Total pagado" value={`$${facturacion.totalPagado.toFixed(2)}`} />
                        <Info label="Pendiente" value={`$${facturacion.totalPendiente.toFixed(2)}`} />
                        <Info label="Facturas pagadas" value={facturacion.facturasPagadas} />
                        <Info label="Facturas pendientes" value={facturacion.facturasPendientes} />
                        <Info label="Facturas anuladas" value={facturacion.facturasAnuladas} />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <Card className="p-5">
                    <h2 className="text-lg font-semibold mb-4">
                        Facturación por mes
                    </h2>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={avanzado.facturacionPorMes}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                       <Tooltip />

                      <Line
                         type="monotone"
                        dataKey="total"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 8 }}
                     />
                    </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-5">
                    <h2 className="text-lg font-semibold mb-4">
                        Espacios más utilizados
                    </h2>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={avanzado.espaciosMasUtilizados}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="espacio" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="cantidad" fill="#16a34a" barSize={28}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <Card className="p-5">
                <h2 className="text-lg font-semibold mb-4">
                    Clientes frecuentes
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {avanzado.clientesFrecuentes.map((cliente) => (
                        <div
                            key={cliente.cliente}
                            className="border border-gray-200 rounded-lg p-4"
                        >
                            <p className="font-medium text-gray-900">
                                {cliente.cliente}
                            </p>
                            <p className="text-sm text-gray-500">
                                {cliente.cantidad} reservas
                            </p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

function Kpi({ title, value }) {
    return (
        <Card className="p-5">
            <p className="text-sm text-gray-500">
                {title}
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-2">
                {value}
            </h2>
        </Card>
    );
}

function Info({ label, value }) {
    return (
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-sm text-gray-500">{label}</span>
            <strong className="text-gray-900">{value}</strong>
        </div>
    );
}