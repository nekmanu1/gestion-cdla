const prisma = require('../lib/prisma');

/*
 * Modalidades que no se cobran.
 * Ajusta estos nombres para que coincidan exactamente
 * con los valores guardados en tu base de datos.
 */
const MODALIDADES_NO_COBRADAS = [
    'GRATUITO',
    'ESCUELA_CDLA',
    'CONVENIO',
];


function esAdministrador(req) {
    return req.usuario?.rol === 'ADMIN';
}

function responderError(res, error, mensaje) {
    console.error(error);

    return res.status(500).json({
        message: mensaje
    });
}

function claveMes(fecha) {
    if (!fecha) return null;

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return null;
    }

    return `${valor.getFullYear()}-${String(
        valor.getMonth() + 1
    ).padStart(2, '0')}`;
}

function calcularHoras(inicio, fin) {
    if (!inicio || !fin) return 0;

    const diferencia =
        new Date(fin).getTime() -
        new Date(inicio).getTime();

    return Math.max(
        0,
        diferencia / 3600000
    );
}

function calcularDias(inicio, fin) {
    if (!inicio || !fin) return 0;

    const diferencia =
        new Date(fin).getTime() -
        new Date(inicio).getTime();

    return Math.max(
        0,
        Math.ceil(diferencia / 86400000)
    );
}

/*
 * Calcula cuánto habría costado el evento si no fuera gratuito.
 * No utiliza costoEstimado porque ese campo normalmente es 0
 * para convenios, acuerdos y eventos gratuitos.
 */
function calcularValorComercial(solicitud) {
    const espacio = solicitud.espacio;

    if (!espacio) return 0;

    const montaje =
        calcularHoras(
            solicitud.fechaInicioMontaje,
            solicitud.fechaFinMontaje
        ) * Number(espacio.precioMontaje || 0);

    const evento =
        calcularHoras(
            solicitud.fechaInicioEvento,
            solicitud.fechaFinEvento
        ) * Number(espacio.precioEvento || 0);

    const desmontaje =
        calcularHoras(
            solicitud.fechaInicioDesmontaje,
            solicitud.fechaFinDesmontaje
        ) * Number(espacio.precioDesmontaje || 0);

    const cierre =
        calcularDias(
            solicitud.fechaInicioCerrado,
            solicitud.fechaFinCerrado
        ) * Number(espacio.precioCerrado || 0);

    return Number(
        (
            montaje +
            evento +
            desmontaje +
            cierre
        ).toFixed(2)
    );
}

function convertirOrdenado(
    objeto,
    campoNombre,
    campoValor
) {
    return Object.entries(objeto)
        .map(([nombre, valor]) => ({
            [campoNombre]: nombre,
            [campoValor]: valor
        }))
        .sort(
            (a, b) =>
                b[campoValor] - a[campoValor]
        );
}

/* =========================================================
   RESUMEN GENERAL
   Disponible para ADMIN y OPERADOR
========================================================= */

async function resumenDashboard(req, res) {
    try {
        const ahora = new Date();

        const inicioHoy = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate()
        );

        const finHoy = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate() + 1
        );

        const [
            totalUsuarios,
            totalClientes,
            totalEspacios,
            solicitudesPendientes,
            solicitudesAprobadas,
            solicitudesRechazadas,
            solicitudesCanceladas,
            reservasActivas,
            eventosHoy,
            espaciosDisponibles
        ] = await Promise.all([
            esAdministrador(req)
                ? prisma.usuario.count()
                : Promise.resolve(null),

            prisma.cliente.count({
                where: {
                    activo: true
                }
            }),

            prisma.espacio.count(),

            prisma.solicitud.count({
                where: {
                    estado: 'PENDIENTE'
                }
            }),

            prisma.solicitud.count({
                where: {
                    estado: 'APROBADA'
                }
            }),

            prisma.solicitud.count({
                where: {
                    estado: 'RECHAZADA'
                }
            }),

            prisma.solicitud.count({
                where: {
                    estado: 'CANCELADA'
                }
            }),

            prisma.reserva.count({
                where: {
                    estado: 'ACTIVA'
                }
            }),

            prisma.reserva.count({
                where: {
                    estado: 'ACTIVA',
                    fechaInicio: {
                        lt: finHoy
                    },
                    fechaFin: {
                        gt: inicioHoy
                    }
                }
            }),

            prisma.espacio.count({
                where: {
                    estado: 'DISPONIBLE'
                }
            })
        ]);

        const respuesta = {
            rol: req.usuario?.rol,
            totalClientes,
            totalEspacios,
            espaciosDisponibles,
            solicitudesPendientes,
            solicitudesAprobadas,
            solicitudesRechazadas,
            solicitudesCanceladas,
            reservasActivas,
            eventosHoy
        };

        if (esAdministrador(req)) {
            respuesta.totalUsuarios =
                totalUsuarios;
        }

        return res.json(respuesta);
    } catch (error) {
        return responderError(
            res,
            error,
            'Error al obtener el resumen del dashboard'
        );
    }
}

