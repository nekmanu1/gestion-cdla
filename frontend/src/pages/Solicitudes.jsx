import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input  from "../components/ui/Input";
import NuevaSolicitudModal from '../components/solicitudes/NuevaSolicitudModal';
import {
    EyeIcon,
    DocumentArrowDownIcon, CheckIcon,
    XMarkIcon,  PencilSquareIcon
} from '@heroicons/react/24/outline';




import Table, { Th, Td } from '../components/ui/Table';

export default function Solicitudes() {
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    
    const [solicitudes, setSolicitudes] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [espacios, setEspacios] = useState([]);
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [espacioFiltro, setEspacioFiltro]= useState('');

    const [clienteFiltro, setClienteFiltro] = useState('');
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
    const [fechaFinFiltro, setFechaFinFiltro] = useState('');

    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);
    const [solicitudEditando, setSolicitudEditando] = useState(null);

const [costoEstimado, setCostoEstimado] = useState(0);

const usuario = JSON.parse(localStorage.getItem('usuario'));

const puedeEditar =
    usuario?.rol === 'ADMIN' || usuario?.rol === 'OPERADOR';

const [form, setForm] = useState({
        clienteId: '',
        espacioId: '',
        nombreEvento: '',
        contactoResponsable: '',
        celular: '',
        correo: '',
        modalidadCosto: 'ESTANDAR',

        fechaInicioMontaje: '',
        fechaFinMontaje: '',
        fechaInicioEvento: '',
        fechaFinEvento: '',
        fechaInicioDesmontaje: '',
        fechaFinDesmontaje: '',
        fechaInicioCerrado: '',
        fechaFinCerrado: '',

        tipoEvento: '',
        personas: '',
        agendadoPor: usuario?.nombre || '',
        actividad: '',
        descripcion: '',
        observaciones: ''
    });


    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        calcularCostoAutomatico();
    }, [
        form.espacioId,
        form.modalidadCosto,
        form.fechaInicioMontaje,
        form.fechaFinMontaje,
        form.fechaInicioEvento,
        form.fechaFinEvento,
        form.fechaInicioDesmontaje,
        form.fechaFinDesmontaje,
        form.fechaInicioCerrado,
        form.fechaFinCerrado
    ]);

    async function cargarDatos() {
        try {
            const [resSolicitudes, resClientes, resEspacios] = await Promise.all([
                api.get('/solicitudes'),
                api.get('/clientes?activo=true'),
                api.get('/espacios?estado=DISPONIBLE')
            ]);

            setSolicitudes(resSolicitudes.data);
            setClientes(resClientes.data);
            setEspacios(resEspacios.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar solicitudes');
        }
    }

    async function cambiarEstadoSolicitud(id, estado) {
    try {
        await api.put(`/solicitudes/${id}/estado`, { estado });

        toast.success('Estado actualizado correctamente');
        cargarDatos();
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al actualizar estado');
    }
}

    async function calcularCostoAutomatico() {
        if (!form.espacioId) {
            setCostoEstimado(0);
            return;
        }

        try {
            const response = await api.post('/solicitudes/calcular-costo', {
                espacioId: form.espacioId,
                modalidadCosto: form.modalidadCosto,
                fechaInicioMontaje: form.fechaInicioMontaje || null,
                fechaFinMontaje: form.fechaFinMontaje || null,
                fechaInicioEvento: form.fechaInicioEvento || null,
                fechaFinEvento: form.fechaFinEvento || null,
                fechaInicioDesmontaje: form.fechaInicioDesmontaje || null,
                fechaFinDesmontaje: form.fechaFinDesmontaje || null,
                fechaInicioCerrado: form.fechaInicioCerrado || null,
                fechaFinCerrado: form.fechaFinCerrado || null
            });

            setCostoEstimado(response.data.costoEstimado || 0);
        } catch (error) {
            console.error(error);
        }
    }

    function cambiar(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    function seleccionarCliente(cliente) {
        setForm({
            ...form,
            clienteId: cliente.id,
            contactoResponsable: form.contactoResponsable || cliente.nombre,
            celular: form.celular || cliente.telefono || '',
            correo: form.correo || cliente.correo || ''
        });

        setBusquedaCliente(cliente.nombre);
        setMostrarResultadosCliente(false);
    }

    function limpiarFormulario() {
        setBusquedaCliente('');
        setCostoEstimado(0);
        setMostrarResultadosCliente(false);

        setForm({
            clienteId: '',
            espacioId: '',
            nombreEvento: '',
            contactoResponsable: '',
            celular: '',
            correo: '',
            modalidadCosto: 'ESTANDAR',

            fechaInicioMontaje: '',
            fechaFinMontaje: '',
            fechaInicioEvento: '',
            fechaFinEvento: '',
            fechaInicioDesmontaje: '',
            fechaFinDesmontaje: '',
            fechaInicioCerrado: '',
            fechaFinCerrado: '',

            tipoEvento: '',
            personas: '',
            agendadoPor: usuario?.nombre || '',
            actividad: '',
            descripcion: '',
            observaciones: ''
        });
    }

    async function guardarSolicitud(e) {
        e.preventDefault();

        if (!form.clienteId) {
            toast.error('Debes seleccionar un cliente válido');
            return;
        }

        if (!form.espacioId) {
            toast.error('Debes seleccionar un espacio');
            return;
        }

        try {
            await api.post('/solicitudes', {
                ...form,
                clienteId: Number(form.clienteId),
                espacioId: Number(form.espacioId),
                personas: form.personas ? Number(form.personas) : null,
                actividad: form.actividad || form.tipoEvento || 'Evento'
            });

            toast.success('Solicitud creada correctamente');
            limpiarFormulario();
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al guardar solicitud');
        }
    }

    async function aprobarSolicitud(id) {
        if (!confirm('¿Deseas aprobar esta solicitud?')) return;

        try {
            await api.put(`/solicitudes/${id}/aprobar`);
            toast.success('Solicitud aprobada correctamente');
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al aprobar solicitud');
        }
    }

    async function rechazarSolicitud(id) {
        if (!confirm('¿Deseas rechazar esta solicitud?')) return;

        try {
            await api.put(`/solicitudes/${id}/rechazar`);
            toast.success('Solicitud rechazada correctamente');
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al rechazar solicitud');
        }
    }
async function filtrarSolicitudes() {
    try {
        const params = new URLSearchParams();

        if (estadoFiltro) params.append('estado', estadoFiltro);
        if (clienteFiltro) params.append('clienteId', clienteFiltro);
        if (fechaInicioFiltro) params.append('fechaInicio', fechaInicioFiltro);
        if (fechaFinFiltro) params.append('fechaFin', fechaFinFiltro);
        if (espacioFiltro) params.append('espacioId', espacioFiltro);

        const url = params.toString()
            ? `/solicitudes?${params.toString()}`
            : '/solicitudes';

        const response = await api.get(url);
        setSolicitudes(response.data);
    } catch (error) {
        console.error(error);
        toast.error('Error al filtrar solicitudes');
    }
}

    async function descargarReporteSolicitud(id) {
    try {
        const response = await api.get(`/reportes/solicitudes/${id}`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', `solicitud-${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        toast.error('Error al descargar reporte');
    }
}

    const clientesFiltrados = clientes.filter((cliente) => {
        const texto = busquedaCliente.toLowerCase();

        return (
            cliente.nombre.toLowerCase().includes(texto) ||
            (cliente.cedulaRuc || '').toLowerCase().includes(texto) ||
            (cliente.correo || '').toLowerCase().includes(texto)
        );
    });

    const espaciosAgrupados = espacios.reduce((grupos, espacio) => {
    const categoria = espacio.categoria || 'SIN_CATEGORIA';

    if (!grupos[categoria]) {
        grupos[categoria] = [];
    }

    grupos[categoria].push(espacio);

    return grupos;
}, {});

    return (
        <div>
            <PageHeader
                title="Solicitudes"
                subtitle="Registro de solicitudes, cálculo automático de costo y aprobación"
            />

           
            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-3">
                    <Select
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="APROBADA">Aprobada</option>
                        <option value="RECHAZADA">Rechazada</option>
                        <option value="CANCELADA">Cancelada</option>
                    </Select>

                    <Select
    value={espacioFiltro}
    onChange={(e) => setEspacioFiltro(e.target.value)}
>
    <option value="">Todos los Espacios</option>
    {espacios.map((espacio) => (
        <option key={espacio.id} value={espacio.id}>
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


                    <Button onClick={filtrarSolicitudes}>
                        Filtrar
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setEstadoFiltro('');
    setClienteFiltro('');
    setEspacioFiltro('');
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
                        <Th>Código</Th>
                        <Th>Evento</Th>
                        <Th>Cliente</Th>
                        <Th>Espacio</Th>
                        <Th>Inicio Evento</Th>
                        <Th>Fin Evento</Th>
                        <Th>Costo</Th>
                        <Th>Estado</Th>
                        <Th>Acciones</Th>
                    </tr>
                </thead>

                <tbody>
                    {solicitudes.map((solicitud) => (
                        <tr key={solicitud.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <Td>{solicitud.codigo}</Td>
                            <Td className="font-medium text-gray-900">{solicitud.nombreEvento}</Td>
                            <Td>{solicitud.cliente?.nombre || '-'}</Td>
                            <Td>{solicitud.espacio?.nombre || '-'}</Td>
                            <Td>{solicitud.fechaInicioEvento ? new Date(solicitud.fechaInicioEvento).toLocaleString() : '-'}</Td>
                            <Td>{solicitud.fechaFinEvento ? new Date(solicitud.fechaFinEvento).toLocaleString() : '-'}</Td>
                            <Td className='text-right' >B/. {formatearMonto(solicitud.costoEstimado)}</Td>
                            <Td>
    {puedeEditar ? (
        <Select
    value={solicitud.estado}
    onChange={(e) => cambiarEstadoSolicitud(solicitud.id, e.target.value)}
    className={`min-w-[140px] font-semibold border-gray-300 ${claseTextoEstado(solicitud.estado)}`}
>
    <option value="PENDIENTE">Pendiente</option>
    <option value="RECHAZADA">Rechazada</option>
    <option value="CANCELADA">Cancelada</option>
</Select>
    ) : (
        <EstadoBadge estado={solicitud.estado} />
    )}
</Td>
                            <Td>
    <div className="flex items-center gap-2">
        <button
            type="button"
            onClick={() => setSolicitudSeleccionada(solicitud)}
            title="Ver detalle"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition"
        >
            <EyeIcon className="w-5 h-5" />
        </button>

        <button
            type="button"
            onClick={() => descargarReporteSolicitud(solicitud.id)}
            title="Descargar PDF"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition"
        >
            <DocumentArrowDownIcon className="w-5 h-5" />
        </button>
        <button
    type="button"
    title="Editar solicitud"
    onClick={() => setSolicitudEditando(solicitud)}
    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200 transition"
>
    <PencilSquareIcon className="w-5 h-5" />
</button>

        {solicitud.estado === 'PENDIENTE' && (
            <>
                <button
    type="button"
    title="Aprobar solicitud"
    onClick={() => aprobarSolicitud(solicitud.id)}
    className="inline-flex items-center justify-center
               w-9 h-9 rounded-lg
               border border-green-200
               text-green-700
               hover:bg-green-50
               hover:border-green-300
               transition"
>
    <CheckIcon className="w-5 h-5" />
</button>

<button
    type="button"
    title="Rechazar solicitud"
    onClick={() => rechazarSolicitud(solicitud.id)}
    className="inline-flex items-center justify-center
               w-9 h-9 rounded-lg
               border border-red-200
               text-red-700
               hover:bg-red-50
               hover:border-red-300
               transition"
>
    <XMarkIcon className="w-5 h-5" />
</button>
            </>
        )}
    </div>
</Td>
                        
                        </tr>
                    ))}

                    {solicitudes.length === 0 && (
                        <tr>
                            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                No hay solicitudes registradas
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {solicitudSeleccionada && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Resumen de solicitud
                    </h2>
                    <p className="text-sm text-gray-500">
                        {solicitudSeleccionada.codigo}
                    </p>
                </div>

                <button
                    onClick={() => setSolicitudSeleccionada(null)}
                    className="text-gray-500 hover:text-gray-900 text-xl"
                >
                    ×
                </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <ResumenItem label="Estado" value={solicitudSeleccionada.estado} />
                <ResumenItem label="Cliente" value={solicitudSeleccionada.cliente?.nombre} />
                <ResumenItem label="Evento" value={solicitudSeleccionada.nombreEvento} />
                <ResumenItem label="Espacio" value={solicitudSeleccionada.espacio?.nombre} />
                <ResumenItem label="Contacto responsable" value={solicitudSeleccionada.contactoResponsable} />
                <ResumenItem label="Celular" value={solicitudSeleccionada.celular} />
                <ResumenItem label="Correo" value={solicitudSeleccionada.correo} />
                <ResumenItem label="Modalidad" value={solicitudSeleccionada.modalidadCosto} />
                <ResumenItem label="Tipo de evento" value={solicitudSeleccionada.tipoEvento} />
                <ResumenItem label="Personas" value={solicitudSeleccionada.personas} />
                <ResumenItem label="Agendado por" value={solicitudSeleccionada.agendadoPor} />
                <ResumenItem label="Costo estimado" value={`B/. ${formatearMonto(solicitudSeleccionada.costoEstimado)}`} />
                <ResumenItem
    label="Reserva asociada"
    value={solicitudSeleccionada.reserva ? `Reserva #${solicitudSeleccionada.reserva.id}` : 'Sin reserva'}
/>

<ResumenItem
    label="Estado de reserva"
    value={solicitudSeleccionada.reserva?.estado || 'Sin reserva'}
/>

<ResumenItem
    label="Factura asociada"
    value={
        solicitudSeleccionada.reserva?.facturas?.length > 0
            ? solicitudSeleccionada.reserva.facturas[0].numero
            : 'Sin factura'
    }
/>

<ResumenItem
    label="Estado de factura"
    value={
        solicitudSeleccionada.reserva?.facturas?.length > 0
            ? solicitudSeleccionada.reserva.facturas[0].estado
            : 'Sin factura'
    }
/>

<ResumenItem 
    label="Monto factura"
    value={
        solicitudSeleccionada.reserva?.facturas?.length > 0
            ? `B/. ${formatearMonto(solicitudSeleccionada.reserva.facturas[0].monto)}`
            : 'B/. 0.00'
    }
/>
                <ResumenItem label="Inicio montaje" value={formatearFecha(solicitudSeleccionada.fechaInicioMontaje)} />
                <ResumenItem label="Fin montaje" value={formatearFecha(solicitudSeleccionada.fechaFinMontaje)} />
                <ResumenItem label="Inicio evento" value={formatearFecha(solicitudSeleccionada.fechaInicioEvento)} />
                <ResumenItem label="Fin evento" value={formatearFecha(solicitudSeleccionada.fechaFinEvento)} />
                <ResumenItem label="Inicio desmontaje" value={formatearFecha(solicitudSeleccionada.fechaInicioDesmontaje)} />
                <ResumenItem label="Fin desmontaje" value={formatearFecha(solicitudSeleccionada.fechaFinDesmontaje)} />
                <ResumenItem label="Inicio cierre" value={formatearFecha(solicitudSeleccionada.fechaInicioCerrado)} />
                <ResumenItem label="Fin cierre" value={formatearFecha(solicitudSeleccionada.fechaFinCerrado)} />

                <div className="md:col-span-2">
                    <ResumenItem label="Observaciones" value={solicitudSeleccionada.observaciones} />
                </div>
            </div>
        </div>
    </div>
)}

{solicitudEditando && (
    <NuevaSolicitudModal
        solicitud={solicitudEditando}
        onClose={() => setSolicitudEditando(null)}
        onCreated={() => {
            setSolicitudEditando(null);
            cargarDatos();
        }}
    />
)}
        </div>
    );
}

function EstadoBadge({ estado }) {
    const clases = {
        PENDIENTE: 'bg-yellow-100 text-yellow-800',
        APROBADA: 'bg-green-100 text-green-800',
        RECHAZADA: 'bg-red-100 text-red-800',
        CANCELADA: 'bg-gray-100 text-gray-700'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${clases[estado] || 'bg-gray-100 text-gray-700'}`}>
            {estado}
        </span>
    );
}

function ResumenItem({ label, value }) {
    return (
        <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">
                {label}
            </p>
            <p className="font-medium text-gray-900">
                {value || '-'}
            </p>
        </div>
    );
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString();
}


function mostrarCategoria(categoria) {
    const categorias = {
        SALONES: 'Salones',
        TEATROS: 'Teatros',
        ESPACIOS_EXTERIORES: 'Espacio Exterior',
        RECORRIDOS: 'Recorridos',
        GALERIA: 'Galería',
        SIN_CATEGORIA: 'Sin categoría'
    };

    return categorias[categoria] || categoria;
}

function formatearMonto(valor) {
    return Number(valor || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function claseTextoEstado(estado) {
    const clases = {
        PENDIENTE: 'text-yellow-600',
        APROBADA: 'text-green-600',
        RECHAZADA: 'text-red-600',
        CANCELADA: 'text-gray-600'
    };

    return clases[estado] || 'text-gray-600';
}


function formatearFechaCorta(fecha) {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleDateString('es-PA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function textoCorto(texto, maximo = 30) {
    if (!texto) return '';

    return texto.length > maximo
        ? texto.substring(0, maximo) + '...'
        : texto;
}

