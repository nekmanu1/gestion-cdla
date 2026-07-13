import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import {
    AdjustmentsHorizontalIcon,
    ArrowPathIcon,
    BuildingOffice2Icon,
    CheckCircleIcon,
    DocumentTextIcon,
    IdentificationIcon,
    PaintBrushIcon,
    QueueListIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';

import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';

const FORM_INICIAL = {
    nombre: '',
    correo: '',
    telefono: '',
    direccion: '',
    moneda: 'USD',
    logoUrl: '',

    ruc: '',
    sitioWeb: '',
    nombreComercial: '',
    representanteLegal: '',

    prefijoSolicitud: 'SOL',
    prefijoFactura: 'FAC',
    prefijoReserva: 'RES',

    notaFactura: '',
    terminosFactura: '',
    mensajeReportes: '',

    colorPrincipal: '#111827'
};

const SECCIONES = [
    {
        id: 'general',
        nombre: 'General',
        descripcion: 'Información principal',
        icono: AdjustmentsHorizontalIcon
    },
    {
        id: 'institucion',
        nombre: 'Institución',
        descripcion: 'Datos legales y contacto',
        icono: BuildingOffice2Icon
    },
    {
        id: 'documentos',
        nombre: 'Documentos',
        descripcion: 'Facturas y reportes',
        icono: DocumentTextIcon
    },
    {
        id: 'numeracion',
        nombre: 'Numeración',
        descripcion: 'Prefijos del sistema',
        icono: QueueListIcon
    },
    {
        id: 'apariencia',
        nombre: 'Apariencia',
        descripcion: 'Logo y color principal',
        icono: PaintBrushIcon
    }
];

export default function Configuracion() {
    const [form, setForm] = useState(FORM_INICIAL);
    const [seccionActiva, setSeccionActiva] = useState('general');

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [cambiosPendientes, setCambiosPendientes] = useState(false);

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const seccionActual = useMemo(
        () =>
            SECCIONES.find(
                (seccion) => seccion.id === seccionActiva
            ),
        [seccionActiva]
    );

    async function cargarConfiguracion() {
        try {
            setCargando(true);

            const response = await api.get('/configuracion');
            const datos = response.data || {};

            setForm({
                nombre: datos.nombre || '',
                correo: datos.correo || '',
                telefono: datos.telefono || '',
                direccion: datos.direccion || '',
                moneda: datos.moneda || 'USD',
                logoUrl: datos.logoUrl || '',

                ruc: datos.ruc || '',
                sitioWeb: datos.sitioWeb || '',
                nombreComercial: datos.nombreComercial || '',
                representanteLegal:
                    datos.representanteLegal || '',

                prefijoSolicitud:
                    datos.prefijoSolicitud || 'SOL',
                prefijoFactura:
                    datos.prefijoFactura || 'FAC',
                prefijoReserva:
                    datos.prefijoReserva || 'RES',

                notaFactura: datos.notaFactura || '',
                terminosFactura:
                    datos.terminosFactura || '',
                mensajeReportes:
                    datos.mensajeReportes || '',

                colorPrincipal:
                    datos.colorPrincipal || '#111827'
            });

            setCambiosPendientes(false);
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message ||
                'Error al cargar la configuración'
            );
        } finally {
            setCargando(false);
        }
    }

    function cambiar(e) {
        const { name, value } = e.target;

        setForm((actual) => ({
            ...actual,
            [name]: value
        }));

        setCambiosPendientes(true);
    }

    async function guardarConfiguracion(e) {
        e.preventDefault();

        if (!form.nombre.trim()) {
            toast.error(
                'El nombre de la institución es obligatorio'
            );

            setSeccionActiva('general');
            return;
        }

        try {
            setGuardando(true);

            const response = await api.put(
                '/configuracion',
                {
                    ...form,
                    nombre: form.nombre.trim(),
                    correo: form.correo.trim(),
                    telefono: form.telefono.trim(),
                    direccion: form.direccion.trim(),
                    sitioWeb: form.sitioWeb.trim(),
                    ruc: form.ruc.trim(),
                    nombreComercial:
                        form.nombreComercial.trim(),
                    representanteLegal:
                        form.representanteLegal.trim(),
                    prefijoSolicitud:
                        form.prefijoSolicitud.trim().toUpperCase(),
                    prefijoFactura:
                        form.prefijoFactura.trim().toUpperCase(),
                    prefijoReserva:
                        form.prefijoReserva.trim().toUpperCase()
                }
            );

            if (response.data?.configuracion) {
                setForm((actual) => ({
                    ...actual,
                    ...response.data.configuracion
                }));
            }

            setCambiosPendientes(false);

            toast.success(
                response.data?.message ||
                'Configuración guardada correctamente'
            );
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message ||
                'Error al guardar la configuración'
            );
        } finally {
            setGuardando(false);
        }
    }

    async function restablecerCambios() {
        await cargarConfiguracion();

        toast.success(
            'Se restauró la configuración guardada'
        );
    }

    if (cargando) {
        return (
            <div>
                <PageHeader
                    title="Configuración"
                    subtitle="Administración general del sistema"
                />

                <Card className="p-10 text-center text-gray-500">
                    Cargando configuración...
                </Card>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Configuración"
                subtitle="Administra la información institucional, documentos y apariencia del sistema"
            />

            <form onSubmit={guardarConfiguracion}>
                <Card className="overflow-hidden">
                    <div className="grid min-h-[610px] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)]">

                        {/* MENÚ LATERAL */}
                        <aside className="border-b border-gray-200 bg-gray-50 p-4 lg:border-b-0 lg:border-r">
                            <div className="mb-5 px-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Configuración
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    Preferencias del sistema
                                </p>
                            </div>

                            <nav className="space-y-1">
                                {SECCIONES.map((seccion) => {
                                    const Icono = seccion.icono;
                                    const activa =
                                        seccionActiva === seccion.id;

                                    return (
                                        <button
                                            key={seccion.id}
                                            type="button"
                                            onClick={() =>
                                                setSeccionActiva(
                                                    seccion.id
                                                )
                                            }
                                            className={`
                                                relative flex w-full items-center gap-3
                                                rounded-xl px-3 py-3 text-left
                                                transition
                                                ${
                                                    activa
                                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                                }
                                            `}
                                        >
                                            {activa && (
                                                <span
                                                    className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full"
                                                    style={{
                                                        backgroundColor:
                                                            form.colorPrincipal
                                                    }}
                                                />
                                            )}

                                            <span
                                                className={`
                                                    flex h-9 w-9 shrink-0 items-center
                                                    justify-center rounded-lg
                                                    ${
                                                        activa
                                                            ? 'bg-gray-100'
                                                            : 'bg-transparent'
                                                    }
                                                `}
                                            >
                                                <Icono className="h-5 w-5" />
                                            </span>

                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold">
                                                    {seccion.nombre}
                                                </span>

                                                <span className="block truncate text-xs text-gray-400">
                                                    {seccion.descripcion}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon className="h-5 w-5 text-green-600" />

                                    <span className="text-sm font-semibold text-gray-800">
                                        Estado
                                    </span>
                                </div>

                                <p className="mt-2 text-xs leading-5 text-gray-500">
                                    {cambiosPendientes
                                        ? 'Existen cambios pendientes por guardar.'
                                        : 'La configuración está actualizada.'}
                                </p>
                            </div>
                        </aside>

                        {/* CONTENIDO */}
                        <section className="min-w-0 bg-white">
                            <div className="border-b border-gray-200 px-6 py-5 lg:px-8">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                                        style={{
                                            backgroundColor:
                                                form.colorPrincipal
                                        }}
                                    >
                                        {seccionActual && (
                                            <seccionActual.icono className="h-6 w-6" />
                                        )}
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {seccionActual?.nombre}
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {obtenerDescripcionSeccion(
                                                seccionActiva
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 lg:p-8">
                                {seccionActiva === 'general' && (
                                    <SeccionGeneral
                                        form={form}
                                        cambiar={cambiar}
                                    />
                                )}

                                {seccionActiva ===
                                    'institucion' && (
                                    <SeccionInstitucion
                                        form={form}
                                        cambiar={cambiar}
                                    />
                                )}

                                {seccionActiva ===
                                    'documentos' && (
                                    <SeccionDocumentos
                                        form={form}
                                        cambiar={cambiar}
                                    />
                                )}

                                {seccionActiva ===
                                    'numeracion' && (
                                    <SeccionNumeracion
                                        form={form}
                                        cambiar={cambiar}
                                    />
                                )}

                                {seccionActiva ===
                                    'apariencia' && (
                                    <SeccionApariencia
                                        form={form}
                                        cambiar={cambiar}
                                    />
                                )}
                            </div>

                            {/* BARRA INFERIOR */}
                            <div className="sticky bottom-0 flex flex-col gap-3 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:px-8">
                                <div className="text-sm">
                                    {cambiosPendientes ? (
                                        <span className="font-medium text-amber-700">
                                            Hay cambios sin guardar
                                        </span>
                                    ) : (
                                        <span className="text-gray-500">
                                            Todos los cambios están guardados
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={restablecerCambios}
                                        disabled={
                                            guardando ||
                                            !cambiosPendientes
                                        }
                                        className="gap-2"
                                    >
                                        <ArrowPathIcon className="h-4 w-4" />
                                        Descartar
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={
                                            guardando ||
                                            !cambiosPendientes
                                        }
                                        className="gap-2 px-6"
                                    >
                                        <CheckCircleIcon className="h-5 w-5" />

                                        {guardando
                                            ? 'Guardando...'
                                            : 'Guardar cambios'}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </Card>
            </form>
        </div>
    );
}

/* =========================================================
   GENERAL
========================================================= */

function SeccionGeneral({ form, cambiar }) {
    return (
        <div className="space-y-7">
            <GrupoConfiguracion
                icono={BuildingOffice2Icon}
                titulo="Información principal"
                descripcion="Nombre y datos generales utilizados en el sistema."
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Campo
                        etiqueta="Nombre de la institución"
                        requerido
                    >
                        <Input
                            name="nombre"
                            value={form.nombre}
                            onChange={cambiar}
                            placeholder="Ciudad de las Artes"
                            required
                        />
                    </Campo>

                    <Campo etiqueta="Nombre comercial">
                        <Input
                            name="nombreComercial"
                            value={form.nombreComercial}
                            onChange={cambiar}
                            placeholder="Nombre comercial"
                        />
                    </Campo>

                    <Campo etiqueta="Moneda del sistema">
                        <Select
                            name="moneda"
                            value={form.moneda}
                            onChange={cambiar}
                        >
                            <option value="USD">
                                USD — Dólar estadounidense
                            </option>

                            <option value="PAB">
                                PAB — Balboa panameño
                            </option>
                        </Select>
                    </Campo>

                    <Campo etiqueta="Sitio web">
                        <Input
                            name="sitioWeb"
                            type="url"
                            value={form.sitioWeb}
                            onChange={cambiar}
                            placeholder="https://www.ejemplo.gob.pa"
                        />
                    </Campo>
                </div>
            </GrupoConfiguracion>
        </div>
    );
}

/* =========================================================
   INSTITUCIÓN
========================================================= */

function SeccionInstitucion({ form, cambiar }) {
    return (
        <div className="space-y-7">
            <GrupoConfiguracion
                icono={IdentificationIcon}
                titulo="Identificación legal"
                descripcion="Información utilizada en facturas y documentos institucionales."
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Campo etiqueta="RUC o identificación fiscal">
                        <Input
                            name="ruc"
                            value={form.ruc}
                            onChange={cambiar}
                            placeholder="RUC"
                        />
                    </Campo>

                    <Campo etiqueta="Representante legal">
                        <Input
                            name="representanteLegal"
                            value={form.representanteLegal}
                            onChange={cambiar}
                            placeholder="Nombre del representante"
                        />
                    </Campo>
                </div>
            </GrupoConfiguracion>

            <GrupoConfiguracion
                icono={UserCircleIcon}
                titulo="Información de contacto"
                descripcion="Datos oficiales de contacto de la institución."
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Campo etiqueta="Correo institucional">
                        <Input
                            name="correo"
                            type="email"
                            value={form.correo}
                            onChange={cambiar}
                            placeholder="correo@institucion.gob.pa"
                        />
                    </Campo>

                    <Campo etiqueta="Teléfono">
                        <Input
                            name="telefono"
                            value={form.telefono}
                            onChange={cambiar}
                            placeholder="+507 000-0000"
                        />
                    </Campo>

                    <div className="md:col-span-2">
                        <Campo etiqueta="Dirección">
                            <Input
                                name="direccion"
                                value={form.direccion}
                                onChange={cambiar}
                                placeholder="Dirección institucional"
                            />
                        </Campo>
                    </div>
                </div>
            </GrupoConfiguracion>
        </div>
    );
}

/* =========================================================
   DOCUMENTOS
========================================================= */

function SeccionDocumentos({ form, cambiar }) {
    return (
        <div className="space-y-7">
            <GrupoConfiguracion
                icono={DocumentTextIcon}
                titulo="Facturación"
                descripcion="Textos que se mostrarán en las facturas generadas por el sistema."
            >
                <div className="space-y-5">
                    <Campo etiqueta="Nota de factura">
                        <Textarea
                            name="notaFactura"
                            value={form.notaFactura}
                            onChange={cambiar}
                            placeholder="Mensaje adicional que aparecerá en la factura"
                            rows={4}
                        />
                    </Campo>

                    <Campo etiqueta="Términos y condiciones">
                        <Textarea
                            name="terminosFactura"
                            value={form.terminosFactura}
                            onChange={cambiar}
                            placeholder="Términos aplicables a las facturas"
                            rows={5}
                        />
                    </Campo>
                </div>
            </GrupoConfiguracion>

            <GrupoConfiguracion
                icono={DocumentTextIcon}
                titulo="Reportes institucionales"
                descripcion="Texto informativo utilizado en los reportes PDF."
            >
                <Campo etiqueta="Mensaje para reportes">
                    <Textarea
                        name="mensajeReportes"
                        value={form.mensajeReportes}
                        onChange={cambiar}
                        placeholder="Mensaje o nota institucional para los reportes"
                        rows={4}
                    />
                </Campo>
            </GrupoConfiguracion>
        </div>
    );
}

/* =========================================================
   NUMERACIÓN
========================================================= */

function SeccionNumeracion({ form, cambiar }) {
    return (
        <div className="space-y-7">
            <GrupoConfiguracion
                icono={QueueListIcon}
                titulo="Prefijos de documentos"
                descripcion="Identificadores utilizados al crear códigos de solicitudes, facturas y reservas."
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <Campo
                        etiqueta="Solicitudes"
                        ayuda={`Ejemplo: ${form.prefijoSolicitud || 'SOL'}-2026-123456`}
                    >
                        <Input
                            name="prefijoSolicitud"
                            value={form.prefijoSolicitud}
                            onChange={cambiar}
                            maxLength={8}
                            placeholder="SOL"
                        />
                    </Campo>

                    <Campo
                        etiqueta="Facturas"
                        ayuda={`Ejemplo: ${form.prefijoFactura || 'FAC'}-2026-123456`}
                    >
                        <Input
                            name="prefijoFactura"
                            value={form.prefijoFactura}
                            onChange={cambiar}
                            maxLength={8}
                            placeholder="FAC"
                        />
                    </Campo>

                    <Campo
                        etiqueta="Reservas"
                        ayuda={`Ejemplo: ${form.prefijoReserva || 'RES'}-2026-123456`}
                    >
                        <Input
                            name="prefijoReserva"
                            value={form.prefijoReserva}
                            onChange={cambiar}
                            maxLength={8}
                            placeholder="RES"
                        />
                    </Campo>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Los cambios de prefijo se aplican únicamente a los
                    documentos nuevos. Los códigos existentes no se
                    modificarán.
                </div>
            </GrupoConfiguracion>
        </div>
    );
}

/* =========================================================
   APARIENCIA
========================================================= */

function SeccionApariencia({ form, cambiar }) {
    return (
        <div className="space-y-7">
            <GrupoConfiguracion
                icono={PaintBrushIcon}
                titulo="Identidad visual"
                descripcion="Personaliza el logo y el color principal usado por el sistema."
            >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-5">
                        <Campo etiqueta="URL del logo">
                            <Input
                                name="logoUrl"
                                type="url"
                                value={form.logoUrl}
                                onChange={cambiar}
                                placeholder="https://dominio.com/logo.png"
                            />
                        </Campo>

                        <Campo etiqueta="Color principal">
                            <div className="flex items-center gap-3">
                                <Input
                                    name="colorPrincipal"
                                    type="color"
                                    value={form.colorPrincipal}
                                    onChange={cambiar}
                                    className="h-12 w-20 cursor-pointer p-1"
                                />

                                <Input
                                    name="colorPrincipal"
                                    value={form.colorPrincipal}
                                    onChange={cambiar}
                                    placeholder="#111827"
                                    className="flex-1"
                                />
                            </div>
                        </Campo>
                    </div>

                    <div>
                        <p className="mb-2 text-sm font-semibold text-gray-700">
                            Vista previa
                        </p>

                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                            <div
                                className="flex min-h-32 items-center justify-center p-6"
                                style={{
                                    backgroundColor:
                                        form.colorPrincipal
                                }}
                            >
                                {form.logoUrl ? (
                                    <img
                                        src={form.logoUrl}
                                        alt="Logo institucional"
                                        className="max-h-20 max-w-full rounded-lg bg-white p-2 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                'none';
                                        }}
                                    />
                                ) : (
                                    <BuildingOffice2Icon className="h-14 w-14 text-white/80" />
                                )}
                            </div>

                            <div className="bg-white p-4">
                                <p className="font-bold text-gray-900">
                                    {form.nombre ||
                                        'Nombre de la institución'}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    {form.nombreComercial ||
                                        'Sistema institucional'}
                                </p>

                                <button
                                    type="button"
                                    className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                                    style={{
                                        backgroundColor:
                                            form.colorPrincipal
                                    }}
                                >
                                    Botón de ejemplo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </GrupoConfiguracion>
        </div>
    );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function GrupoConfiguracion({
    icono: Icono,
    titulo,
    descripcion,
    children
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
            <div className="mb-6 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <h3 className="font-bold text-gray-900">
                        {titulo}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        {descripcion}
                    </p>
                </div>
            </div>

            {children}
        </div>
    );
}

function Campo({
    etiqueta,
    ayuda,
    requerido = false,
    children
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-gray-700">
                {etiqueta}

                {requerido && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </span>

            {children}

            {ayuda && (
                <span className="mt-2 block text-xs text-gray-400">
                    {ayuda}
                </span>
            )}
        </label>
    );
}

function obtenerDescripcionSeccion(seccion) {
    const descripciones = {
        general:
            'Administra las preferencias generales y la información principal del sistema.',

        institucion:
            'Configura los datos legales, fiscales y de contacto de la institución.',

        documentos:
            'Personaliza los textos utilizados en facturas y reportes PDF.',

        numeracion:
            'Define los prefijos utilizados al generar nuevos documentos.',

        apariencia:
            'Configura el logo institucional y el color principal del sistema.'
    };

    return descripciones[seccion] || '';
}