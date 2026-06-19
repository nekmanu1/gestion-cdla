import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EyeIcon } from '@heroicons/react/24/outline';

import api from '../api/axios';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';

const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Calendario() {
    const hoy = new Date();

    const fechaActual = new Date();

const [mesPDF, setMesPDF] = useState(String(fechaActual.getMonth() + 1));
const [anioPDF, setAnioPDF] = useState(String(fechaActual.getFullYear()));

    const usuario = JSON.parse(localStorage.getItem('usuario'));

    const [mes, setMes] = useState(hoy.getMonth());
    const [anio, setAnio] = useState(hoy.getFullYear());

    const [solicitudes, setSolicitudes] = useState([]);
    const [espacios, setEspacios] = useState([]);
    const [clientes, setClientes] = useState([]);

    const [espacioFiltro, setEspacioFiltro] = useState('');
    const [modoDisponibilidad, setModoDisponibilidad] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);

    const [mostrarSolicitud, setMostrarSolicitud] = useState(false);
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);

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

    async function descargarCalendarioPDF() {
    try {
        const response = await api.get(
            `/solicitudes/calendario/descargar-pdf?mes=${mesPDF}&anio=${anioPDF}`,
            {
                responseType: 'blob'
            }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');

        link.href = url;
        link.download = `calendario-${mesPDF}-${anioPDF}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        toast.error('Error al descargar calendario PDF');
    }
}

    async function cargarDatos() {
        try {
            const [resSolicitudes, resEspacios, resClientes] = await Promise.all([
                api.get('/solicitudes/calendario'),
                api.get('/espacios'),
                api.get('/clientes?activo=true')
            ]);

            setSolicitudes(resSolicitudes.data);
            setEspacios(resEspacios.data);
            setClientes(resClientes.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar calendario');
        }
    }

    function cambiarMes(valor) {
        let nuevoMes = mes + valor;
        let nuevoAnio = anio;

        if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAnio--;
        }

        if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAnio++;
        }

        setMes(nuevoMes);
        setAnio(nuevoAnio);
        setDiaSeleccionado(null);
    }

    function formatoFecha(date) {
        return date.toISOString().split('T')[0];
    }

    function obtenerDiasDelMes() {
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);

        const espaciosVacios = primerDia.getDay();
        const dias = [];

        for (let i = 0; i < espaciosVacios; i++) {
            dias.push(null);
        }

        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            dias.push(new Date(anio, mes, dia));
        }

        return dias;
    }

    function solicitudesDelDia(date) {
        if (!date) return [];

        const fecha = formatoFecha(date);

        return solicitudes.filter((solicitud) => {
            if (!solicitud.fechaInicio || !solicitud.fechaFin) return false;

            const inicio = new Date(solicitud.fechaInicio).toISOString().split('T')[0];
            const fin = new Date(solicitud.fechaFin).toISOString().split('T')[0];

            const coincideFecha = fecha >= inicio && fecha <= fin;

            const coincideEspacio = espacioFiltro
                ? solicitud.espacio === espacioFiltro
                : true;

            return coincideFecha && coincideEspacio;
        });
    }

    function diaOcupado(date) {
        if (!date || !espacioFiltro) return false;

        return solicitudesDelDia(date).length > 0;
    }

    function claseDia(date) {
        if (!date) return 'bg-transparent border-transparent';

        const fechaActual = formatoFecha(date);
        const seleccionado = diaSeleccionado && formatoFecha(diaSeleccionado) === fechaActual;

        if (seleccionado) {
            return 'bg-neutral-900 text-white border-neutral-900';
        }

        if (modoDisponibilidad && espacioFiltro) {
            return diaOcupado(date)
                ? 'bg-red-100 border-red-300 text-red-800'
                : 'bg-green-100 border-green-300 text-green-800';
        }

        return 'bg-gray-50 hover:bg-gray-100 border-gray-100';
    }

    function seleccionarDia(date) {
    if (!date) return;

    setDiaSeleccionado(date);
}

    function obtenerEspacioIdPorNombre(nombre) {
        if (!nombre) return '';

        const espacio = espacios.find((item) => item.nombre === nombre);

        return espacio?.id || '';
    }

    function cambiarForm(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    function seleccionarClienteFormulario(clienteId) {
        const cliente = clientes.find((item) => Number(item.id) === Number(clienteId));

        setForm({
            ...form,
            clienteId,
            contactoResponsable: form.contactoResponsable || cliente?.nombre || '',
            celular: form.celular || cliente?.telefono || '',
            correo: form.correo || cliente?.correo || ''
        });
    }

    async function guardarSolicitud(e) {
        e.preventDefault();

        if (!diaSeleccionado) {
            toast.error('Selecciona un día del calendario');
            return;
        }

        if (!form.clienteId || !form.espacioId || !form.fechaInicioEvento || !form.fechaFinEvento) {
    toast.error('Cliente, espacio, inicio y fin del evento son obligatorios');
    return;
}

        const fecha = formatoFecha(diaSeleccionado);

        try {
            await api.post('/solicitudes', {
    clienteId: Number(form.clienteId),
    espacioId: Number(form.espacioId),
    nombreEvento: form.nombreEvento,
    contactoResponsable: form.contactoResponsable,
    celular: form.celular,
    correo: form.correo,
    modalidadCosto: form.modalidadCosto,

    fechaInicioMontaje: form.fechaInicioMontaje || null,
    fechaFinMontaje: form.fechaFinMontaje || null,
    fechaInicioEvento: form.fechaInicioEvento,
    fechaFinEvento: form.fechaFinEvento,
    fechaInicioDesmontaje: form.fechaInicioDesmontaje || null,
    fechaFinDesmontaje: form.fechaFinDesmontaje || null,
    fechaInicioCerrado: form.fechaInicioCerrado || null,
    fechaFinCerrado: form.fechaFinCerrado || null,

    tipoEvento: form.tipoEvento,
    personas: form.personas ? Number(form.personas) : null,
    agendadoPor: form.agendadoPor,
    actividad: form.actividad || form.tipoEvento || 'Evento',
    descripcion: form.descripcion,
    observaciones: form.observaciones
});

            toast.success('Solicitud creada correctamente');

            setMostrarSolicitud(false);

            setForm({
    clienteId: '',
    espacioId: obtenerEspacioIdPorNombre(espacioFiltro) || '',
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

            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear solicitud');
        }
    }

    const dias = obtenerDiasDelMes();
    const eventosDia = diaSeleccionado ? solicitudesDelDia(diaSeleccionado) : [];

    return (
        <div>
            <PageHeader
                title="Calendario"
                subtitle="Consulta disponibilidad, solicitudes pendientes y reservas aprobadas"
            />

            <Card className="p-4 mb-6">
    <div className="flex flex-wrap gap-3 items-end">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
            </label>

            <Select
                value={mesPDF}
                onChange={(e) => setMesPDF(e.target.value)}
            >
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
            </Select>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
            </label>

            <Input
                type="number"
                value={anioPDF}
                onChange={(e) => setAnioPDF(e.target.value)}
            />
        </div>

        <Button onClick={descargarCalendarioPDF}>
            Descargar PDF
        </Button>
    </div>
</Card>

            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                    <Button
                        variant={!modoDisponibilidad ? 'primary' : 'secondary'}
                        onClick={() => setModoDisponibilidad(false)}
                    >
                        Ver eventos
                    </Button>

                    <Button
                        variant={modoDisponibilidad ? 'primary' : 'secondary'}
                        onClick={() => setModoDisponibilidad(true)}
                    >
                        Ver disponibilidad
                    </Button>

                    <Select
                        value={espacioFiltro}
                        onChange={(e) => {
                            setEspacioFiltro(e.target.value);
                            setForm((prev) => ({
                                ...prev,
                                espacioId: obtenerEspacioIdPorNombre(e.target.value) || ''
                            }));
                        }}
                    >
                        <option value="">— Todos los espacios —</option>

                        {espacios.map((espacio) => (
                            <option key={espacio.id} value={espacio.nombre}>
                                {espacio.nombre}
                            </option>
                        ))}
                    </Select>

                
                </div>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <Card className="p-5 xl:col-span-3">
                    <div className="flex justify-between items-center mb-5">
                        <Button variant="secondary" onClick={() => cambiarMes(-1)}>
                            ←
                        </Button>

                        <div className="flex gap-3 items-center">
                            <span className="font-semibold text-lg">
                                {meses[mes]}
                            </span>

                            <span className="font-semibold text-lg">
                                {anio}
                            </span>
                        </div>

                        <Button variant="secondary" onClick={() => cambiarMes(1)}>
                            →
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {diasSemana.map((dia) => (
                            <div
                                key={dia}
                                className="text-center text-xs font-semibold text-gray-500"
                            >
                                {dia}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {dias.map((date, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => seleccionarDia(date)}
                                className={`min-h-24 rounded-lg border text-left p-2 transition ${claseDia(date)}`}
                            >
                                {date && (
                                    <>
                                        <span className="text-sm font-medium">
                                            {date.getDate()}
                                        </span>

                                        {!modoDisponibilidad && solicitudesDelDia(date).length > 0 && (
                                            <div className="mt-2 text-xs text-blue-600 font-medium">
                                                {solicitudesDelDia(date).length} evento(s)
                                            </div>
                                        )}

                                        {modoDisponibilidad && espacioFiltro && (
                                            <div className="mt-2 text-xs font-medium">
                                                {diaOcupado(date) ? 'Ocupado' : 'Disponible'}
                                            </div>
                                        )}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </Card>

                <Card className="p-5">
                    <h2 className="text-lg font-semibold mb-3">
                        {diaSeleccionado
                            ? diaSeleccionado.toLocaleDateString()
                            : 'Selecciona un día'}
                    </h2>

                    <div className="mt-5 space-y-3">
                        {eventosDia.length === 0 && (
                            <p className="text-sm text-gray-500">
                                No hay eventos este día.
                            </p>
                        )}

                        {eventosDia.map((evento) => (
                            <div
                                key={evento.id}
                                className="border border-gray-200 rounded-lg p-3"
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <p className="font-semibold text-gray-900">
                                        {evento.titulo}
                                    </p>

                                    <EstadoBadge estado={evento.estado} />
                                </div>

                                <p className="text-sm text-gray-500">
                                    {evento.espacio}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {formatearHora(evento.fechaInicio)}
                                    {' - '}
                                    {formatearHora(evento.fechaFin)}
                                </p>

                                <p className="text-xs mt-2 text-gray-400">
                                    Cliente: {evento.cliente}
                                </p>

                                <Button
                                    variant="secondary"
                                    className="mt-3 w-full flex items-center justify-center gap-2"
                                    onClick={() => setSolicitudSeleccionada(evento)}
                                >
                                    <EyeIcon className="w-4 h-4" />
                                    Ver detalle
                                </Button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

           
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
                            <ResumenItem label="Cliente" value={solicitudSeleccionada.cliente} />
                            <ResumenItem label="Evento" value={solicitudSeleccionada.titulo} />
                            <ResumenItem label="Espacio" value={solicitudSeleccionada.espacio} />
                            <ResumenItem label="Costo estimado" value={`B/. ${formatearMonto(solicitudSeleccionada.costoEstimado)}`} />
                            <ResumenItem label="Inicio" value={formatearFecha(solicitudSeleccionada.fechaInicio)} />
                            <ResumenItem label="Fin" value={formatearFecha(solicitudSeleccionada.fechaFin)} />
                        </div>
                    </div>
                </div>
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

function formatearHora(fecha) {
    if (!fecha) return '-';

    return new Date(fecha).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatearMonto(valor) {
    return Number(valor || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