/* =========================================================
   ESTADÍSTICAS OPERATIVAS
   No incluye dinero ni nombres de clientes
========================================================= */

async function dashboardOperativo(req, res) {
    try {
        const reservas =
            await prisma.reserva.findMany({
                include: {
                    espacio: {
                        select: {
                            id: true,
                            nombre: true
                        }
                    },
                    solicitud: {
                        select: {
                            estado: true,
                            modalidadCosto: true,
                            tipoEvento: true,
                            personas: true
                        }
                    }
                },
                orderBy: {
                    fechaInicio: 'asc'
                }
            });

        const solicitudes =
            await prisma.solicitud.findMany({
                select: {
                    estado: true,
                    tipoEvento: true,
                    modalidadCosto: true,
                    creadoEn: true
                }
            });

        const reservasPorMes = {};
        const espaciosMasUtilizados = {};
        const solicitudesPorEstado = {};
        const tiposEvento = {};
        const modalidades = {};

        let totalAsistentes = 0;

        reservas.forEach((reserva) => {
            const mes = claveMes(
                reserva.fechaInicio
            );

            if (mes) {
                reservasPorMes[mes] =
                    (reservasPorMes[mes] || 0) + 1;
            }

            const espacio =
                reserva.espacio?.nombre ||
                'Sin espacio';

            espaciosMasUtilizados[espacio] =
                (espaciosMasUtilizados[espacio] || 0) +
                1;

            totalAsistentes += Number(
                reserva.solicitud?.personas || 0
            );
        });

        solicitudes.forEach((solicitud) => {
            const estado =
                solicitud.estado || 'SIN_ESTADO';

            solicitudesPorEstado[estado] =
                (solicitudesPorEstado[estado] || 0) +
                1;

            const tipo =
                solicitud.tipoEvento ||
                'Sin especificar';

            tiposEvento[tipo] =
                (tiposEvento[tipo] || 0) + 1;

            const modalidad =
                solicitud.modalidadCosto ||
                'Sin especificar';

            modalidades[modalidad] =
                (modalidades[modalidad] || 0) +
                1;
        });

        return res.json({
            reservasPorMes: Object.keys(
                reservasPorMes
            )
                .sort()
                .map((mes) => ({
                    mes,
                    cantidad:
                        reservasPorMes[mes]
                })),

            espaciosMasUtilizados:
                convertirOrdenado(
                    espaciosMasUtilizados,
                    'espacio',
                    'cantidad'
                ),

            solicitudesPorEstado:
                convertirOrdenado(
                    solicitudesPorEstado,
                    'estado',
                    'cantidad'
                ),

            tiposEvento:
                convertirOrdenado(
                    tiposEvento,
                    'tipo',
                    'cantidad'
                ),

            modalidades:
                convertirOrdenado(
                    modalidades,
                    'modalidad',
                    'cantidad'
                ),

            totalAsistentesEstimados:
                totalAsistentes
        });
    } catch (error) {
        return responderError(
            res,
            error,
            'Error al obtener estadísticas operativas'
        );
    }
}

/* =========================================================
   INFORMACIÓN FINANCIERA
   ÚNICAMENTE ADMIN
========================================================= */

