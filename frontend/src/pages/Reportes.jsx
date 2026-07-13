import { useState } from 'react';
import toast from 'react-hot-toast';

import {
    ArrowDownTrayIcon,
    CalendarDaysIcon,
    ChartBarSquareIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    DocumentChartBarIcon
} from '@heroicons/react/24/outline';

import api from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';

const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
];

export default function Reportes() {
    const anioActual = new Date().getFullYear();

    const [tipo, setTipo] = useState('facturas');
    const [mes, setMes] = useState('');
    const [anio, setAnio] = useState(String(anioActual));
    const [estado, setEstado] = useState('');
    const [generando, setGenerando] = useState(false);

    async function generarReporte() {
        try {
            setGenerando(true);

            let url = `/reportes/${tipo}`;
            const params = new URLSearchParams();

            if (mes) params.append('mes', mes);
            if (anio) params.append('anio', anio);
            if (estado) params.append('estado', estado);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await api.get(url, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: 'application/pdf'
            });

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = blobUrl;
            link.download = `reporte-${tipo}-${mes || 'todos'}-${anio}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(blobUrl);

            toast.success('Reporte generado correctamente');
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.message ||
                'Error al generar reporte'
            );
        } finally {
            setGenerando(false);
        }
    }

    function limpiarFiltros() {
        setTipo('facturas');
        setMes('');
        setAnio(String(anioActual));
        setEstado('');
    }

    return (
        <div>
            <PageHeader
                title="Reportes"
                subtitle="Generación de reportes institucionales por mes, año y estado"
            />

            <Card className="overflow-hidden max-w-6xl">
                {/* Encabezado de la tarjeta */}
                <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
                            <DocumentChartBarIcon className="h-6 w-6" />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Generar reporte
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Seleccione el tipo de reporte y los filtros que desea aplicar.
                            </p>
                        </div>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
                        <ChartBarSquareIcon className="h-4 w-4" />
                        Formato PDF
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-6">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <CampoReporte
                            icono={ClipboardDocumentListIcon}
                            etiqueta="Tipo de reporte"
                        >
                            <Select
                                value={tipo}
                                onChange={(e) => {
                                    setTipo(e.target.value);
                                    setEstado('');
                                }}
                                className="w-full"
                            >
                                <option value="facturas">Facturas</option>
                                <option value="solicitudes">Solicitudes</option>
                                <option value="reservas">Reservas</option>
                            </Select>
                        </CampoReporte>

                        <CampoReporte
                            icono={CalendarDaysIcon}
                            etiqueta="Mes"
                        >
                            <Select
                                value={mes}
                                onChange={(e) => setMes(e.target.value)}
                                className="w-full"
                            >
                                <option value="">Todos los meses</option>

                                {meses.map((item) => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </Select>
                        </CampoReporte>

                        <CampoReporte
                            icono={CalendarDaysIcon}
                            etiqueta="Año"
                        >
                            <Select
                                value={anio}
                                onChange={(e) => setAnio(e.target.value)}
                                className="w-full"
                            >
                                {Array.from({ length: 6 }).map((_, index) => {
                                    const year = anioActual - 2 + index;

                                    return (
                                        <option
                                            key={year}
                                            value={year}
                                        >
                                            {year}
                                        </option>
                                    );
                                })}
                            </Select>
                        </CampoReporte>

                        <CampoReporte
                            icono={CheckCircleIcon}
                            etiqueta="Estado"
                        >
                            <Select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full"
                            >
                                <option value="">Todos los estados</option>

                                {tipo === 'facturas' && (
                                    <>
                                        <option value="PENDIENTE">
                                            Pendiente
                                        </option>
                                        <option value="PAGADA">
                                            Pagada
                                        </option>
                                        <option value="ANULADA">
                                            Anulada
                                        </option>
                                    </>
                                )}

                                {tipo === 'solicitudes' && (
                                    <>
                                        <option value="PENDIENTE">
                                            Pendiente
                                        </option>
                                        <option value="APROBADA">
                                            Aprobada
                                        </option>
                                        <option value="RECHAZADA">
                                            Rechazada
                                        </option>
                                        <option value="CANCELADA">
                                            Cancelada
                                        </option>
                                    </>
                                )}

                                {tipo === 'reservas' && (
                                    <>
                                        <option value="ACTIVA">
                                            Activa
                                        </option>
                                        <option value="FINALIZADA">
                                            Finalizada
                                        </option>
                                        <option value="CANCELADA">
                                            Cancelada
                                        </option>
                                    </>
                                )}
                            </Select>
                        </CampoReporte>
                    </div>

                    {/* Resumen de selección */}
                    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Reporte seleccionado
                                </p>

                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {obtenerNombreTipo(tipo)}
                                    {' · '}
                                    {obtenerNombreMes(mes)}
                                    {' · '}
                                    {anio}
                                    {' · '}
                                    {obtenerNombreEstado(estado)}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={limpiarFiltros}
                                    disabled={generando}
                                    className="justify-center"
                                >
                                    Limpiar
                                </Button>

                                <Button
                                    type="button"
                                    onClick={generarReporte}
                                    disabled={generando}
                                    className="justify-center gap-2 px-6"
                                >
                                    

                                    {generando
                                        ? 'Generando...'
                                        : 'Generar PDF'}

                                       
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function CampoReporte({
    icono: Icono,
    etiqueta,
    children
}) {
    return (
        <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <Icono className="h-4 w-4" />
                </span>

                {etiqueta}
            </label>

            {children}
        </div>
    );
}

function obtenerNombreTipo(tipo) {
    const nombres = {
        facturas: 'Facturas',
        solicitudes: 'Solicitudes',
        reservas: 'Reservas'
    };

    return nombres[tipo] || tipo;
}

function obtenerNombreMes(mes) {
    if (!mes) {
        return 'Todos los meses';
    }

    return meses.find(
        (item) => item.value === mes
    )?.label || mes;
}

function obtenerNombreEstado(estado) {
    if (!estado) {
        return 'Todos los estados';
    }

    const nombres = {
        PENDIENTE: 'Pendiente',
        PAGADA: 'Pagada',
        ANULADA: 'Anulada',
        APROBADA: 'Aprobada',
        RECHAZADA: 'Rechazada',
        CANCELADA: 'Cancelada',
        ACTIVA: 'Activa',
        FINALIZADA: 'Finalizada'
    };

    return nombres[estado] || estado;
}