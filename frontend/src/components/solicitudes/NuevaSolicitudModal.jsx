import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function NuevaSolicitudModal({
    onClose,
    onCreated,
    solicitud = null
}) {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const modoEdicion = Boolean(solicitud);

    const [clientes, setClientes] = useState([]);
    const [espacios, setEspacios] = useState([]);

    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);

    const [costoEstimado, setCostoEstimado] = useState(0);

    
    

    const [form, setForm] = useState({
        clienteId: '',
        clienteCedulaRuc:'',
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
        descripcion: '',
        observaciones: ''
    });

    
    const espacioSeleccionado = espacios.find(
    (espacio) => String(espacio.id) === String(form.espacioId)
);

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
    if (!solicitud) return;

    setBusquedaCliente(
        solicitud.cliente?.nombre || ''
    );

    setForm({
        clienteId: solicitud.clienteId || '',
        clienteCedulaRuc: solicitud.cliente?.cedulaRuc || '',
        espacioId: solicitud.espacioId || '',

        nombreEvento: solicitud.nombreEvento || '',
        contactoResponsable: solicitud.contactoResponsable || '',
        celular: solicitud.celular || '',
        correo: solicitud.correo || '',

        modalidadCosto:
            solicitud.modalidadCosto || 'ESTANDAR',

        fechaInicioMontaje:
            solicitud.fechaInicioMontaje
                ? solicitud.fechaInicioMontaje.slice(0,16)
                : '',

        fechaFinMontaje:
            solicitud.fechaFinMontaje
                ? solicitud.fechaFinMontaje.slice(0,16)
                : '',

        fechaInicioEvento:
            solicitud.fechaInicioEvento
                ? solicitud.fechaInicioEvento.slice(0,16)
                : '',

        fechaFinEvento:
            solicitud.fechaFinEvento
                ? solicitud.fechaFinEvento.slice(0,16)
                : '',

        fechaInicioDesmontaje:
            solicitud.fechaInicioDesmontaje
                ? solicitud.fechaInicioDesmontaje.slice(0,16)
                : '',

        fechaFinDesmontaje:
            solicitud.fechaFinDesmontaje
                ? solicitud.fechaFinDesmontaje.slice(0,16)
                : '',

        fechaInicioCerrado:
            solicitud.fechaInicioCerrado
                ? solicitud.fechaInicioCerrado.slice(0,16)
                : '',

        fechaFinCerrado:
            solicitud.fechaFinCerrado
                ? solicitud.fechaFinCerrado.slice(0,16)
                : '',

        tipoEvento: solicitud.tipoEvento || '',
        personas: solicitud.personas || '',

        agendadoPor:
            solicitud.agendadoPor ||
            usuario?.nombre ||
            '',

        descripcion:
            solicitud.descripcion || '',

        observaciones:
            solicitud.observaciones || ''
    });
}, [solicitud]);

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
            const [resClientes, resEspacios] = await Promise.all([
                api.get('/clientes?activo=true'),
                api.get('/espacios?estado=DISPONIBLE')
            ]);

            setClientes(resClientes.data);
            setEspacios(resEspacios.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos del formulario');
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
        clienteCedulaRuc: cliente.cedulaRuc || '',
        contactoResponsable: form.contactoResponsable || cliente.nombre,
        celular: form.celular || cliente.telefono || '',
        correo: form.correo || cliente.correo || ''
    });


        setBusquedaCliente(cliente.nombre);
        setMostrarResultadosCliente(false);
    }

    async function guardarSolicitud(e) {
        e.preventDefault();

        if (!busquedaCliente.trim()) {
    toast.error('Debes escribir el cliente, institución o empresa');
    return;
}

        if (!form.espacioId) {
            toast.error('Debes seleccionar un espacio');
            return;
        }

        if (!form.fechaInicioEvento || !form.fechaFinEvento) {
            toast.error('Inicio y fin del evento son obligatorios');
            return;
        }

        try {
           if (modoEdicion) {
    await api.put(`/solicitudes/${solicitud.id}`, {
        ...form,
        clienteId: form.clienteId ? Number(form.clienteId) : null,
        espacioId: Number(form.espacioId),
        personas: form.personas ? Number(form.personas) : null,
        actividad: form.tipoEvento || form.nombreEvento || 'Evento'
    });
} else {
    await api.post('/solicitudes', {
        ...form,
        clienteId: form.clienteId ? Number(form.clienteId) : null,
        clienteNombre: busquedaCliente.trim(),
        clienteCedulaRuc: form.clienteCedulaRuc || null,
        espacioId: Number(form.espacioId),
        personas: form.personas ? Number(form.personas) : null,
        actividad: form.tipoEvento || form.nombreEvento || 'Evento'
    });
}
            toast.success('Solicitud creada correctamente');

            if (onCreated) {
                onCreated();
            }

            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear solicitud');
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">

                <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {modoEdicion
    ? 'Editar solicitud'
    : 'Nueva solicitud'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Registro completo de solicitud de espacio
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={guardarSolicitud} className="p-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div className="relative">
                            
                            <Input
                                placeholder="Cliente / Institución / Empresa / Organización *"
                                value={busquedaCliente}
                                onChange={(e) => {
                                    setBusquedaCliente(e.target.value);
                                    setMostrarResultadosCliente(true);
                                    setForm({
                                        ...form,
                                        clienteId: ''
                                    });
                                }}
                                onBlur={() => {
    setTimeout(() => {
        setMostrarResultadosCliente(false);
    }, 200);
}}
                                onFocus={() => setMostrarResultadosCliente(true)}
                                required
                            />


                            {mostrarResultadosCliente && busquedaCliente && (
                                <div className="absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto">
                                    {clientesFiltrados.map((cliente) => (
                                        <button
                                            type="button"
                                            key={cliente.id}
                                            onClick={() => seleccionarCliente(cliente)}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100"
                                        >
                                            <p className="font-medium text-gray-900">
                                                {cliente.nombre}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {cliente.cedulaRuc || 'Sin cédula/RUC'}
                                            </p>
                                        </button>
                                    ))}

                                    {clientesFiltrados.length === 0 && (
    <button
        type="button"
        onClick={() => setMostrarResultadosCliente(false)}
        className="w-full text-left px-3 py-3 text-sm text-gray-500 hover:bg-gray-50"
    >
        No se encontraron clientes. Se creará uno nuevo.
    </button>
)}
                                </div>
                            )}
                        </div>

                              <Input
    name="clienteCedulaRuc"
    placeholder="RUC / Cédula del cliente"
    value={form.clienteCedulaRuc}
    onChange={cambiar}
/>

                        <Input
                            name="nombreEvento"
                            placeholder="Nombre del Evento *"
                            value={form.nombreEvento}
                            onChange={cambiar}
                            required
                        />

                        <Input
                            name="contactoResponsable"
                            placeholder="Contacto Responsable"
                            value={form.contactoResponsable}
                            onChange={cambiar}
                        />

                        <Input
                            name="celular"
                            placeholder="Celular"
                            value={form.celular}
                            onChange={cambiar}
                        />

                        <Input
                            name="correo"
                            type="email"
                            placeholder="Correo Electrónico"
                            value={form.correo}
                            onChange={cambiar}
                        />

                        <Select
                            name="espacioId"
                            value={form.espacioId}
                            onChange={cambiar}
                            required
                        >
                            <option value="">Espacio *</option>

                            {Object.entries(espaciosAgrupados).map(([categoria, lista]) => (
                                <optgroup key={categoria} label={mostrarCategoria(categoria)}>
                                    {lista.map((espacio) => (
                                        <option key={espacio.id} value={espacio.id}>
                                            {espacio.nombre}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </Select>

                        {espacioSeleccionado && (
    <div className="xl:col-span-3 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-900">
                Información del espacio
            </h3>
            <p className="text-xs text-gray-500">
                {espacioSeleccionado.nombre}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <InfoEspacio
                label="Capacidad"
                value={`${espacioSeleccionado.capacidad || 0} personas`}
            />

            <InfoEspacio
                label="Tarifa función"
                value={`B/. ${Number(espacioSeleccionado.precioEvento || 0).toFixed(2)}`}
            />

            <InfoEspacio
                label="Tarifa montaje"
                value={`B/. ${Number(espacioSeleccionado.precioMontaje || 0).toFixed(2)}`}
            />

            <InfoEspacio
                label="Tarifa cerrado"
                value={`B/. ${Number(espacioSeleccionado.precioCerrado || 0).toFixed(2)}`}
            />

            <InfoEspacio
                label="Límite de póliza"
                value={`B/. ${Number(espacioSeleccionado.limitePoliza || 0).toFixed(2)}`}
            />

            <InfoEspacio
                label="Requisitos"
                value={espacioSeleccionado.textoPoliza || 'Sin requisitos'}
            />
        </div>

        {(espacioSeleccionado.imagenArchivo || espacioSeleccionado.planoArchivo) && (
            <div className="border-t border-gray-200 p-4 flex flex-wrap gap-66 items-center">
                {espacioSeleccionado.imagenArchivo && (
                    <img
                        src={`http://localhost:3000${espacioSeleccionado.imagenArchivo}`}
                        alt={espacioSeleccionado.nombre}
                        className="h-60 w-80 rounded-lg border border-gray-200 object-cover"
                    />
                )}

                
{espacioSeleccionado.planoArchivo && (
  <a
    href={`http://localhost:3000${espacioSeleccionado.planoArchivo}`}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
               bg-blue-50 text-blue-700 border border-blue-200
               hover:bg-blue-100 hover:text-blue-800
               transition-all duration-200
               text-sm font-medium shadow-sm"
  >
    <ArrowDownTrayIcon className="w-5 h-5" />
    Ver / descargar plano
  </a>
)}

            </div>
        )}
    </div>
)}

                        <Select
                            name="modalidadCosto"
                            value={form.modalidadCosto}
                            onChange={cambiar}
                        >
                            <option value="ESTANDAR">Estándar — Precio regular</option>
                            <option value="CONVENIO">Convenio / Acuerdo — Costo negociado</option>
                            <option value="ESCUELA_CDLA">Escuela CDLA — Sin costo interno</option>
                            <option value="GRATUITO">Gratuito — Sin costo especial</option>
                        </Select>

                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                            <p className="text-xs text-green-700 font-semibold">
                                Costo estimado
                            </p>
                            <p className="text-2xl font-bold text-green-900">
                                B/. {Number(costoEstimado).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <h3 className="text-md font-semibold text-gray-900 mt-6 mb-3">
                        Fechas del evento
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <CampoFecha
                            label="Inicio de montaje *"
                            name="fechaInicioMontaje"
                            value={form.fechaInicioMontaje}
                            onChange={cambiar}
                            required
                        />

                        <CampoFecha
                            label="Fin de montaje *"
                            name="fechaFinMontaje"
                            value={form.fechaFinMontaje}
                            onChange={cambiar}
                            required
                        />

                        <CampoFecha
                            label="Inicio del evento *"
                            name="fechaInicioEvento"
                            value={form.fechaInicioEvento}
                            onChange={cambiar}
                            required
                        />

                        <CampoFecha
                            label="Finalización del evento *"
                            name="fechaFinEvento"
                            value={form.fechaFinEvento}
                            onChange={cambiar}
                            required
                        />

                        <CampoFecha
                            label="Inicio de desmontaje *"
                            name="fechaInicioDesmontaje"
                            value={form.fechaInicioDesmontaje}
                            onChange={cambiar}
                            required
                        />

                        <CampoFecha
                            label="Fin de desmontaje *"
                            name="fechaFinDesmontaje"
                            value={form.fechaFinDesmontaje}
                            onChange={cambiar}
                            required
                        />

                        <CampoFecha
                            label="Inicio de cierre del espacio"
                            name="fechaInicioCerrado"
                            value={form.fechaInicioCerrado}
                            onChange={cambiar}
                        />

                        <CampoFecha
                            label="Fin de cierre del espacio"
                            name="fechaFinCerrado"
                            value={form.fechaFinCerrado}
                            onChange={cambiar}
                        />
                    </div>

                    <h3 className="text-md font-semibold text-gray-900 mt-6 mb-3">
                        Información adicional
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <Input
                            name="tipoEvento"
                            placeholder="Tipo de Evento ( Taller, presentación... )"
                            value={form.tipoEvento}
                            onChange={cambiar}
                        />

                        <Input
                            name="personas"
                            type="number"
                            placeholder="Cantidad de Personas"
                            value={form.personas}
                            onChange={cambiar}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Agendado por
                            </label>

                            <Input
                                name="agendadoPor"
                                value={form.agendadoPor}
                                onChange={cambiar}
                                readOnly
                                className="bg-gray-100"
                            />
                        </div>


                        <div className="md:col-span-2 xl:col-span-3">
                            <Textarea
                                name="observaciones"
                                placeholder="Observaciones / Documentación adicional"
                                value={form.observaciones}
                                onChange={cambiar}
                            />
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-6 pt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>

                        <Button type="submit">
                            {modoEdicion
    ? 'Actualizar solicitud'
    : 'Guardar solicitud'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CampoFecha({ label, name, value, onChange, required = false }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>

            <Input
                type="datetime-local"
                name={name}
                value={value}
                onChange={onChange}
                required={required}
            />
        </div>
    );
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

function InfoEspacio({ label, value }) {
    return (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-500 mb-1">
                {label}
            </p>
            <p className="text-sm font-semibold text-gray-900">
                {value || 'N/A'}
            </p>
        </div>
    );
}