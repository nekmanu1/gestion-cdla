const prisma = require('../lib/prisma');

async function resumenDashboard(req, res) {
    try {
        const [
            totalUsuarios,
            totalClientes,
            totalEspacios,
            solicitudesPendientes,
            solicitudesAprobadas,
            solicitudesRechazadas,
            reservasActivas
        ] = await Promise.all([
            prisma.usuario.count(),
            prisma.cliente.count({
                where: { activo: true }
            }),
            prisma.espacio.count(),
            prisma.solicitud.count({
                where: { estado: 'PENDIENTE' }
            }),
            prisma.solicitud.count({
                where: { estado: 'APROBADA' }
            }),
            prisma.solicitud.count({
                where: { estado: 'RECHAZADA' }
            }),
            prisma.reserva.count({
                where: { estado: 'ACTIVA' }
            })
        ]);

        res.json({
            totalUsuarios,
            totalClientes,
            totalEspacios,
            solicitudesPendientes,
            solicitudesAprobadas,
            solicitudesRechazadas,
            reservasActivas
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener resumen del dashboard'
        });
    }
}

async function estadisticasReservas(req, res) {
    try {
        const reservas = await prisma.reserva.findMany({
            where: {
                estado: 'ACTIVA'
            },
            include: {
                espacio: true
            }
        });

        const reservasPorEspacio = {};

        reservas.forEach((reserva) => {
            const nombreEspacio = reserva.espacio.nombre;

            if (!reservasPorEspacio[nombreEspacio]) {
                reservasPorEspacio[nombreEspacio] = 0;
            }

            reservasPorEspacio[nombreEspacio]++;
        });

        const resultado = Object.keys(reservasPorEspacio).map((espacio) => {
            return {
                espacio,
                cantidad: reservasPorEspacio[espacio]
            };
        });

        res.json({
            reservasPorEspacio: resultado
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener estadísticas de reservas'
        });
    }
}

async function estadisticasFacturacion(req, res) {
    try {
        const facturas = await prisma.factura.findMany({
            include: {
                reserva: {
                    include: {
                        espacio: true
                    }
                }
            }
        });

        let totalFacturado = 0;
        let totalPagado = 0;
        let totalPendiente = 0;
        let facturasPagadas = 0;
        let facturasPendientes = 0;
        let facturasAnuladas = 0;

        const facturacionPorEspacio = {};

        facturas.forEach((factura) => {
            const monto = Number(factura.monto);

            if (factura.estado !== 'ANULADA') {
                totalFacturado += monto;
            }

            if (factura.estado === 'PAGADA') {
                totalPagado += monto;
                facturasPagadas++;
            }

            if (factura.estado === 'PENDIENTE') {
                totalPendiente += monto;
                facturasPendientes++;
            }

            if (factura.estado === 'ANULADA') {
                facturasAnuladas++;
            }

            const espacio = factura.reserva?.espacio?.nombre || 'Sin espacio';

            if (!facturacionPorEspacio[espacio]) {
                facturacionPorEspacio[espacio] = 0;
            }

            if (factura.estado !== 'ANULADA') {
                facturacionPorEspacio[espacio] += monto;
            }
        });

        const porEspacio = Object.keys(facturacionPorEspacio).map((espacio) => ({
            espacio,
            total: facturacionPorEspacio[espacio]
        }));

        res.json({
            totalFacturado,
            totalPagado,
            totalPendiente,
            facturasPagadas,
            facturasPendientes,
            facturasAnuladas,
            facturacionPorEspacio: porEspacio
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener estadísticas de facturación'
        });
    }
}

async function dashboardAvanzado(req, res) {
    try {
        const reservas = await prisma.reserva.findMany({
            include: {
                espacio: true,
                solicitud: {
                    include: {
                        cliente: true
                    }
                }
            }
        });

        const facturas = await prisma.factura.findMany({
            where: {
                estado: {
                    not: 'ANULADA'
                }
            }
        });

        const reservasPorMes = {};
        const facturacionPorMes = {};
        const espaciosMasUtilizados = {};
        const clientesFrecuentes = {};

        reservas.forEach((reserva) => {
            const fecha = new Date(reserva.fechaInicio);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

            if (!reservasPorMes[mes]) {
                reservasPorMes[mes] = 0;
            }

            reservasPorMes[mes]++;

            const espacio = reserva.espacio?.nombre || 'Sin espacio';

            if (!espaciosMasUtilizados[espacio]) {
                espaciosMasUtilizados[espacio] = 0;
            }

            espaciosMasUtilizados[espacio]++;

            const cliente = reserva.solicitud?.cliente?.nombre || 'Sin cliente';

            if (!clientesFrecuentes[cliente]) {
                clientesFrecuentes[cliente] = 0;
            }

            clientesFrecuentes[cliente]++;
        });

        facturas.forEach((factura) => {
            const fecha = new Date(factura.fechaEmision);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

            if (!facturacionPorMes[mes]) {
                facturacionPorMes[mes] = 0;
            }

            facturacionPorMes[mes] += Number(factura.monto);
        });

        const convertirOrdenado = (objeto, campoNombre, campoValor) => {
            return Object.keys(objeto)
                .map((key) => ({
                    [campoNombre]: key,
                    [campoValor]: objeto[key]
                }))
                .sort((a, b) => b[campoValor] - a[campoValor]);
        };

        res.json({
            reservasPorMes: Object.keys(reservasPorMes).map((mes) => ({
                mes,
                cantidad: reservasPorMes[mes]
            })),
            facturacionPorMes: Object.keys(facturacionPorMes).map((mes) => ({
                mes,
                total: facturacionPorMes[mes]
            })),
            espaciosMasUtilizados: convertirOrdenado(
                espaciosMasUtilizados,
                'espacio',
                'cantidad'
            ),
            clientesFrecuentes: convertirOrdenado(
                clientesFrecuentes,
                'cliente',
                'cantidad'
            )
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al obtener dashboard avanzado'
        });
    }
}
module.exports = {
    resumenDashboard,
    estadisticasReservas,
    estadisticasFacturacion,
    dashboardAvanzado
};