import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

import api from '../../api/axios';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const FORMULARIO_INICIAL = {
    clienteNombre: '',
    clienteCedulaRuc: '',
    clienteDireccion: '',
    clienteTipoCliente: '',
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
    agendadoPor: '',
    actividad: '',
    descripcion: '',
    observaciones: '',
    estado: 'PENDIENTE'
};

const CAMPOS_FECHA = [
    'fechaInicioMontaje',
    'fechaFinMontaje',
    'fechaInicioEvento',
    'fechaFinEvento',
    'fechaInicioDesmontaje',
    'fechaFinDesmontaje',
    'fechaInicioCerrado',
    'fechaFinCerrado'
];

export default function NuevaSolicitudModal({
    solicitud = null,
    clientes: clientesRecibidos = [],
    espacios: espaciosRecibidos = [],
    onClose,
    onCreated,
    onSaved
}) {
    const editando = Boolean(solicitud?.id);
    const [clientes, setClientes] = useState(clientesRecibidos);
    const [espacios, setEspacios] = useState(espaciosRecibidos);
    const [form, setForm] = useState(() => construirFormulario(solicitud));
    const [guardando, setGuardando] = useState(false);
    const [verificando, setVerificando] = useState(false);
    const [conflicto, setConflicto] = useState(null);
    const [mensajeEnvio, setMensajeEnvio] = useState('');
    const [disponible, setDisponible] = useState(false);
    const [costoEstimado, setCostoEstimado] = useState(Number(solicitud?.costoEstimado || 0));
    const [busquedaCliente, setBusquedaCliente] = useState('');
const [mostrarClientes, setMostrarClientes] = useState(false);
const [mensajeCliente, setMensajeCliente] = useState('');
    const usuario = useMemo(() => obtenerUsuario(), []);
    const contenedorClienteRef = useRef(null);


const clientesFiltrados = useMemo(() => {

    const texto = busquedaCliente
        .toLowerCase()
        .trim();

    if (!texto) return clientes.slice(0, 8);

    return clientes
        .filter((cliente) => {

            return (
                cliente.nombre?.toLowerCase().includes(texto) ||
                cliente.cedulaRuc?.toLowerCase().includes(texto) ||
                cliente.correo?.toLowerCase().includes(texto)
            );

        })
        .slice(0, 8);

}, [clientes, busquedaCliente]);



    useEffect(() => {
        setMensajeEnvio('');
        setForm((actual) => ({
            ...construirFormulario(solicitud),
            agendadoPor: solicitud?.agendadoPor || actual.agendadoPor || usuario?.nombre || ''
        }));
        setCostoEstimado(Number(solicitud?.costoEstimado || 0));
        setConflicto(null);
        setDisponible(false);
    }, [solicitud, usuario?.nombre]);

    useEffect(() => {

    setBusquedaCliente(
        solicitud?.cliente?.nombre || ''
    );

}, [solicitud]);

    useEffect(() => {
        async function cargarCatalogos() {
            try {
                const solicitudes = [];
                if (!clientesRecibidos.length) solicitudes.push(api.get('/clientes?activo=true'));
                if (!espaciosRecibidos.length) solicitudes.push(api.get('/espacios'));
                if (!solicitudes.length) return;

                const resultados = await Promise.all(solicitudes);
                let indice = 0;
                if (!clientesRecibidos.length) setClientes(resultados[indice++].data || []);
                if (!espaciosRecibidos.length) setEspacios(resultados[indice].data || []);
            } catch (error) {
                console.error(error);
                toast.error('No se pudieron cargar clientes o espacios');
            }
        }

        cargarCatalogos();
    }, [clientesRecibidos, espaciosRecibidos]);

    useEffect(() => {
        const temporizador = window.setTimeout(() => {
            verificarDisponibilidad();
        }, 450);

        return () => window.clearTimeout(temporizador);
    }, [
        form.espacioId,
        form.fechaInicioMontaje,
        form.fechaFinMontaje,
        form.fechaInicioEvento,
        form.fechaFinEvento,
        form.fechaInicioDesmontaje,
        form.fechaFinDesmontaje,
        form.fechaInicioCerrado,
        form.fechaFinCerrado,
        solicitud?.id
    ]);

    useEffect(() => {
    function cerrarBuscadorCliente(event) {
        if (
            contenedorClienteRef.current &&
            !contenedorClienteRef.current.contains(event.target)
        ) {
            setMostrarClientes(false);
        }
    }

    document.addEventListener('mousedown', cerrarBuscadorCliente);

    return () => {
        document.removeEventListener(
            'mousedown',
            cerrarBuscadorCliente
        );
    };
}, []);

    useEffect(() => {
        const temporizador = window.setTimeout(() => {
            calcularCosto();
        }, 450);

        return () => window.clearTimeout(temporizador);
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

    function cambiar(e) {
        const { name, value } = e.target;
        setMensajeEnvio('');
        setForm((actual) => ({ ...actual, [name]: value }));
    }

    function seleccionarCliente(cliente) {
    setForm((actual) => ({
        ...actual,
        clienteId: String(cliente.id),
        clienteNombre: cliente.nombre || '',
        clienteCedulaRuc: cliente.cedulaRuc || '',
        clienteDireccion: cliente.direccion || '',
        clienteTipoCliente: cliente.tipoCliente || '',
        contactoResponsable:
            cliente.contactoResponsable || '',
        celular: cliente.telefono || '',
        correo: cliente.correo || ''
    }));

    setBusquedaCliente(cliente.nombre);
    setMostrarClientes(false);
    setMensajeCliente(
        `Cliente existente seleccionado: ${cliente.nombre}`
    );
}

function cambiarBusquedaCliente(e) {
    const valor = e.target.value;

    setBusquedaCliente(valor);
    setMostrarClientes(true);
    setMensajeCliente('');

    /*
     * Al modificar manualmente el nombre se elimina
     * la selección anterior y pasa a ser cliente nuevo.
     */
    setForm((actual) => ({
        ...actual,
        clienteId: '',
        clienteNombre: valor
    }));
}

    function fechasMinimasCompletas() {
        return Boolean(form.espacioId && form.fechaInicioEvento && form.fechaFinEvento);
    }

    function paresFechasValidos() {
        const pares = [
            ['fechaInicioMontaje', 'fechaFinMontaje', 'montaje'],
            ['fechaInicioEvento', 'fechaFinEvento', 'evento'],
            ['fechaInicioDesmontaje', 'fechaFinDesmontaje', 'desmontaje'],
            ['fechaInicioCerrado', 'fechaFinCerrado', 'cierre']
        ];

        for (const [inicio, fin, nombre] of pares) {
            const tieneInicio = Boolean(form[inicio]);
            const tieneFin = Boolean(form[fin]);

            if (tieneInicio !== tieneFin) {
                return `Debes completar el inicio y el fin de ${nombre}.`;
            }

            if (tieneInicio && new Date(form[fin]) <= new Date(form[inicio])) {
                return `La fecha final de ${nombre} debe ser posterior a la fecha inicial.`;
            }
        }

        return null;
    }

    function construirPayloadFechas() {
        return CAMPOS_FECHA.reduce((payload, campo) => {
            payload[campo] = form[campo] || null;
            return payload;
        }, {});
    }

    async function verificarDisponibilidad() {
        setDisponible(false);

        if (!fechasMinimasCompletas()) {
            setConflicto(null);
            return;
        }

        const errorFechas = paresFechasValidos();
        if (errorFechas) {
            setConflicto(errorFechas);
            return;
        }

        try {
            setVerificando(true);
            const response = await api.post('/solicitudes/verificar-disponibilidad', {
                espacioId: Number(form.espacioId),
                solicitudId: solicitud?.id || undefined,
                ...construirPayloadFechas()
            });

            if (response.data?.disponible) {
                setConflicto(null);
                setDisponible(true);
            } else {
                setDisponible(false);
                setConflicto(response.data?.message || 'El espacio no está disponible en ese horario.');
            }
        } catch (error) {
            console.error(error);
            setDisponible(false);
            setConflicto(obtenerMensajeError(error, 'No se pudo verificar la disponibilidad'));
        } finally {
            setVerificando(false);
        }
    }

    async function calcularCosto() {
        if (!fechasMinimasCompletas() || paresFechasValidos()) {
            setCostoEstimado(0);
            return;
        }

        try {
            const response = await api.post('/solicitudes/calcular-costo', {
                espacioId: Number(form.espacioId),
                modalidadCosto: form.modalidadCosto,
                ...construirPayloadFechas()
            });
            setCostoEstimado(Number(response.data?.costoEstimado || 0));
        } catch (error) {
            // No mostrar toast durante cada pulsación. El servidor validará nuevamente al guardar.
            console.error(error);
            setCostoEstimado(0);
        }
    }

    function validarFormulario() {
    if (
        !form.clienteId &&
        !form.clienteNombre.trim()
    ) {
        return 'Debes seleccionar un cliente o escribir el nombre de uno nuevo.';
    }

    if (!form.contactoResponsable.trim()) {
        return 'El contacto responsable es obligatorio.';
    }

    if (!form.espacioId) {
        return 'Debes seleccionar un espacio.';
    }

    if (!form.nombreEvento.trim()) {
        return 'El nombre del evento es obligatorio.';
    }

    if (
        !form.fechaInicioEvento ||
        !form.fechaFinEvento
    ) {
        return 'Debes completar el inicio y fin del evento.';
    }

    const errorFechas = paresFechasValidos();

    if (errorFechas) return errorFechas;
    if (conflicto) return conflicto;

    if (verificando) {
        return 'Espera mientras se verifica la disponibilidad.';
    }

    return null;
}

    async function guardar(e) {
        e.preventDefault();

        const errorValidacion = validarFormulario();
        if (errorValidacion) {
            toast.error(errorValidacion);
            return;
        }

        const payload = {
    clienteId: form.clienteId
        ? Number(form.clienteId)
        : null,

    clienteNombre: !form.clienteId
        ? form.clienteNombre.trim()
        : null,

    clienteCedulaRuc: !form.clienteId
        ? form.clienteCedulaRuc.trim() || null
        : null,

    clienteDireccion: !form.clienteId
        ? form.clienteDireccion.trim() || null
        : null,

    clienteTipoCliente: !form.clienteId
        ? form.clienteTipoCliente.trim() || null
        : null,

    espacioId: Number(form.espacioId),
    nombreEvento: form.nombreEvento.trim(),

    contactoResponsable:
        form.contactoResponsable.trim(),

    celular: form.celular.trim() || null,
    correo: form.correo.trim() || null,

    modalidadCosto: form.modalidadCosto,
    ...construirPayloadFechas(),

    tipoEvento: form.tipoEvento || null,

    personas:
        form.personas === ''
            ? null
            : Number(form.personas),

    agendadoPor:
        form.agendadoPor.trim() || null,

    actividad:
        form.actividad.trim() ||
        form.tipoEvento ||
        'Evento',

    descripcion:
        form.descripcion.trim() || null,

    observaciones:
        form.observaciones.trim() || null
};

        try {
            setGuardando(true);
            setMensajeEnvio('');

            const response = editando
                ? await api.put(`/solicitudes/${solicitud.id}`, payload)
                : await api.post('/solicitudes', payload);

            // El estado se procesa por su endpoint específico para mantener
            // sincronizada la solicitud con la reserva asociada.
            if (editando && form.estado !== solicitud.estado) {
                await api.put(`/solicitudes/${solicitud.id}/estado`, {
                    estado: form.estado
                });
            }

            toast.success(response.data?.message || (editando
                ? 'Solicitud actualizada correctamente'
                : 'Solicitud creada correctamente'));

            if (onSaved) await onSaved(response.data?.solicitud);
            else if (onCreated) await onCreated(response.data?.solicitud);
            else onClose?.();
        } catch (error) {
            console.error(error);
            const mensaje = obtenerMensajeError(error, 'No se pudo guardar la solicitud');

            setMensajeEnvio(mensaje);
            toast.error(mensaje);

            // El controlador puede responder 400 o 409 según el tipo de conflicto.
            // En ambos casos el mensaje queda visible debajo de la disponibilidad.
            if ([400, 409].includes(error?.response?.status) && esMensajeDeConflicto(mensaje)) {
                setDisponible(false);
                setConflicto(mensaje);
            }
        } finally {
            setGuardando(false);
        }
    }

    const guardarDeshabilitado = guardando || verificando || Boolean(conflicto) || !fechasMinimasCompletas();

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-2xl shadow-2xl overflow-y-auto">
                <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {editando ? 'Editar solicitud' : 'Nueva solicitud'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {editando ? solicitud.codigo : 'Complete primero el espacio y las fechas para validar disponibilidad.'}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-900" aria-label="Cerrar">×</button>
                </div>

                <form onSubmit={guardar} className="p-6 space-y-7">
                    <Seccion titulo="Información principal">
                        
<Campo label="Cliente *">
    <div
    ref={contenedorClienteRef}
    className="relative"
>
        <Input
    value={busquedaCliente}
    onChange={cambiarBusquedaCliente}
    onFocus={() => setMostrarClientes(true)}
    onKeyDown={(e) => {
        if (e.key === 'Escape') {
            setMostrarClientes(false);
        }
    }}
    placeholder="Buscar o escribir un cliente nuevo"
    autoComplete="off"
    required
/>

        {mostrarClientes && busquedaCliente.trim() && (
            <div
                className="
                    absolute z-40 mt-1 w-full
                    max-h-64 overflow-y-auto
                    rounded-lg border border-gray-200
                    bg-white shadow-xl
                "
            >
                {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map((cliente) => (
                        <button
                            key={cliente.id}
                            type="button"
                            onClick={() =>
                                seleccionarCliente(cliente)
                            }
                            className="
                                block w-full px-4 py-3
                                text-left hover:bg-blue-50
                                border-b border-gray-100
                            "
                        >
                            <span className="block font-medium text-gray-900">
                                {cliente.nombre}
                            </span>

                            <span className="block text-xs text-gray-500">
                                {cliente.cedulaRuc || 'Sin cédula/RUC'}
                                {' · '}
                                {cliente.correo || 'Sin correo'}
                            </span>
                        </button>
                    ))
                ) : (
                    <div className="px-4 py-3 text-sm text-gray-600">
                        No existe este cliente. Se creará al guardar la solicitud.
                    </div>
                )}
            </div>
        )}

        {mensajeCliente && (
            <span className="block mt-1 text-xs font-medium text-green-700">
                {mensajeCliente}
            </span>
        )}

        {!form.clienteId && busquedaCliente.trim() && (
            <span className="block mt-1 text-xs font-medium text-blue-700">
                Cliente nuevo: se registrará automáticamente al crear la solicitud.
            </span>
        )}
    </div>
    </Campo>



{!form.clienteId && form.clienteNombre.trim() && (
    <>
        <Campo label="Cédula / RUC del cliente">
            <Input
                name="clienteCedulaRuc"
                value={form.clienteCedulaRuc}
                onChange={cambiar}
            />
        </Campo>

        <Campo label="Dirección del cliente">
            <Input
                name="clienteDireccion"
                value={form.clienteDireccion}
                onChange={cambiar}
            />
        </Campo>

        <Campo label="Tipo de cliente">
            <Input
                name="clienteTipoCliente"
                value={form.clienteTipoCliente}
                onChange={cambiar}
                placeholder="Institución, empresa, persona, fundación..."
            />
        </Campo>
    </>
)}
                        

                        <Campo label="Espacio *">
                            <Select name="espacioId" value={form.espacioId} onChange={cambiar} required>
                                <option value="">Seleccionar espacio</option>
                                {espacios.map((espacio) => (
                                    <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>
                                ))}
                            </Select>
                        </Campo>

                        <Campo label="Nombre del evento *">
                            <Input name="nombreEvento" value={form.nombreEvento} onChange={cambiar} required />
                        </Campo>

                        <Campo label="Modalidad de costo">
                            <Select name="modalidadCosto" value={form.modalidadCosto} onChange={cambiar}>
                                <option value="ESTANDAR">Estándar</option>
                                <option value="ESCUELA_CDLA">Escuela CDLA</option>
                                <option value="GRATUITO">Gratuito</option>
                            </Select>
                        </Campo>

                        <Campo label="Tipo de evento">
                            <Input name="tipoEvento" value={form.tipoEvento} onChange={cambiar} />
                        </Campo>

                        <Campo label="Cantidad de personas">
                            <Input type="number" min="0" name="personas" value={form.personas} onChange={cambiar} />
                        </Campo>
                    </Seccion>

                    <Seccion titulo="Fechas y horarios">
                        <FechaCampo label="Inicio montaje " name="fechaInicioMontaje" value={form.fechaInicioMontaje} onChange={cambiar} />
                        <FechaCampo label="Fin montaje " name="fechaFinMontaje" value={form.fechaFinMontaje} onChange={cambiar} />
                        <FechaCampo label="Inicio evento * " name="fechaInicioEvento" value={form.fechaInicioEvento} onChange={cambiar} required />
                        <FechaCampo label="Fin evento * " name="fechaFinEvento" value={form.fechaFinEvento} onChange={cambiar} required />
                        <FechaCampo label="Inicio desmontaje " name="fechaInicioDesmontaje" value={form.fechaInicioDesmontaje} onChange={cambiar} />
                        <FechaCampo label="Fin desmontaje " name="fechaFinDesmontaje" value={form.fechaFinDesmontaje} onChange={cambiar} />
                        <FechaCampo label="Inicio cierre " name="fechaInicioCerrado" value={form.fechaInicioCerrado} onChange={cambiar} />
                        <FechaCampo label="Fin cierre " name="fechaFinCerrado" value={form.fechaFinCerrado} onChange={cambiar} />
                    </Seccion>

                    <div aria-live="polite">
                        {verificando && (
                            <Aviso tipo="info">Verificando disponibilidad del espacio...</Aviso>
                        )}
                        {!verificando && conflicto && (
                            <Aviso tipo="error" icono={<ExclamationTriangleIcon className="w-5 h-5" />}>
                                {conflicto}
                            </Aviso>
                        )}
                        {!verificando && disponible && !conflicto && (
                            <Aviso tipo="success" icono={<CheckCircleIcon className="w-5 h-5" />}>
                                El espacio está disponible en el rango seleccionado.
                            </Aviso>
                        )}
                    </div>

                    {mensajeEnvio && (
                        <span
                            role="alert"
                            className="block text-sm font-semibold text-red-700"
                        >
                            {mensajeEnvio}
                        </span>
                    )}

                    <Seccion titulo="Contacto y detalles">
                        <Campo label="Contacto responsable">
                            <Input name="contactoResponsable" value={form.contactoResponsable} onChange={cambiar} />
                        </Campo>
                        <Campo label="Celular">
                            <Input name="celular" value={form.celular} onChange={cambiar} />
                        </Campo>
                        <Campo label="Correo">
                            <Input type="email" name="correo" value={form.correo} onChange={cambiar} />
                        </Campo>
                        <Campo label="Agendado por">
                            <Input name="agendadoPor" value={form.agendadoPor} onChange={cambiar} />
                        </Campo>
                        <Campo label="Actividad">
                            <Input name="actividad" value={form.actividad} onChange={cambiar} />
                        </Campo>

                        {editando && (
                            <Campo label="Estado">
                                <Select name="estado" value={form.estado} onChange={cambiar}>
                                    {solicitud?.estado === 'APROBADA' && (
                                        <option value="APROBADA" disabled>Aprobada</option>
                                    )}
                                    <option value="PENDIENTE">Pendiente</option>
                                    {solicitud?.estado !== 'APROBADA' && (
                                        <option value="RECHAZADA">Rechazada</option>
                                    )}
                                    <option value="CANCELADA">Cancelada</option>
                                </Select>
                                <p className="mt-1 text-xs text-gray-500">
                                    La aprobación solo se realiza con el botón de gancho. Al volver una solicitud aprobada a pendiente, se libera su reserva y podrá aprobarse nuevamente.
                                </p>
                            </Campo>
                        )}
                    </Seccion>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Campo label="Descripción">
                            <textarea
                                name="descripcion"
                                value={form.descripcion}
                                onChange={cambiar}
                                rows="4"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Campo>
                        <Campo label="Observaciones">
                            <textarea
                                name="observaciones"
                                value={form.observaciones}
                                onChange={cambiar}
                                rows="4"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </Campo>
                    </div>

                    <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-500">Costo estimado</p>
                            <p className="text-2xl font-bold text-gray-900">B/. {formatearMonto(costoEstimado)}</p>
                        </div>
                        <p className="text-xs text-gray-500 max-w-xl">
                            El servidor volverá a validar fechas, disponibilidad y costo al guardar para evitar conflictos simultáneos.
                        </p>
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={guardando}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={guardarDeshabilitado}>
                            {guardando
                                ? 'Guardando...'
                                : verificando
                                    ? 'Verificando...'
                                    : editando
                                        ? 'Guardar cambios'
                                        : 'Crear solicitud'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function construirFormulario(solicitud) {
    if (!solicitud) return { ...FORMULARIO_INICIAL };

    return {
        ...FORMULARIO_INICIAL,
          clienteId: solicitud.clienteId
        ? String(solicitud.clienteId)
        : '',

    clienteNombre:
        solicitud.cliente?.nombre || '',

    clienteCedulaRuc:
        solicitud.cliente?.cedulaRuc || '',

    clienteDireccion:
        solicitud.cliente?.direccion || '',

    clienteTipoCliente:
        solicitud.cliente?.tipoCliente || '',
        espacioId: solicitud.espacioId ? String(solicitud.espacioId) : '',
        nombreEvento: solicitud.nombreEvento || '',
        contactoResponsable: solicitud.contactoResponsable || '',
        celular: solicitud.celular || '',
        correo: solicitud.correo || '',
        modalidadCosto: solicitud.modalidadCosto || 'ESTANDAR',
        fechaInicioMontaje: aDatetimeLocal(solicitud.fechaInicioMontaje),
        fechaFinMontaje: aDatetimeLocal(solicitud.fechaFinMontaje),
        fechaInicioEvento: aDatetimeLocal(solicitud.fechaInicioEvento),
        fechaFinEvento: aDatetimeLocal(solicitud.fechaFinEvento),
        fechaInicioDesmontaje: aDatetimeLocal(solicitud.fechaInicioDesmontaje),
        fechaFinDesmontaje: aDatetimeLocal(solicitud.fechaFinDesmontaje),
        fechaInicioCerrado: aDatetimeLocal(solicitud.fechaInicioCerrado),
        fechaFinCerrado: aDatetimeLocal(solicitud.fechaFinCerrado),
        tipoEvento: solicitud.tipoEvento || '',
        personas: solicitud.personas ?? '',
        agendadoPor: solicitud.agendadoPor || '',
        actividad: solicitud.actividad || '',
        descripcion: solicitud.descripcion || '',
        observaciones: solicitud.observaciones || '',
        estado: solicitud.estado || 'PENDIENTE'
    };
}

function aDatetimeLocal(fecha) {
    if (!fecha) return '';
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return '';

    const partes = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Panama'
    }).formatToParts(valor);

    const mapa = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
    return `${mapa.year}-${mapa.month}-${mapa.day}T${mapa.hour}:${mapa.minute}`;
}

function Seccion({ titulo, children }) {
    return (
        <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">{titulo}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{children}</div>
        </section>
    );
}

function Campo({ label, children }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
            {children}
        </label>
    );
}

function FechaCampo({ label, ...props }) {
    return (
        <Campo label={label}>
            <Input type="datetime-local" {...props} />
        </Campo>
    );
}

function Aviso({ tipo, icono, children }) {
    const clases = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-green-50 border-green-200 text-green-800'
    };

    return (
        <div className={`rounded-lg border px-4 py-3 flex items-start gap-2 ${clases[tipo]}`}>
            {icono}
            <span className="text-sm font-medium">{children}</span>
        </div>
    );
}


function esMensajeDeConflicto(mensaje = '') {
    const texto = String(mensaje).toLowerCase();
    return [
        'conflicto',
        'reserva',
        'ocupado',
        'ocupada',
        'disponible',
        'rango de fechas',
        'horario',
        'solicitud pendiente'
    ].some((palabra) => texto.includes(palabra));
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

function formatearMonto(valor) {
    return Number(valor || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


