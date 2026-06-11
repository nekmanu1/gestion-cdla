import { useState } from 'react';
import toast from 'react-hot-toast';

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

    async function generarReporte() {
        try {
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

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');

            link.href = blobUrl;
            link.download = `reporte-${tipo}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error(error);
            toast.error('Error al generar reporte');
        }
    }

    return (
        <div>
            <PageHeader
                title="Reportes"
                subtitle="Generación de reportes institucionales por mes, año y estado"
            />

            <Card className="p-5 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Select
                        value={tipo}
                        onChange={(e) => {
                            setTipo(e.target.value);
                            setEstado('');
                        }}
                    >
                        <option value="facturas">Facturas</option>
                        <option value="solicitudes">Solicitudes</option>
                    </Select>

                    <Select
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                    >
                        <option value="">Todos los meses</option>

                        {meses.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                    >
                        {Array.from({ length: 6 }).map((_, index) => {
                            const year = anioActual - 2 + index;

                            return (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            );
                        })}
                    </Select>

                    {(tipo === 'facturas' || tipo === 'solicitudes' || tipo === 'reservas') && (
                        <Select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>

                            {tipo === 'facturas' && (
                                <>
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="PAGADA">Pagada</option>
                                    <option value="ANULADA">Anulada</option>
                                </>
                            )}

                            {tipo === 'solicitudes' && (
                                <>
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="APROBADA">Aprobada</option>
                                    <option value="RECHAZADA">Rechazada</option>
                                    <option value="CANCELADA">Cancelada</option>
                                </>
                            )}

                            {tipo === 'reservas' && (
                                <>
                                    <option value="ACTIVA">Activa</option>
                                    <option value="FINALIZADA">Finalizada</option>
                                    <option value="CANCELADA">Cancelada</option>
                                </>
                            )}
                        </Select>
                    )}
                </div>

                <div className="mt-5">
                    <Button onClick={generarReporte}>
                        Generar PDF
                    </Button>
                </div>
            </Card>
        </div>
    );
}