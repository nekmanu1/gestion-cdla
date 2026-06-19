import { useEffect, useState } from 'react';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import toast from 'react-hot-toast';

export default function Configuracion() {
    const [form, setForm] = useState({
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
    });

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    async function cargarConfiguracion() {
        try {
            const response = await api.get('/configuracion');

            setForm({
                nombre: response.data.nombre || '',
                correo: response.data.correo || '',
                telefono: response.data.telefono || '',
                direccion: response.data.direccion || '',
                moneda: response.data.moneda || 'USD',
                logoUrl: response.data.logoUrl || '',

                ruc: response.data.ruc || '',
                sitioWeb: response.data.sitioWeb || '',
                nombreComercial: response.data.nombreComercial || '',
                representanteLegal: response.data.representanteLegal || '',

                prefijoSolicitud: response.data.prefijoSolicitud || 'SOL',
                prefijoFactura: response.data.prefijoFactura || 'FAC',
                prefijoReserva: response.data.prefijoReserva || 'RES',

                notaFactura: response.data.notaFactura || '',
                terminosFactura: response.data.terminosFactura || '',
                mensajeReportes: response.data.mensajeReportes || '',

                colorPrincipal: response.data.colorPrincipal || '#111827'
            });
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar configuración');
        }
    }

    function cambiar(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    async function guardarConfiguracion(e) {
        e.preventDefault();

        try {
            await api.put('/configuracion', form);
            toast.success('Configuración guardada correctamente');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al guardar configuración');
        }
    }

    return (
        <div>
            <PageHeader
                title="Configuración"
                subtitle="Datos generales, facturación, reportes y personalización del sistema"
            />

            <form onSubmit={guardarConfiguracion} className="space-y-6">
                <Card className="p-6">
                    <SectionTitle
                        title="Datos institucionales"
                        description="Información principal que se puede usar en reportes y documentos."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            name="nombre"
                            placeholder="Nombre de la institución"
                            value={form.nombre}
                            onChange={cambiar}
                            required
                        />

                        <Input
                            name="nombreComercial"
                            placeholder="Nombre comercial"
                            value={form.nombreComercial}
                            onChange={cambiar}
                        />

                        <Input
                            name="correo"
                            placeholder="Correo institucional"
                            value={form.correo}
                            onChange={cambiar}
                        />

                        <Input
                            name="telefono"
                            placeholder="Teléfono"
                            value={form.telefono}
                            onChange={cambiar}
                        />

                        <Input
                            name="direccion"
                            placeholder="Dirección"
                            value={form.direccion}
                            onChange={cambiar}
                        />

                        <Input
                            name="sitioWeb"
                            placeholder="Sitio web"
                            value={form.sitioWeb}
                            onChange={cambiar}
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <SectionTitle
                        title="Identificación fiscal y legal"
                        description="Datos que pueden mostrarse en facturas, documentos y encabezados."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            name="ruc"
                            placeholder="RUC / Identificación fiscal"
                            value={form.ruc}
                            onChange={cambiar}
                        />

                        <Input
                            name="representanteLegal"
                            placeholder="Representante legal"
                            value={form.representanteLegal}
                            onChange={cambiar}
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <SectionTitle
                        title="Numeración y prefijos"
                        description="Prefijos utilizados para identificar solicitudes, facturas y reservas."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            name="prefijoSolicitud"
                            placeholder="Prefijo solicitud"
                            value={form.prefijoSolicitud}
                            onChange={cambiar}
                        />

                        <Input
                            name="prefijoFactura"
                            placeholder="Prefijo factura"
                            value={form.prefijoFactura}
                            onChange={cambiar}
                        />

                        <Input
                            name="prefijoReserva"
                            placeholder="Prefijo reserva"
                            value={form.prefijoReserva}
                            onChange={cambiar}
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <SectionTitle
                        title="Facturación y reportes"
                        description="Textos institucionales que pueden aparecer en facturas y reportes PDF."
                    />

                    <div className="grid grid-cols-1 gap-4">
                        <Textarea
                            name="notaFactura"
                            placeholder="Nota de factura"
                            value={form.notaFactura}
                            onChange={cambiar}
                        />

                        <Textarea
                            name="terminosFactura"
                            placeholder="Términos y condiciones de factura"
                            value={form.terminosFactura}
                            onChange={cambiar}
                        />

                        <Textarea
                            name="mensajeReportes"
                            placeholder="Mensaje para reportes"
                            value={form.mensajeReportes}
                            onChange={cambiar}
                        />
                    </div>
                </Card>

                <Card className="p-6">
                    <SectionTitle
                        title="Personalización"
                        description="Logo, moneda y color principal del sistema."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            name="moneda"
                            value={form.moneda}
                            onChange={cambiar}
                        >
                            <option value="USD">USD</option>
                            <option value="PAB">PAB</option>
                        </Select>

                        <Input
                            name="logoUrl"
                            placeholder="URL del logo"
                            value={form.logoUrl}
                            onChange={cambiar}
                        />

                        <Input
                            name="colorPrincipal"
                            type="color"
                            value={form.colorPrincipal}
                            onChange={cambiar}
                        />
                    </div>

                    {form.logoUrl && (
                        <div className="mt-5">
                            <p className="text-sm text-gray-500 mb-2">
                                Vista previa del logo:
                            </p>

                            <img
                                src={form.logoUrl}
                                alt="Logo institucional"
                                className="h-20 border border-gray-200 rounded-lg p-2 bg-white"
                            />
                        </div>
                    )}
                </Card>

                <div className="flex justify-end">
                    <Button type="submit">
                        Guardar configuración
                    </Button>
                </div>
            </form>
        </div>
    );
}

function SectionTitle({ title, description }) {
    return (
        <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
                {title}
            </h2>

            <p className="text-sm text-gray-500">
                {description}
            </p>
        </div>
    );
}