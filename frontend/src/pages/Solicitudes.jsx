import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
    CheckIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    PencilSquareIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

import api from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Table, { Th, Td } from '../components/ui/Table';
import NuevaSolicitudModal from '../components/solicitudes/NuevaSolicitudModal';

export default function Solicitudes() {
    const [solicitudes, setSolicitudes] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [espacios, setEspacios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [procesandoId, setProcesandoId] = useState(null);

    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [solicitudEditando, setSolicitudEditando] = useState(null);

    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [espacioFiltro, setEspacioFiltro] = useState('');
    const [clienteFiltro, setClienteFiltro] = useState('');
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
    const [fechaFinFiltro, setFechaFinFiltro] = useState('');

    const usuario = obtenerUsuario();
    const puedeEditar = ['ADMIN', 'OPERADOR'].includes(usuario?.rol);

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos(params = null) {
        try {
            setCargando(true);

            const consultaSolicitudes = params
                ? api.get('/solicitudes', { params })
                : api.get('/solicitudes');

            const [resSolicitudes, resClientes, resEspacios] = await Promise.all([
                consultaSolicitudes,
                api.get('/clientes?activo=true'),
                // No limitar a DISPONIBLE: un espacio ocupado todavía debe verse
                // al consultar o editar solicitudes existentes.
                api.get('/espacios')
            ]);

            setSolicitudes(Array.isArray(resSolicitudes.data) ? resSolicitudes.data : []);
            setClientes(Array.isArray(resClientes.data) ? resClientes.data : []);
            setEspacios(Array.isArray(resEspacios.data) ? resEspacios.data : []);
        } catch (error) {
            console.error(error);
            toast.error(obtenerMensajeError(error, 'Error al cargar solicitudes'));
        } finally {
            setCargando(false);
        }
    }

    async function filtrarSolicitudes() {
        const params = {};

        if (estadoFiltro) params.estado = estadoFiltro;
        if (clienteFiltro) params.clienteId = clienteFiltro;
        if (espacioFiltro) params.espacioId = espacioFiltro;
        if (fechaInicioFiltro) params.fechaInicio = fechaInicioFiltro;
        if (fechaFinFiltro) params.fechaFin = fechaFinFiltro;

        await cargarDatos(params);
    }

    async function limpiarFiltros() {
        setEstadoFiltro('');
        setClienteFiltro('');
        setEspacioFiltro('');
        setFechaInicioFiltro('');
        setFechaFinFiltro('');
        await cargarDatos();
    }

    function abrirEdicion(solicitud) {
        setSolicitudEditando(solicitud);
    }

    function cerrarFormulario() {
        setSolicitudEditando(null);
    }

    async function alGuardarSolicitud() {
        cerrarFormulario();
        await cargarDatos();
    }

    async function aprobarSolicitud(id) {
        if (!window.confirm('¿Deseas aprobar esta solicitud? Se generará la reserva y la factura.')) {
            return;
        }

        try {
            setProcesandoId(id);
            const response = await api.put(`/solicitudes/${id}/aprobar`);
            toast.success(response.data?.message || 'Solicitud aprobada correctamente');
            await cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error(obtenerMensajeError(error, 'Error al aprobar la solicitud'));
        } finally {
            setProcesandoId(null);
        }
    }

    async function rechazarSolicitud(id) {
        if (!window.confirm('¿Deseas rechazar esta solicitud?')) {
            return;
        }

        try {
            setProcesandoId(id);
            const response = await api.put(`/solicitudes/${id}/rechazar`);
            toast.success(response.data?.message || 'Solicitud rechazada correctamente');
            await cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error(obtenerMensajeError(error, 'Error al rechazar la solicitud'));
        } finally {
            setProcesandoId(null);
        }
    }

    async function descargarReporteSolicitud(id) {
    try {
        setProcesandoId(id);

        const response = await api.get(
            `/reportes/solicitudes/${id}`,
            {
                responseType: 'blob'
            }
        );

        const contenido = new Blob(
            [response.data],
            {
                type: 'application/pdf'
            }
        );

        const url =
            window.URL.createObjectURL(contenido);

        const link =
            document.createElement('a');

        link.href = url;
        link.download = `solicitud-${id}.pdf`;

        document.body.appendChild(link);

        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

        toast.success(
            'PDF descargado correctamente'
        );
    } catch (error) {
        console.error(error);

        let mensaje =
            'Error al descargar la solicitud';

        if (
            error.response?.data instanceof Blob
        ) {
            try {
                const texto =
                    await error.response.data.text();

                const datos = JSON.parse(texto);

                mensaje =
                    datos.message || mensaje;
            } catch {
                // Mantiene el mensaje general.
            }
        } else {
            mensaje =
                error.response?.data?.message ||
                mensaje;
        }

        toast.error(mensaje);
    } finally {
        setProcesandoId(null);
    }
}


    return (
        <div>
            <PageHeader
                title="Solicitudes"
                subtitle="Registro, validación de disponibilidad y procesamiento de solicitudes"
            />

            <Card className="p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
                    <Select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                        <option value="">Todos los estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="APROBADA">Aprobada</option>
                        <option value="RECHAZADA">Rechazada</option>
                        <option value="CANCELADA">Cancelada</option>
                    </Select>

                    <Select value={espacioFiltro} onChange={(e) => setEspacioFiltro(e.target.value)}>
                        <option value="">Todos los espacios</option>
                        {espacios.map((espacio) => (
                            <option key={espacio.id} value={espacio.id}>
                                {espacio.nombre}
                            </option>
                        ))}
                    </Select>

                    <Select value={clienteFiltro} onChange={(e) => setClienteFiltro(e.target.value)}>
                        <option value="">Todos los clientes</option>
                        {clientes.map((cliente) => (
                            <option key={cliente.id} value={cliente.id}>
                                {cliente.nombre}
                            </option>
                        ))}
                    </Select>

                    <Input
                        type="date"
                        aria-label="Fecha inicial"
                        value={fechaInicioFiltro}
                        onChange={(e) => setFechaInicioFiltro(e.target.value)}
                    />

                    <Input
                        type="date"
                        aria-label="Fecha final"
                        value={fechaFinFiltro}
                        onChange={(e) => setFechaFinFiltro(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <Button onClick={filtrarSolicitudes}>Filtrar</Button>
                        <Button variant="secondary" onClick={limpiarFiltros}>Limpiar</Button>
                    </div>
                </div>
            </Card>

            <Table>
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <Th>Código</Th>
                        <Th>Evento</Th>
                        <Th>Cliente</Th>
                        <Th>Espacio</Th>
                        <Th>Inicio</Th>
                        <Th>Fin</Th>
                        <Th>Costo</Th>
                        <Th>Estado</Th>
                        <Th>Acciones</Th>
                    </tr>
                </thead>

                <tbody>
                    {cargando && (
                        <tr>
                            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                Cargando solicitudes...
                            </td>
                        </tr>
                    )}

                    {!cargando && solicitudes.map((solicitud) => (
                        <tr key={solicitud.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <Td>{solicitud.codigo}</Td>
                            <Td className="font-medium text-gray-900">{solicitud.nombreEvento}</Td>
                            <Td>{solicitud.cliente?.nombre || '-'}</Td>
                            <Td>{solicitud.espacio?.nombre || '-'}</Td>
                            <Td>{formatearFechaHora(solicitud.fechaInicioEvento)}</Td>
                            <Td>{formatearFechaHora(solicitud.fechaFinEvento)}</Td>
                            <Td className="text-right">B/. {formatearMonto(solicitud.costoEstimado)}</Td>
                            <Td>
                                {/* La tabla solo muestra el estado. El cambio se hace dentro del formulario de edición. */}
                                <EstadoBadge estado={solicitud.estado} />
                            </Td>
                            <Td>
                                <div className="flex items-center gap-2">
                                    <BotonAccion
                                        title="Ver detalle"
                                        onClick={() => setSolicitudSeleccionada(solicitud)}
                                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                    >
                                        <EyeIcon className="w-5 h-5" />
                                    </BotonAccion>
                                    <BotonAccion
    title="Descargar PDF"
    disabled={
        procesandoId === solicitud.id
    }
    onClick={() =>
        descargarReporteSolicitud(
            solicitud.id
        )
    }
    className="
        hover:bg-green-50
        hover:text-green-700
        hover:border-green-200
    "
>
    <DocumentArrowDownIcon className="w-5 h-5" />
</BotonAccion>

                                    {puedeEditar && (
                                        <BotonAccion
                                            title="Editar solicitud"
                                            onClick={() => abrirEdicion(solicitud)}
                                            className="hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200"
                                        >
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </BotonAccion>
                                        
                                    )}

                                    {puedeEditar && solicitud.estado === 'PENDIENTE' && (
                                        <>
                                            <BotonAccion
                                                title="Aprobar solicitud"
                                                disabled={procesandoId === solicitud.id}
                                                onClick={() => aprobarSolicitud(solicitud.id)}
                                                className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                                            >
                                                <CheckIcon className="w-5 h-5" />
                                            </BotonAccion>

                                            <BotonAccion
                                                title="Rechazar solicitud"
                                                disabled={procesandoId === solicitud.id}
                                                onClick={() => rechazarSolicitud(solicitud.id)}
                                                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </BotonAccion>

                                        
                                        </>
                                    )}
                                </div>
                            </Td>
                        </tr>
                    ))}

                    {!cargando && solicitudes.length === 0 && (
                        <tr>
                            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                No hay solicitudes registradas
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {solicitudSeleccionada && (
                <DetalleSolicitudModal
                    solicitud={solicitudSeleccionada}
                    onClose={() => setSolicitudSeleccionada(null)}
                />
            )}

            {solicitudEditando && (
                <NuevaSolicitudModal
                    solicitud={solicitudEditando}
                    clientes={clientes}
                    espacios={espacios}
                    onClose={cerrarFormulario}
                    onCreated={alGuardarSolicitud}
                    onSaved={alGuardarSolicitud}
                />
            )}
        </div>
    );
}

function BotonAccion({ title, onClick, children, className = '', disabled = false }) {
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 transition disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        >
            {children}
        </button>
    );
}

function EstadoBadge({ estado }) {
    const clases = {
        PENDIENTE: 'bg-yellow-100 text-yellow-800',
        APROBADA: 'bg-green-100 text-green-800',
        RECHAZADA: 'bg-red-100 text-red-800',
        CANCELADA: 'bg-gray-100 text-gray-700'
    };

    const etiquetas = {
        PENDIENTE: 'Pendiente',
        APROBADA: 'Aprobada',
        RECHAZADA: 'Rechazada',
        CANCELADA: 'Cancelada'
    };

    return (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${clases[estado] || clases.CANCELADA}`}>
            {etiquetas[estado] || estado || '-'}
        </span>
    );
}

function DetalleSolicitudModal({ solicitud, onClose }) {
    const factura = solicitud.reserva?.facturas?.[0];

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Resumen de solicitud</h2>
                        <p className="text-sm text-gray-500">{solicitud.codigo}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900 text-2xl" aria-label="Cerrar">×</button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <ResumenItem label="Estado" value={<EstadoBadge estado={solicitud.estado} />} />
                    <ResumenItem label="Cliente" value={solicitud.cliente?.nombre} />
                    <ResumenItem label="Evento" value={solicitud.nombreEvento} />
                    <ResumenItem label="Espacio" value={solicitud.espacio?.nombre} />
                    <ResumenItem label="Contacto responsable" value={solicitud.contactoResponsable} />
                    <ResumenItem label="Celular" value={solicitud.celular} />
                    <ResumenItem label="Correo" value={solicitud.correo} />
                    <ResumenItem label="Modalidad" value={solicitud.modalidadCosto} />
                    <ResumenItem label="Tipo de evento" value={solicitud.tipoEvento} />
                    <ResumenItem label="Personas" value={solicitud.personas} />
                    <ResumenItem label="Agendado por" value={solicitud.agendadoPor} />
                    <ResumenItem label="Costo estimado" value={`B/. ${formatearMonto(solicitud.costoEstimado)}`} />
                    <ResumenItem label="Reserva asociada" value={solicitud.reserva ? `Reserva #${solicitud.reserva.id}` : 'Sin reserva'} />
                    <ResumenItem label="Estado de reserva" value={solicitud.reserva?.estado || 'Sin reserva'} />
                    <ResumenItem label="Factura asociada" value={factura?.numero || 'Sin factura'} />
                    <ResumenItem label="Estado de factura" value={factura?.estado || 'Sin factura'} />
                    <ResumenItem label="Monto factura" value={factura ? `B/. ${formatearMonto(factura.monto)}` : 'B/. 0.00'} />
                    <ResumenItem label="Inicio montaje" value={formatearFechaHora(solicitud.fechaInicioMontaje)} />
                    <ResumenItem label="Fin montaje" value={formatearFechaHora(solicitud.fechaFinMontaje)} />
                    <ResumenItem label="Inicio evento" value={formatearFechaHora(solicitud.fechaInicioEvento)} />
                    <ResumenItem label="Fin evento" value={formatearFechaHora(solicitud.fechaFinEvento)} />
                    <ResumenItem label="Inicio desmontaje" value={formatearFechaHora(solicitud.fechaInicioDesmontaje)} />
                    <ResumenItem label="Fin desmontaje" value={formatearFechaHora(solicitud.fechaFinDesmontaje)} />
                    <ResumenItem label="Inicio cierre" value={formatearFechaHora(solicitud.fechaInicioCerrado)} />
                    <ResumenItem label="Fin cierre" value={formatearFechaHora(solicitud.fechaFinCerrado)} />
                    <div className="md:col-span-2">
                        <ResumenItem label="Descripción" value={solicitud.descripcion} />
                    </div>
                    <div className="md:col-span-2">
                        <ResumenItem label="Observaciones" value={solicitud.observaciones} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResumenItem({ label, value }) {
    return (
        <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <div className="font-medium text-gray-900">{value || '-'}</div>
        </div>
    );
}

function obtenerUsuario() {
    try {
        return JSON.parse(localStorage.getItem('usuario'));
    } catch {
        return null;
    }
}

function obtenerMensajeError(error, predeterminado) {
    return error?.response?.data?.message || predeterminado;
}

export function formatearFechaHora(fecha) {
    if (!fecha) return '-';

    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return '-';

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

function formatearMonto(valor) {
    return Number(valor || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
