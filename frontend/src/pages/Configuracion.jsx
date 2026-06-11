import { useEffect, useState } from 'react';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import toast from 'react-hot-toast';

export default function Configuracion() {
    const [form, setForm] = useState({
        nombre: '',
        correo: '',
        telefono: '',
        direccion: '',
        moneda: 'USD',
        logoUrl: ''
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
            logoUrl: response.data.logoUrl || ''
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
                subtitle="Datos institucionales del sistema"
            />

            

            <Card className="p-6">
                <form onSubmit={guardarConfiguracion}>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Información institucional
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            name="nombre"
                            placeholder="Nombre de la institución"
                            value={form.nombre}
                            onChange={cambiar}
                            required
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

                    <div className="mt-6">
                        <Button type="submit">
                            Guardar configuración
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}