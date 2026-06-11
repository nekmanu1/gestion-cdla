import { useEffect, useState } from 'react';
import api from '../api/axios';

import PageHeader from '../components/ui/PageHeader';
import Table, {
    Th,
    Td
} from '../components/ui/Table';

export default function Auditoria() {
    const [auditorias, setAuditorias] = useState([]);

    useEffect(() => {
        cargarAuditorias();
    }, []);

    async function cargarAuditorias() {
        try {
            const response = await api.get('/auditorias');
            setAuditorias(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div>
            <PageHeader
                title="Auditoría"
                subtitle="Registro de acciones realizadas en el sistema"
            />

            <Table>
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <Th>Fecha</Th>
                        <Th>Usuario</Th>
                        <Th>Rol</Th>
                        <Th>Módulo</Th>
                        <Th>Acción</Th>
                        <Th>Detalle</Th>
                    </tr>
                </thead>

                <tbody>
                    {auditorias.map((item) => (
                        <tr
                            key={item.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                        >
                            <Td>{new Date(item.fecha).toLocaleString()}</Td>

                            <Td className="font-medium text-gray-900">
                                {item.usuario?.nombre || 'Sistema'}
                            </Td>

                            <Td>{item.usuario?.rol || '-'}</Td>
                            <Td>{item.modulo}</Td>

                            <Td>
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    {item.accion}
                                </span>
                            </Td>

                            <Td>{item.detalle || '-'}</Td>
                        </tr>
                    ))}

                    {auditorias.length === 0 && (
                        <tr>
                            <td
                                colSpan="6"
                                className="px-4 py-8 text-center text-gray-500"
                            >
                                No hay registros de auditoría
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
}