async function estadisticasFacturacion(req, res) {
    try {
        if (!esAdministrador(req)) {
            return res.status(403).json({
                message:
                    'No tienes permiso para consultar información financiera'
            });
        }

        const [facturas, solicitudesGratuitas] =
            await Promise.all([
                prisma.factura.findMany({
                    include: {
                        reserva: {
                            include: {
                                espacio: true,
                                solicitud: true
                            }
                        }
                    },
                    orderBy: {
                        fechaEmision: 'asc'
                    }
                }),

                prisma.solicitud.findMany({
                    where: {
                        estado: {
                            in: [
                                'APROBADA',
                                'CANCELADA'
                            ]
                        },
                        modalidadCosto: {
                            in: MODALIDADES_NO_COBRADAS
                        }
                    },
                    include: {
                        espacio: true
                    },
                    orderBy: {
                        fechaInicioEvento: 'asc'
                    }
                })
            ]);

        let totalFacturado = 0;
        let totalPagado = 0;
        let totalPendiente = 0;
        let totalAnulado = 0;

        let facturasPagadas = 0;
        let facturasPendientes = 0;
        let facturasAnuladas = 0;

        const facturacionPorMes = {};
        const facturacionPorEspacio = {};
        const pendientePorEspacio = {};

        facturas.forEach((factura) => {
            const monto = Number(
                factura.monto || 0
            );

            const espacio =
                factura.reserva?.espacio?.nombre ||
                'Sin espacio';

            const mes =
                claveMes(factura.fechaEmision);

            if (factura.estado !== 'ANULADA') {
                totalFacturado += monto;

                facturacionPorEspacio[espacio] =
                    (
                        facturacionPorEspacio[
                            espacio
                        ] || 0
                    ) + monto;

                if (mes) {
                    facturacionPorMes[mes] =
                        (
                            facturacionPorMes[mes] ||
                            0
                        ) + monto;
                }
            }

            if (factura.estado === 'PAGADA') {
                totalPagado += monto;
                facturasPagadas++;
            }

            if (
                factura.estado === 'PENDIENTE'
            ) {
                totalPendiente += monto;
                facturasPendientes++;

                pendientePorEspacio[espacio] =
                    (
                        pendientePorEspacio[
                            espacio
                        ] || 0
                    ) + monto;
            }

            if (factura.estado === 'ANULADA') {
                totalAnulado += monto;
                facturasAnuladas++;
            }
        });

        let valorNoCobrado = 0;

        const noCobradoPorModalidad = {};
        const noCobradoPorEspacio = {};
        const noCobradoPorMes = {};

        solicitudesGratuitas.forEach(
            (solicitud) => {
                const valor =
                    calcularValorComercial(
                        solicitud
                    );

                valorNoCobrado += valor;

                const modalidad =
                    solicitud.modalidadCosto ||
                    'Sin especificar';

                const espacio =
                    solicitud.espacio?.nombre ||
                    'Sin espacio';

                const mes = claveMes(
                    solicitud.fechaInicioEvento
                );

                if (
                    !noCobradoPorModalidad[
                        modalidad
                    ]
                ) {
                    noCobradoPorModalidad[
                        modalidad
                    ] = {
                        cantidad: 0,
                        total: 0
                    };
                }

                noCobradoPorModalidad[
                    modalidad
                ].cantidad++;

                noCobradoPorModalidad[
                    modalidad
                ].total += valor;

                noCobradoPorEspacio[espacio] =
                    (
                        noCobradoPorEspacio[
                            espacio
                        ] || 0
                    ) + valor;

                if (mes) {
                    noCobradoPorMes[mes] =
                        (
                            noCobradoPorMes[mes] ||
                            0
                        ) + valor;
                }
            }
        );

        const porcentajeCobrado =
            totalFacturado > 0
                ? Number(
                    (
                        (totalPagado /
                            totalFacturado) *
                        100
                    ).toFixed(2)
                )
                : 0;

        const modalidadesNoCobradas =
            Object.entries(
                noCobradoPorModalidad
            )
                .map(
                    ([
                        modalidad,
                        informacion
                    ]) => ({
                        modalidad,
                        cantidad:
                            informacion.cantidad,
                        total: Number(
                            informacion.total.toFixed(
                                2
                            )
                        )
                    })
                )
                .sort(
                    (a, b) =>
                        b.total - a.total
                );

        return res.json({
            resumen: {
                totalFacturado: Number(
                    totalFacturado.toFixed(2)
                ),
                totalPagado: Number(
                    totalPagado.toFixed(2)
                ),
                totalPendiente: Number(
                    totalPendiente.toFixed(2)
                ),
                totalAnulado: Number(
                    totalAnulado.toFixed(2)
                ),
                valorNoCobrado: Number(
                    valorNoCobrado.toFixed(2)
                ),
                valorGestionado: Number(
                    (
                        totalFacturado +
                        valorNoCobrado
                    ).toFixed(2)
                ),
                porcentajeCobrado,
                facturasPagadas,
                facturasPendientes,
                facturasAnuladas,
                eventosNoCobrados:
                    solicitudesGratuitas.length
            },

            facturacionPorMes: Object.keys(
                facturacionPorMes
            )
                .sort()
                .map((mes) => ({
                    mes,
                    total: Number(
                        facturacionPorMes[
                            mes
                        ].toFixed(2)
                    )
                })),

            facturacionPorEspacio:
                convertirOrdenado(
                    facturacionPorEspacio,
                    'espacio',
                    'total'
                ),

            pendientePorEspacio:
                convertirOrdenado(
                    pendientePorEspacio,
                    'espacio',
                    'total'
                ),

            modalidadesNoCobradas,

            noCobradoPorEspacio:
                convertirOrdenado(
                    noCobradoPorEspacio,
                    'espacio',
                    'total'
                ),

            noCobradoPorMes: Object.keys(
                noCobradoPorMes
            )
                .sort()
                .map((mes) => ({
                    mes,
                    total: Number(
                        noCobradoPorMes[
                            mes
                        ].toFixed(2)
                    )
                }))
        });
    } catch (error) {
        return responderError(
            res,
            error,
            'Error al obtener estadísticas financieras'
        );
    }
}

module.exports = {
    resumenDashboard,
    dashboardOperativo,
    estadisticasFacturacion
};