import { useEffect, useState } from 'react';

import {
    BarChart,
    Bar,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

import {
    BanknotesIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    DocumentCheckIcon,
    ExclamationTriangleIcon,
    PresentationChartLineIcon,
    ReceiptPercentIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

import api from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';

export default function Dashboard() {
    const usuario = obtenerUsuario();
    const esAdmin = usuario?.rol === 'ADMIN';

    const [resumen, setResumen] =
        useState(null);

    const [operativo, setOperativo] =
        useState(null);

    const [finanzas, setFinanzas] =
        useState(null);

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState('');

    useEffect(() => {
        cargarDashboard();
    }, []);

    async function cargarDashboard() {
        try {
            setCargando(true);
            setError('');

            const consultas = [
                api.get('/dashboard'),
                api.get('/dashboard/operativo')
            ];

            if (esAdmin) {
                consultas.push(
                    api.get('/dashboard/facturacion')
                );
            }

            const respuestas =
                await Promise.all(consultas);

            setResumen(respuestas[0].data);
            setOperativo(respuestas[1].data);

            if (esAdmin) {
                setFinanzas(respuestas[2].data);
            } else {
                setFinanzas(null);
            }
        } catch (errorPeticion) {
            console.error(errorPeticion);

            setError(
                errorPeticion.response?.data?.message ||
                'Error al cargar el dashboard'
            );
        } finally {
            setCargando(false);
        }
    }

    if (cargando) {
        return (
            <p className="text-gray-500">
                Cargando dashboard...
            </p>
        );
    }

    if (error) {
        return (
            <Card className="p-6">
                <p className="text-red-700">
                    {error}
                </p>
            </Card>
        );
    }

    return (
        <div>
            <PageHeader
                title="Dashboard"
                subtitle={
                    esAdmin
                        ? 'Resumen administrativo, operativo y financiero'
                        : 'Resumen operativo y estadísticas generales'
                }
            />

            {/* KPIs GENERALES */}
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi
                    title="Clientes activos"
                    value={resumen.totalClientes}
                    icon={UserGroupIcon}
                    description="Clientes habilitados"
                />

                <Kpi
                    title="Espacios"
                    value={resumen.totalEspacios}
                    icon={BuildingOffice2Icon}
                    description={`${resumen.espaciosDisponibles} disponibles`}
                />

                <Kpi
                    title="Solicitudes pendientes"
                    value={
                        resumen.solicitudesPendientes
                    }
                    icon={ClockIcon}
                    description="Requieren revisión"
                />

                <Kpi
                    title="Reservas activas"
                    value={resumen.reservasActivas}
                    icon={CalendarDaysIcon}
                    description={`${resumen.eventosHoy} evento(s) hoy`}
                />
            </div>

            {/* ESTADOS DE SOLICITUDES */}
            <Card className="mb-6 p-5">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <DocumentCheckIcon className="h-5 w-5 text-gray-700" />
                    </div>

                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Estado de solicitudes
                        </h2>

                        <p className="text-sm text-gray-500">
                            Distribución general del flujo de solicitudes
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <EstadoResumen
                        label="Pendientes"
                        value={
                            resumen.solicitudesPendientes
                        }
                    />

                    <EstadoResumen
                        label="Aprobadas"
                        value={
                            resumen.solicitudesAprobadas
                        }
                    />

                    <EstadoResumen
                        label="Rechazadas"
                        value={
                            resumen.solicitudesRechazadas
                        }
                    />

                    <EstadoResumen
                        label="Canceladas"
                        value={
                            resumen.solicitudesCanceladas
                        }
                    />
                </div>
            </Card>

            {/* ESTADÍSTICAS OPERATIVAS */}
            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <GraficaCard
                    title="Reservas por mes"
                    description="Comportamiento mensual de las reservas"
                >
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <LineChart
                            data={
                                operativo.reservasPorMes
                            }
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />

                            <Line
                                type="monotone"
                                dataKey="cantidad"
                                stroke="#111827"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </GraficaCard>

                <GraficaCard
                    title="Espacios más utilizados"
                    description="Cantidad de reservas por espacio"
                >
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <BarChart
                            data={
                                operativo
                                    .espaciosMasUtilizados
                            }
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="espacio"
                                interval={0}
                                angle={-15}
                                textAnchor="end"
                                height={70}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip />

                            <Bar
                                dataKey="cantidad"
                                fill="#111827"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </GraficaCard>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card className="p-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Tipos de evento
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Clasificación de solicitudes registradas
                    </p>

                    <div className="mt-5 space-y-3">
                        {operativo.tiposEvento
                            .slice(0, 8)
                            .map((item) => (
                                <Info
                                    key={item.tipo}
                                    label={item.tipo}
                                    value={item.cantidad}
                                />
                            ))}
                    </div>
                </Card>

                <Card className="p-5">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Resumen operativo
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Indicadores sin información financiera
                    </p>

                    <div className="mt-5 space-y-3">
                        <Info
                            label="Asistencia estimada"
                            value={formatearNumero(
                                operativo
                                    .totalAsistentesEstimados
                            )}
                        />

                        {operativo.modalidades
                            .slice(0, 6)
                            .map((item) => (
                                <Info
                                    key={
                                        item.modalidad
                                    }
                                    label={
                                        item.modalidad
                                    }
                                    value={
                                        item.cantidad
                                    }
                                />
                            ))}
                    </div>
                </Card>
            </div>

            {/* SOLO ADMINISTRADOR */}
            {esAdmin && finanzas && (
                <SeccionFinanciera
                    finanzas={finanzas}
                    totalUsuarios={
                        resumen.totalUsuarios
                    }
                />
            )}
        </div>
    );
}

function SeccionFinanciera({
    finanzas,
    totalUsuarios
}) {
    const datos = finanzas.resumen;

    return (
        <section className="mt-8 border-t border-gray-200 pt-8">
            <div className="mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                        <BanknotesIcon className="h-6 w-6" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Información administrativa y financiera
                        </h2>

                        <p className="text-sm text-gray-500">
                            Visible únicamente para administradores
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Kpi
                    title="Total facturado"
                    value={formatearMoneda(
                        datos.totalFacturado
                    )}
                    icon={CurrencyDollarIcon}
                    description="Facturas no anuladas"
                />

                <Kpi
                    title="Total cobrado"
                    value={formatearMoneda(
                        datos.totalPagado
                    )}
                    icon={CheckCircleIcon}
                    description={`${datos.porcentajeCobrado}% cobrado`}
                />

                <Kpi
                    title="Cuentas pendientes"
                    value={formatearMoneda(
                        datos.totalPendiente
                    )}
                    icon={ExclamationTriangleIcon}
                    description={`${datos.facturasPendientes} factura(s)`}
                />

                <Kpi
                    title="Valor no cobrado"
                    value={formatearMoneda(
                        datos.valorNoCobrado
                    )}
                    icon={ReceiptPercentIcon}
                    description={`${datos.eventosNoCobrados} evento(s) por convenio, acuerdo o gratuidad`}
                />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Card className="p-5 xl:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Facturación por mes
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Ingresos facturados sin incluir facturas anuladas
                    </p>

                    <div className="mt-5 h-72">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <LineChart
                                data={
                                    finanzas
                                        .facturacionPorMes
                                }
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="mes" />
                                <YAxis />
                                <Tooltip
                                    formatter={(valor) =>
                                        formatearMoneda(
                                            valor
                                        )
                                    }
                                />

                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#111827"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Resumen financiero
                    </h3>

                    <div className="mt-5 space-y-3">
                        <Info
                            label="Valor total gestionado"
                            value={formatearMoneda(
                                datos.valorGestionado
                            )}
                        />

                        <Info
                            label="Facturas pagadas"
                            value={
                                datos.facturasPagadas
                            }
                        />

                        <Info
                            label="Facturas pendientes"
                            value={
                                datos.facturasPendientes
                            }
                        />

                        <Info
                            label="Facturas anuladas"
                            value={
                                datos.facturasAnuladas
                            }
                        />

                        <Info
                            label="Monto anulado"
                            value={formatearMoneda(
                                datos.totalAnulado
                            )}
                        />

                        <Info
                            label="Usuarios del sistema"
                            value={totalUsuarios}
                        />
                    </div>
                </Card>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <GraficaCard
                    title="Valor no cobrado por mes"
                    description="Valor comercial de eventos cubiertos por convenios, acuerdos o gratuidad"
                >
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <BarChart
                            data={
                                finanzas
                                    .noCobradoPorMes
                            }
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip
                                formatter={(valor) =>
                                    formatearMoneda(
                                        valor
                                    )
                                }
                            />

                            <Bar
                                dataKey="total"
                                fill="#111827"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </GraficaCard>

                <Card className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Convenios y eventos no cobrados
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        Desglose por modalidad
                    </p>

                    <div className="mt-5 space-y-4">
                        {finanzas
                            .modalidadesNoCobradas
                            .map((item) => (
                                <div
                                    key={
                                        item.modalidad
                                    }
                                    className="rounded-xl border border-gray-200 p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {
                                                    item.modalidad
                                                }
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {
                                                    item.cantidad
                                                }{' '}
                                                evento(s)
                                            </p>
                                        </div>

                                        <strong className="text-gray-900">
                                            {formatearMoneda(
                                                item.total
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            ))}
                    </div>
                </Card>
            </div>
        </section>
    );
}

function GraficaCard({
    title,
    description,
    children
}) {
    return (
        <Card className="p-5">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    {description}
                </p>
            </div>

            <div className="h-72">
                {children}
            </div>
        </Card>
    );
}

function Kpi({
    title,
    value,
    icon: Icon,
    description
}) {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                        {value}
                    </h2>

                    {description && (
                        <p className="mt-2 text-xs text-gray-400">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </Card>
    );
}

function EstadoResumen({ label, value }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
                {label}
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
                {value}
            </p>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <span className="text-sm text-gray-500">
                {label}
            </span>

            <strong className="text-right text-sm text-gray-900">
                {value}
            </strong>
        </div>
    );
}

function obtenerUsuario() {
    try {
        return JSON.parse(
            localStorage.getItem('usuario')
        );
    } catch {
        return null;
    }
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat(
        'es-PA',
        {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }
    ).format(Number(valor || 0));
}

function formatearNumero(valor) {
    return Number(valor || 0).toLocaleString(
        'es-PA'
    );
}