import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';


import Table, { Th, Td } from '../components/ui/Table';

import {
    PhotoIcon,
    DocumentArrowUpIcon,
    EyeIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

export default function Espacios() {
    const [espacios, setEspacios] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [editandoId, setEditandoId] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [imagen, setImagen] = useState(null);
    const [plano, setPlano] = useState(null);
    const [espacioDetalle, setEspacioDetalle] = useState(null);

   

    const [form, setForm] = useState({
        nombre: '',
        categoria: 'SALONES',
        capacidad: '',
        ubicacion: '',
        estado: 'DISPONIBLE',
        descripcion: '',
        precioMontaje: '',
        precioEvento: '',
        precioDesmontaje: '',
        precioCerrado: '',
         limitePoliza: '',
    textoPoliza: '',
    especificaciones: ''
    });

    useEffect(() => {
        cargarEspacios();
    }, []);

    async function cargarEspacios() {
        try {
            const response = await api.get('/espacios');
            setEspacios(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar espacios');
        }
      
    }

    async function buscarEspacios() {
        try {
            const response = await api.get(`/espacios?buscar=${buscar}`);
            setEspacios(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al buscar espacios');
        }
    }

    function cambiar(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    }

    function limpiarFormulario() {
        setEditandoId(null);

        setForm({
    nombre: '',
    categoria: 'SALONES',
    capacidad: '',
    ubicacion: '',
    estado: 'DISPONIBLE',
    descripcion: '',
    precioMontaje: '',
    precioEvento: '',
    precioDesmontaje: '',
    precioCerrado: '',
    limitePoliza: '',
    textoPoliza: '',
    especificaciones: ''
});
        setImagen(null);
        setPlano(null);
       
    }
    
    async function guardarEspacio(e) {
    e.preventDefault();

    try {
        const data = new FormData();

        data.append('nombre', form.nombre);
        data.append('categoria', form.categoria);
        data.append('capacidad', form.capacidad || '');
        data.append('ubicacion', form.ubicacion || '');
        data.append('estado', form.estado);
        data.append('descripcion', form.descripcion || '');

        data.append('precioMontaje', form.precioMontaje || 0);
        data.append('precioEvento', form.precioEvento || 0);
        data.append('precioDesmontaje', form.precioDesmontaje || 0);
        data.append('precioCerrado', form.precioCerrado || 0);

        data.append('limitePoliza', form.limitePoliza || 0);
        data.append('textoPoliza', form.textoPoliza || '');
        data.append('especificaciones', form.especificaciones || '');

        if (imagen) data.append('imagen', imagen);
        if (plano) data.append('plano', plano);

        if (editandoId) {
            await api.put(`/espacios/${editandoId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Espacio actualizado correctamente');
        } else {
            await api.post('/espacios', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Espacio creado correctamente');
        }

        limpiarFormulario();
        setMostrarModal(false);
        cargarEspacios();
    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Error al guardar espacio');
    }
}

    function editarEspacio(espacio) {
        setEditandoId(espacio.id);

        setForm({
    nombre: espacio.nombre || '',
    categoria: espacio.categoria || 'SALONES',
    capacidad: espacio.capacidad || '',
    ubicacion: espacio.ubicacion || '',
    estado: espacio.estado || 'DISPONIBLE',
    descripcion: espacio.descripcion || '',

    precioMontaje: espacio.precioMontaje || '',
    precioEvento: espacio.precioEvento || '',
    precioDesmontaje: espacio.precioDesmontaje || '',
    precioCerrado: espacio.precioCerrado || '',

    limitePoliza: espacio.limitePoliza || '',
    textoPoliza: espacio.textoPoliza || '',
    especificaciones: espacio.especificaciones || ''
});

        setMostrarModal(true);
    }

    async function eliminarEspacio(id) {
        if (!confirm('¿Deseas eliminar este espacio?')) return;

        try {
            await api.delete(`/espacios/${id}`);
            toast.success('Espacio eliminado correctamente');
            cargarEspacios();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al eliminar espacio');
        }
    }

    return (
        <div>
            <PageHeader
                title="Espacios"
                subtitle="Administración de espacios, categorías y tarifas"
            />
            <div className="mb-4 flex justify-end">
   <Button
    onClick={() => {
        limpiarFormulario();
        setMostrarModal(true);
    }}
>
    Nuevo espacio
</Button>
</div>
       

            <Card className="p-4 mb-6">
                <div className="flex flex-wrap gap-3">
                    <Input
                        placeholder="Buscar espacio..."
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                    />

                    <Button onClick={buscarEspacios}>
                        Buscar
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setBuscar('');
                            cargarEspacios();
                        }}
                    >
                        Ver todos
                    </Button>
                </div>
            </Card>

            <Table>
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <Th>ID</Th>
                        <Th>Nombre</Th>
                        <Th>Categoría</Th>
                        <Th>Capacidad</Th>
                        <Th>Montaje</Th>
                        <Th>Evento</Th>
                        <Th>Desmontaje</Th>
                        <Th>Cerrado</Th>
                        <Th>Acciones</Th>
                    </tr>
                </thead>

                <tbody>
                    {espacios.map((espacio) => (
                        <tr
                            key={espacio.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                        >
                            <Td>{espacio.id}</Td>

                            <Td className="font-medium text-gray-900">
                                {espacio.nombre}
                            </Td>

                            <Td>{mostrarCategoria(espacio.categoria)}</Td>
                            <Td>{espacio.capacidad || '-'}</Td>

                            

                            <Td className='text-right'>B/. {Number(espacio.precioMontaje || 0).toFixed(2)}</Td>
                            <Td className='text-right'>B/. {Number(espacio.precioEvento || 0).toFixed(2)}</Td>
                            <Td className='text-right'>B/. {Number(espacio.precioDesmontaje || 0).toFixed(2)}</Td>
                            <Td className='text-right'>B/. {Number(espacio.precioCerrado || 0).toFixed(2)}</Td>

                            <Td>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-2">
    
    <button
        title="Editar"
        onClick={() => editarEspacio(espacio)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-amber-50 transition"
    >
        <PencilSquareIcon className="w-5 h-5" />
    </button>

    <button
        title="Eliminar"
        onClick={() => eliminarEspacio(espacio.id)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
    >
        <TrashIcon className="w-5 h-5" />
    </button>

    <button
        title="Ver detalle"
        onClick={() => setEspacioDetalle(espacio)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 transition"
    >
        <EyeIcon className="w-5 h-5" />
    </button>

</div>
                                </div>
                            </Td>
                        </tr>
                    ))}

                    {espacios.length === 0 && (
                        <tr>
                            <td
                                colSpan="10"
                                className="px-4 py-8 text-center text-gray-500"
                            >
                                No hay espacios registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
{mostrarModal && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">

            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {editandoId ? 'Editar espacio' : 'Nuevo espacio'}
                    </h2>

                    <p className="text-sm text-gray-500">
                        Configuración de espacios y tarifas
                    </p>
                </div>

                <button
                    onClick={() => setMostrarModal(false)}
                    className="text-gray-500 hover:text-gray-900 text-xl"
                >
                    ×
                </button>
            </div>

            <form onSubmit={guardarEspacio} className="p-5">

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                    <Input
                        name="nombre"
                        placeholder="Nombre del espacio"
                        value={form.nombre}
                        onChange={cambiar}
                        required
                    />

                    <Select
                        name="categoria"
                        value={form.categoria}
                        onChange={cambiar}
                    >
                        <option value="SALONES">Salones</option>
                        <option value="TEATROS">Teatros</option>
                        <option value="ESPACIOS_EXTERIORES">Espacios exteriores</option>
                        <option value="RECORRIDOS">Recorridos</option>
                        <option value="GALERIA">Galería</option>
                    </Select>

                    <Input
                        name="capacidad"
                        type="number"
                        placeholder="Capacidad"
                        value={form.capacidad}
                        onChange={cambiar}
                    />

                    <Input
                        name="ubicacion"
                        placeholder="Ubicación"
                        value={form.ubicacion}
                        onChange={cambiar}
                    />

                    <Select
                        name="estado"
                        value={form.estado}
                        onChange={cambiar}
                    >
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="MANTENIMIENTO">Mantenimiento</option>
                        <option value="INACTIVO">Inactivo</option>
                    </Select>

                    <div></div>

                    <Input
                        name="precioMontaje"
                        type="number"
                        step="0.01"
                        placeholder="Precio montaje"
                        value={form.precioMontaje}
                        onChange={cambiar}
                    />

                    <Input
                        name="precioEvento"
                        type="number"
                        step="0.01"
                        placeholder="Precio evento"
                        value={form.precioEvento}
                        onChange={cambiar}
                    />

                    <Input
                        name="precioDesmontaje"
                        type="number"
                        step="0.01"
                        placeholder="Precio desmontaje"
                        value={form.precioDesmontaje}
                        onChange={cambiar}
                    />

                    <Input
                        name="precioCerrado"
                        type="number"
                        step="0.01"
                        placeholder="Precio cierre"
                        value={form.precioCerrado}
                        onChange={cambiar}
                    />

                    <div className="md:col-span-2 xl:col-span-3">
                        <Textarea
                            name="descripcion"
                            placeholder="Descripción"
                            value={form.descripcion}
                            onChange={cambiar}
                        />
                    </div>

            
<Input
    name="limitePoliza"
    type="number"
    step="0.01"
    placeholder="Límite de póliza"
    value={form.limitePoliza}
    onChange={cambiar}
/>

<Input
    name="textoPoliza"
    placeholder="Texto de póliza"
    value={form.textoPoliza}
    onChange={cambiar}
/>

<div className="md:col-span-2 xl:col-span-3">
    <Textarea
        name="especificaciones"
        placeholder="Especificaciones técnicas"
        value={form.especificaciones}
        onChange={cambiar}
    />
</div>

                <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
        Plano del espacio
    </label>

    <label className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm text-gray-700">
        <DocumentArrowUpIcon className="w-5 h-5" />

        {plano ? plano.name : 'Seleccionar plano'}

        <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => setPlano(e.target.files[0])}
        />
    </label>
</div>
<div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
        Imagen de referencia
    </label>

    <label className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm text-gray-700">
        <PhotoIcon className="w-5 h-5" />

        {imagen ? imagen.name : 'Seleccionar imagen'}

        <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImagen(e.target.files[0])}
        />
    </label>
</div>

                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setMostrarModal(false)}
                    >
                        Cancelar
                    </Button>

                    <Button type="submit">
                        {editandoId ? 'Actualizar' : 'Guardar'}
                    </Button>
                </div>

            </form>
        </div>
    </div>
)}

{espacioDetalle && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Detalle del espacio
                    </h2>
                    <p className="text-sm text-gray-500">
                        {espacioDetalle.nombre}
                    </p>
                </div>

                <button
                    onClick={() => setEspacioDetalle(null)}
                    className="text-gray-500 hover:text-gray-900 text-xl"
                >
                    ×
                </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <ResumenItem label="Categoría" value={mostrarCategoria(espacioDetalle.categoria)} />
                <ResumenItem label="Capacidad" value={espacioDetalle.capacidad} />
                <ResumenItem label="Ubicación" value={espacioDetalle.ubicacion} />         
                <ResumenItem label="Tarifa montaje" value={`B/. ${formatearMonto(espacioDetalle.precioMontaje)}`} />
                <ResumenItem label="Tarifa evento" value={`B/. ${formatearMonto(espacioDetalle.precioEvento)}`} />
                <ResumenItem label="Tarifa desmontaje" value={`B/. ${formatearMonto(espacioDetalle.precioDesmontaje)}`} />
                <ResumenItem label="Tarifa cierre" value={`B/. ${formatearMonto(espacioDetalle.precioCerrado)}`} />
                <ResumenItem label="Límite de póliza" value={`B/. ${formatearMonto(espacioDetalle.limitePoliza)}`} />
                <ResumenItem label="Texto de póliza" value={espacioDetalle.textoPoliza} />

                <div className="md:col-span-2">
                    <ResumenItem label="Especificaciones" value={espacioDetalle.especificaciones} />
                </div>

                <div className="md:col-span-2">
                    <ResumenItem label="Descripción" value={espacioDetalle.descripcion} />
                </div>

                {espacioDetalle.imagenArchivo && (
                    <div className="md:col-span-2">
                        <p className="font-semibold mb-2">Imagen de referencia</p>
                        <img
                            src={`http://localhost:3000${espacioDetalle.imagenArchivo}`}
                            alt={espacioDetalle.nombre}
                            className="max-h-72 rounded-lg border object-cover"
                        />

                        <a
                            href={`http://localhost:3000${espacioDetalle.imagenArchivo}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-2 text-blue-600 hover:underline"
                        >
                            Descargar imagen
                        </a>
                    </div>
                )}

                {espacioDetalle.planoArchivo && (
                    <div className="md:col-span-2">
                        <p className="font-semibold mb-2">Plano del espacio</p>

                        <a
                            href={`http://localhost:3000${espacioDetalle.planoArchivo}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm hover:bg-neutral-800"
                        >
                            Ver / descargar plano
                        </a>
                    </div>
                )}
            </div>
        </div>
    </div>
)}
        </div>
    );
}

function EstadoBadge({ estado }) {
    const clases = {
        DISPONIBLE: 'bg-green-100 text-green-800',
        MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
        INACTIVO: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${clases[estado] || 'bg-gray-100 text-gray-700'}`}>
            {estado}
        </span>
    );
}


function mostrarCategoria(categoria) {
    const categorias = {
        SALONES: 'Salones',
        TEATROS: 'Teatros',
        ESPACIOS_EXTERIORES: 'Espacios exteriores',
        RECORRIDOS: 'Recorridos',
        GALERIA: 'Galería'
    };

    return categorias[categoria] || categoria || '-';
}

function ResumenItem({ label, value }) {
    return (
        <div className="border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">
                {label}
            </p>

            <p className="font-medium text-gray-900 whitespace-pre-wrap">
                {value || '-'}
            </p>
        </div>
    );
}

function formatearMonto(valor) {
    return Number(valor || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}