const PDFDocument = require('pdfkit');
const prisma = require('../lib/prisma');
const path = require('path');
const fs = require('fs');

const logoMincultura = path.join(__dirname, '../../assets/logos/mincultura.png');
const logoCdla = path.join(__dirname, '../../assets/logos/cdla.png');

function formatearMonto(valor) {
    return Number(valor || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function crearDocumentoPDF(res, nombreArchivo, titulo) {
    const doc = new PDFDocument({
    margin: 35,
    size: 'LETTER',
    layout: 'landscape'
});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `inline; filename="${nombreArchivo}"`
    );

    doc.pipe(res);

    agregarEncabezado(doc, titulo);

    return doc;
}

function agregarEncabezado(doc, titulo) {
    if (fs.existsSync(logoMincultura)) {
        doc.image(logoMincultura, 40, 45, {
            width: 190
        });
    }

    if (fs.existsSync(logoCdla)) {
        doc.image(logoCdla, 650, 25, {
            width: 90
        });
    }

    doc.moveDown(4);

    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text(titulo.toUpperCase(), {
            align: 'center'
        });

    doc.moveDown(0.3);

    doc.fontSize(10)
        .font('Helvetica')
        .text('Sistema de Gestión de Espacios - Ciudad de las Artes', {
            align: 'center'
        });

    doc.fontSize(9)
        .text(`Fecha de generación: ${new Date().toLocaleString()}`, {
            align: 'center'
        });

    doc.moveDown();

}
function textoCorto(texto, max = 24) {
    if (!texto) return 'N/A';

    const valor = String(texto);

    return valor.length > max
        ? valor.substring(0, max - 3) + '...'
        : valor;
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString();
}
function formatearFechaCorta(fecha) {
    if (!fecha) return 'N/A';

    return new Date(fecha).toLocaleDateString('es-PA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function dibujarDetalle(doc, items) {
    const startX = 35;
    let y = doc.y;
    const cardW = 225;
    const cardH = 42;
    const gap = 20;

    items.forEach((item, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);

        const x = startX + col * (cardW + gap);
        const itemY = y + row * (cardH + gap);

        doc.roundedRect(x, itemY, cardW, cardH, 6)
            .fillAndStroke('#f8fafc', '#d1d5db');

        doc.fillColor('#6b7280')
            .fontSize(8)
            .font('Helvetica')
            .text(item[0], x + 10, itemY + 8, {
                width: cardW - 20
            });

        doc.fillColor('#111827')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(item[1] || 'N/A', x + 10, itemY + 22, {
                width: cardW - 20
            });
    });

    const totalRows = Math.ceil(items.length / 3);
    doc.y = y + totalRows * (cardH + gap) + 5;
}

function dibujarTabla(doc, columnas, filas) {
    const startX = 35;
    let y = doc.y;
    const rowHeight = 34;

    function dibujarEncabezadoTabla() {
        doc.font('Helvetica-Bold').fontSize(9);

        columnas.forEach((col) => {
            doc.rect(startX + col.x, y, col.width, rowHeight)
                .fillAndStroke('#e5e7eb', '#cbd5e1');

            doc.fillColor('#111827')
                .text(col.label, startX + col.x + 6, y + 11, {
                    width: col.width - 12
                });
        });

        y += rowHeight;
    }

    dibujarEncabezadoTabla();

    doc.font('Helvetica').fontSize(9);

    filas.forEach((fila, index) => {
        if (y > 535) {
            doc.addPage();
            agregarEncabezado(doc, 'Continuación del reporte');
            y = doc.y;
            dibujarEncabezadoTabla();
        }

        const fondo = index % 2 === 0 ? '#ffffff' : '#f9fafb';

        columnas.forEach((col) => {
            doc.rect(startX + col.x, y, col.width, rowHeight)
                .fillAndStroke(fondo, '#e5e7eb');

            if (col.key === 'estado') {
                const estado = fila[col.key] || '';
                let color = '#374151';

                if (estado === 'APROBADA' || estado === 'PAGADA' || estado === 'ACTIVA') {
                    color = '#166534';
                }

                if (estado === 'RECHAZADA' || estado === 'ANULADA' || estado === 'CANCELADA') {
                    color = '#991b1b';
                }

                if (estado === 'PENDIENTE') {
                    color = '#92400e';
                }

                doc.fillColor(color)
                    .font('Helvetica-Bold')
                    .text(estado, startX + col.x + 6, y + 11, {
                        width: col.width - 12
                    });

                doc.font('Helvetica');
            } else {
                doc.fillColor('#111827')
    .text(fila[col.key] || '', startX + col.x + 6, y + 11, {
        width: col.width - 12,
        align: col.align || 'left'
    });
            }
        });

        y += rowHeight;
    });

    doc.y = y + 10;
}

function obtenerRangoMes(mes, anio) {
    if (!mes || !anio) return null;

    const inicio = new Date(Number(anio), Number(mes) - 1, 1);
    const fin = new Date(Number(anio), Number(mes), 1);

    return {
        gte: inicio,
        lt: fin
    };
}

function calcularHoras(inicio, fin) {
    if (!inicio || !fin) return 0;

    return (
        new Date(fin) - new Date(inicio)
    ) / (1000 * 60 * 60);
}

function calcularDias(inicio, fin) {
    if (!inicio || !fin) return 0;

    return Math.ceil(
        (new Date(fin) - new Date(inicio))
        / (1000 * 60 * 60 * 24)
    );
}

async function reporteClientes(req, res) {
    try {
        const clientes = await prisma.cliente.findMany({
            orderBy: { id: 'asc' }
        });

        const doc = crearDocumentoPDF(res, 'reporte-clientes.pdf', 'Reporte de Clientes');



        clientes.forEach((cliente) => {
            doc.fontSize(11).text(`ID: ${cliente.id}`);
            doc.text(`Nombre: ${cliente.nombre}`);
            doc.text(`Cédula/RUC: ${cliente.cedulaRuc || 'N/A'}`);
            doc.text(`Teléfono: ${cliente.telefono || 'N/A'}`);
            doc.text(`Correo: ${cliente.correo || 'N/A'}`);
            doc.text(`Activo: ${cliente.activo ? 'Sí' : 'No'}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar reporte de clientes' });
    }
}

async function reporteEspacios(req, res) {
    try {
        const espacios = await prisma.espacio.findMany({
            orderBy: { id: 'asc' }
        });

        const doc = crearDocumentoPDF(res, 'reporte-espacios.pdf', 'Reporte de Espacios');



        espacios.forEach((espacio) => {
            doc.fontSize(11).text(`ID: ${espacio.id}`);
            doc.text(`Nombre: ${espacio.nombre}`);
            doc.text(`Tipo: ${espacio.tipo || 'N/A'}`);
            doc.text(`Capacidad: ${espacio.capacidad || 'N/A'}`);
            doc.text(`Ubicación: ${espacio.ubicacion || 'N/A'}`);
            doc.text(`Estado: ${espacio.estado}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar reporte de espacios' });
    }
}

async function reporteReservas(req, res) {
    try {
        const { mes, anio } = req.query;
const where = {};

const rango = obtenerRangoMes(mes, anio);

if (rango) {
    where.fechaInicio = rango;
}
        const reservas = await prisma.reserva.findMany({
    where,
            include: {
                espacio: true,
                solicitud: {
                    include: {
                        cliente: true
                    }
                }
            },
            orderBy: { fechaInicio: 'asc' }
        });

        const doc = crearDocumentoPDF(res, 'reporte-reservas.pdf', 'Reporte de Reservas');

 

        reservas.forEach((reserva) => {
            doc.fontSize(11).text(`ID: ${reserva.id}`);
            doc.text(`Evento: ${reserva.solicitud.nombreEvento}`);
            doc.text(`Cliente: ${reserva.solicitud.cliente.nombre}`);
            doc.text(`Espacio: ${reserva.espacio.nombre}`);
            doc.text(`Inicio: ${reserva.fechaInicio.toLocaleString()}`);
            doc.text(`Fin: ${reserva.fechaFin.toLocaleString()}`);
            doc.text(`Estado: ${reserva.estado}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar reporte de reservas' });
    }
}

async function reporteFacturas(req, res) {
    try {
        const { mes, anio, estado } = req.query;

        const where = {};
        const rango = obtenerRangoMes(mes, anio);

        if (rango) {
            where.fechaEmision = rango;
        }

        if (estado) {
            where.estado = estado;
        }

        const facturas = await prisma.factura.findMany({
            where,
            include: {
                cliente: true,
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
        });

       const totalMonto = facturas.reduce((sum, item) => {
    return sum + Number(item.monto || 0);
}, 0);

        const totalPendientes = facturas.filter((f) => f.estado === 'PENDIENTE').length;
        const totalPagadas = facturas.filter((f) => f.estado === 'PAGADA').length;
        const totalAnuladas = facturas.filter((f) => f.estado === 'ANULADA').length;

        const doc = crearDocumentoPDF(
            res,
            'reporte-facturas.pdf',
            'Reporte de Facturas'
        );

        doc.fontSize(10).font('Helvetica');

        doc.text(`Período: ${mes && anio ? `${mes}/${anio}` : 'Todos'}`);
        doc.text(`Estado: ${estado || 'Todos'}`);

        doc.moveDown(0.5);

        const resumenY = doc.y;
        const cardW = 135;
        const cardH = 45;
        const gap = 12;

        const tarjetas = [
            { titulo: 'Facturas', valor: facturas.length },
            { titulo: 'Pagadas', valor: totalPagadas },
            { titulo: 'Pendientes', valor: totalPendientes },
            { titulo: 'Anuladas', valor: totalAnuladas },
            { titulo: 'Monto total', valor: `B/. ${formatearMonto(totalMonto)}` }
        ];

        tarjetas.forEach((item, index) => {
            const x = 35 + index * (cardW + gap);

            doc.roundedRect(x, resumenY, cardW, cardH, 6)
                .fillAndStroke('#f8fafc', '#d1d5db');

            doc.fillColor('#6b7280')
                .fontSize(8)
                .font('Helvetica')
                .text(item.titulo, x + 10, resumenY + 9, {
                    width: cardW - 20
                });

            doc.fillColor('#111827')
                .fontSize(13)
                .font('Helvetica-Bold')
                .text(String(item.valor), x + 10, resumenY + 24, {
                    width: cardW - 20
                });
        });

        doc.y = resumenY + cardH + 25;

        if (facturas.length === 0) {
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#111827')
                .text('No existen registros para el período seleccionado.', {
                    align: 'center'
                });

            doc.end();
            return;
        }

        const columnas = [
            { label: 'Factura', key: 'numero', x: 0, width: 100 },
            { label: 'Fecha', key: 'fecha', x: 100, width: 80 },
            { label: 'Cliente', key: 'cliente', x: 180, width: 165 },
            { label: 'Concepto', key: 'concepto', x: 345, width: 210 },
            { label: 'Estado', key: 'estado', x: 555, width: 90 },
            { label: 'Monto', key: 'monto', x: 645, width: 85 }
        ];

        const filas = facturas.map((f) => ({
            numero: f.numero,
            fecha: formatearFechaCorta(f.fechaEmision),
            cliente: textoCorto(f.cliente?.nombre, 32),
            concepto: textoCorto(f.concepto, 42),
            estado: f.estado,
            monto: `B/. ${formatearMonto(f.monto)}`
        }));

        dibujarTabla(doc, columnas, filas);

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al generar reporte de facturas'
        });
    }
}

async function reporteSolicitudIndividual(req, res) {
    try {
        const { id } = req.params;

        const s = await prisma.solicitud.findUnique({
            where: { id: Number(id) },
            include: {
                cliente: true,
                espacio: true,
                reserva: {
                    include: {
                        facturas: true
                    }
                }
            }
        });

        if (!s) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        const doc = crearDocumentoPDF(
            res,
            `solicitud-${s.codigo}.pdf`,
            'Resumen de Solicitud'
        );

        const factura = s.reserva?.facturas?.[0];

        dibujarDetalle(doc, [
            ['Código', s.codigo],
            ['Estado', s.estado],
            ['Evento', s.nombreEvento],
            ['Cliente', s.cliente?.nombre],
            ['Espacio', s.espacio?.nombre],
            ['Modalidad', s.modalidadCosto],
            ['Costo estimado', `B/. ${formatearMonto(s.costoEstimado)}`],
            ['Factura', factura?.numero || 'Sin factura'],
            ['Estado factura', factura?.estado || 'N/A']
        ]);

        doc.moveDown();

        dibujarTabla(doc, [
            { label: 'Etapa', key: 'etapa', x: 0, width: 160 },
            { label: 'Inicio', key: 'inicio', x: 160, width: 300 },
            { label: 'Fin', key: 'fin', x: 460, width: 260}
        ], [
            { etapa: 'Montaje', inicio: formatearFecha(s.fechaInicioMontaje), fin: formatearFecha(s.fechaFinMontaje) },
            { etapa: 'Evento', inicio: formatearFecha(s.fechaInicioEvento), fin: formatearFecha(s.fechaFinEvento) },
            { etapa: 'Desmontaje', inicio: formatearFecha(s.fechaInicioDesmontaje), fin: formatearFecha(s.fechaFinDesmontaje) },
            { etapa: 'Cierre', inicio: formatearFecha(s.fechaInicioCerrado), fin: formatearFecha(s.fechaFinCerrado) }
        ]);

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar solicitud individual' });
    }
}

async function reporteFacturaIndividual(req, res) {
    try {
        const { id } = req.params;

        const f = await prisma.factura.findUnique({
            where: { id: Number(id) },
            include: {
                cliente: true,
                reserva: {
                    include: {
                        espacio: true,
                        solicitud: true
                    }
                }
            }
        });

        if (!f) {
            return res.status(404).json({ message: 'Factura no encontrada' });
        }

        const doc = crearDocumentoPDF(
            res,
            `factura-${f.numero}.pdf`,
            'Factura'
        );

        const s = f.reserva?.solicitud;
        const r = f.reserva;
        const espacio = r?.espacio;
        const pageW = 792; // Letter landscape
        const colMid = pageW / 2;
        const startX = 35;
        const rightX = colMid + 10;
        const blockW = colMid - startX - 10;

        // ── Bloque izquierdo: Datos del cliente ──────────────────────────────
        let y = doc.y;

        doc.roundedRect(startX, y, blockW, 90, 6)
            .fillAndStroke('#ffffff', '#ffffff');

        doc.fillColor('#1e40af').fontSize(9).font('Helvetica-Bold')
            .text('DATOS DEL CLIENTE', startX + 10, y + 8, { width: blockW - 20 });

        doc.fillColor('#111827').fontSize(9).font('Helvetica');
        doc.text(`Nombre:   ${f.cliente?.nombre || 'N/A'}`,     startX + 10, y + 22, { width: blockW - 20 });
        doc.text(`Cédula/RUC: ${f.cliente?.cedulaRuc || 'N/A'}`, startX + 10, y + 35, { width: blockW - 20 });
        doc.text(`Teléfono:  ${f.cliente?.telefono || 'N/A'}`,   startX + 10, y + 48, { width: blockW - 20 });
        doc.text(`Correo:    ${f.cliente?.correo || 'N/A'}`,     startX + 10, y + 61, { width: blockW - 20 });

        // ── Bloque derecho: Datos de la factura ──────────────────────────────
        doc.roundedRect(rightX, y, blockW, 90, 6)
            .fillAndStroke('#ffffff', '#ffffff');

        doc.fillColor('#92400e').fontSize(9).font('Helvetica-Bold')
            .text('DATOS DE LA FACTURA', rightX + 10, y + 8, { width: blockW - 20 });

        doc.fillColor('#111827').fontSize(9).font('Helvetica');

        // Estado con color
        const estadoColor = f.estado === 'PAGADA' ? '#166534'
            : f.estado === 'ANULADA' ? '#991b1b'
            : '#92400e';

        doc.text(`Número:        ${f.numero || 'N/A'}`,            rightX + 10, y + 22, { width: blockW - 20 });
        doc.text(`Fecha emisión: ${formatearFecha(f.fechaEmision)}`, rightX + 10, y + 35, { width: blockW - 20 });
        doc.text(`Fecha pago:    ${formatearFecha(f.fechaPago)}`,   rightX + 10, y + 48, { width: blockW - 20 });

        doc.fillColor(estadoColor).font('Helvetica-Bold')
            .text(`Estado:        ${f.estado}`, rightX + 10, y + 61, { width: blockW - 20 });

        doc.y = y + 100;

        // ── Bloque: Datos del evento / espacio ───────────────────────────────
        y = doc.y;
        const eventoW = pageW - startX * 2;

        doc.roundedRect(startX, y, eventoW, 52, 6)
            .fillAndStroke('#f8fafc', '#d1d5db');

        doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
            .text('DETALLE DEL EVENTO Y ESPACIO', startX + 10, y + 8, { width: eventoW - 20 });

        doc.fillColor('#111827').fontSize(9).font('Helvetica');

        const col1 = startX + 10;
        const col2 = startX + eventoW / 3;
        const col3 = startX + (eventoW / 3) * 2;
        const rowY = y + 24;

        doc.text(`Evento: ${s?.nombreEvento || 'N/A'}`, col1, rowY, { width: eventoW / 3 - 10 });
        doc.text(`Espacio: ${espacio?.nombre || 'N/A'}`, col2, rowY, { width: eventoW / 3 - 10 });
        doc.text(`Modalidad: ${s?.modalidadCosto || 'N/A'}`, col3, rowY, { width: eventoW / 3 - 10 });

        doc.y = y + 62;

        // ── Tabla de etapas ───────────────────────────────────────────────────
      // ── Tabla de etapas ───────────────────────────────────────────────────
        y = doc.y;

        doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
            .text('PERÍODO DE OCUPACIÓN', startX, y);
        y += 16;

        const etapas = [
            { etapa: 'Montaje',       inicio: s?.fechaInicioMontaje,    fin: s?.fechaFinMontaje    },
            { etapa: 'Evento activo', inicio: s?.fechaInicioEvento,     fin: s?.fechaFinEvento     },
            { etapa: 'Desmontaje',    inicio: s?.fechaInicioDesmontaje, fin: s?.fechaFinDesmontaje },
            { etapa: 'Cierre',        inicio: s?.fechaInicioCerrado,    fin: s?.fechaFinCerrado    },
        ];

        const colsEtapas = [
            { label: 'Etapa',        key: 'etapa',  x: 0,   width: 140 },
            { label: 'Fecha inicio', key: 'inicio', x: 140, width: 290 },
            { label: 'Fecha fin',    key: 'fin',    x: 430, width: 290 },
        ];

        const filasEtapas = etapas.map((e) => ({
            etapa:  e.etapa,
            inicio: formatearFecha(e.inicio),
            fin:    formatearFecha(e.fin),
        }));

        doc.y = y;
        dibujarTabla(doc, colsEtapas, filasEtapas);

        // ── Cálculos ──────────────────────────────────────────────────────────
        const horasMontaje    = calcularHoras(s?.fechaInicioMontaje,    s?.fechaFinMontaje);
        const horasEvento     = calcularHoras(s?.fechaInicioEvento,     s?.fechaFinEvento);
        const horasDesmontaje = calcularHoras(s?.fechaInicioDesmontaje, s?.fechaFinDesmontaje);
        const diasCierre      = calcularDias(s?.fechaInicioCerrado,     s?.fechaFinCerrado);

        const montoMontaje    = horasMontaje    * Number(espacio?.precioMontaje    || 0);
        const montoEvento     = horasEvento     * Number(espacio?.precioEvento     || 0);
        const montoDesmontaje = horasDesmontaje * Number(espacio?.precioDesmontaje || 0);
        const montoCierre     = diasCierre      * Number(espacio?.precioCerrado    || 0);
        const sumaDesglose    = montoMontaje + montoEvento + montoDesmontaje + montoCierre;
        const montoOficial    = Number(f.monto || 0);

        // ── Calcular espacio necesario para desglose + total ──────────────────
        // Título(16) + encabezado(26) + 4 filas(24) + fila total(28) + separador(20) + total(32) + pie(24)
        const espacioNecesario = 16 + 26 + (4 * 24) + 28 + 20 + 32 + 24;
        const espacioDisponible = 535 - doc.y;

        if (espacioDisponible < espacioNecesario) {
            doc.addPage();
            agregarEncabezado(doc, `Factura ${f.numero}`);
        }

        // ── Línea divisoria ───────────────────────────────────────────────────
        y = doc.y;
        doc.moveTo(startX, y).lineTo(pageW - startX, y)
            .strokeColor('#e5e7eb').lineWidth(1).stroke();
        doc.moveDown(0.8);

        // ── Desglose de costos ────────────────────────────────────────────────
        y = doc.y;

        doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
            .text('DESGLOSE DE COSTOS', startX, y);
        y += 18;

        // Columnas: total eventoW = 722
        const DC = [
            { label: 'Concepto',  x: 0,   width: 180, align: 'left'   },
            { label: 'Cantidad',  x: 180, width: 160, align: 'center'  },
            { label: 'Tarifa',    x: 340, width: 140, align: 'right'   },
            { label: 'Subtotal',  x: 480, width: 242, align: 'right'   },
        ];
        const DH = 26;
        const DR = 24;

        // Encabezado de tabla
        DC.forEach((col) => {
            doc.rect(startX + col.x, y, col.width, DH)
                .fillAndStroke('#1e3a5f', '#1e3a5f');
            doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
                .text(col.label, startX + col.x + 6, y + 8, {
                    width: col.width - 12,
                    align: col.align
                });
        });
        y += DH;

        // Filas
        const desgloseFilas = [
            { concepto: 'Montaje',    cantidad: `${horasMontaje.toFixed(2)} hora(s)`,    tarifa: Number(espacio?.precioMontaje    || 0), monto: montoMontaje    },
            { concepto: 'Evento',     cantidad: `${horasEvento.toFixed(2)} hora(s)`,     tarifa: Number(espacio?.precioEvento     || 0), monto: montoEvento     },
            { concepto: 'Desmontaje', cantidad: `${horasDesmontaje.toFixed(2)} hora(s)`, tarifa: Number(espacio?.precioDesmontaje || 0), monto: montoDesmontaje },
            { concepto: 'Cierre',     cantidad: `${diasCierre} día(s)`,                  tarifa: Number(espacio?.precioCerrado    || 0), monto: montoCierre     },
        ];

        desgloseFilas.forEach((fila, index) => {
            const fondo = index % 2 === 0 ? '#ffffff' : '#f9fafb';
            const valores = [
                fila.concepto,
                fila.cantidad,
                `B/. ${formatearMonto (fila.tarifa)}`,
                `B/. ${formatearMonto (fila.monto)}`,
            ];
            DC.forEach((col, ci) => {
                doc.rect(startX + col.x, y, col.width, DR)
                    .fillAndStroke(fondo, '#e5e7eb');
                doc.fillColor('#111827').fontSize(9).font('Helvetica')
                    .text(valores[ci], startX + col.x + 6, y + 7, {
                        width: col.width - 12,
                        align: col.align
                    });
            });
            y += DR;
        });

        // Fila TOTAL dentro de la tabla
        const totalFilaH = 28;
        const totalLabelW = DC[0].width + DC[1].width + DC[2].width; // 480px
        doc.rect(startX, y, totalLabelW, totalFilaH)
            .fillAndStroke('#e5e7eb', '#d1d5db');
        doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold')
            .text('TOTAL', startX + 6, y + 8, {
                width: totalLabelW - 12,
                align: 'right'
            });
        doc.rect(startX + DC[3].x, y, DC[3].width, totalFilaH)
            .fillAndStroke('#1e3a5f', '#1e3a5f');
        doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
            .text(`B/. ${formatearMonto(sumaDesglose)}`, startX + DC[3].x + 6, y + 8, {
                width: DC[3].width - 12,
                align: 'right'
            });
        y += totalFilaH;

        // ── Nota de ajuste + TOTAL A PAGAR ───────────────────────────────────
        y += 16;
        const hayDiferencia = Math.abs(montoOficial - sumaDesglose) > 0.01;

        if (hayDiferencia) {
            doc.fillColor('#92400e').fontSize(8).font('Helvetica')
                .text(
                    `* El monto facturado (B/. ${formatearMonto(montoOficial)}) fue ajustado manualmente respecto al calculado.`,
                    startX, y, { width: eventoW }
                );
            y += 14;
        }

        // Barra TOTAL A PAGAR
        const totW  = eventoW; // ocupa todo el ancho
        const totH  = 32;
        doc.rect(startX, y, totW, totH).fillAndStroke('#1e3a5f', '#1e3a5f');
        doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
            .text('TOTAL A PAGAR', startX + 12, y + 9, { width: totW / 2 });
        doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold')
            .text(`B/. ${formatearMonto(montoOficial)}`, startX, y + 9, {
                width: totW - 12,
                align: 'right'
            });
        y += totH + 20;

        // ── Nota de pie ───────────────────────────────────────────────────────
        doc.fontSize(8).font('Helvetica').fillColor('#6b7280')
            .text(
                'Este documento es generado automáticamente por el Sistema de Gestión de Espacios — Ciudad de las Artes.',
                startX, y, { width: eventoW, align: 'center' }
            );

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar factura individual' });
    }
}

async function reporteReservaIndividual(req, res) {
    try {
        const { id } = req.params;

        const r = await prisma.reserva.findUnique({
            where: { id: Number(id) },
            include: {
                espacio: true,
                solicitud: {
                    include: {
                        cliente: true
                    }
                },
                facturas: true
            }
        });

        if (!r) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        const factura = r.facturas?.[0];

        const doc = crearDocumentoPDF(
            res,
            `reserva-${r.id}.pdf`,
            'Reserva'
        );

        dibujarDetalle(doc, [
            ['Reserva', `#${r.id}`],
            ['Estado', r.estado],
            ['Espacio', r.espacio?.nombre],
            ['Evento', r.solicitud?.nombreEvento],
            ['Cliente', r.solicitud?.cliente?.nombre],
            ['Factura', factura?.numero || 'Sin factura'],
            ['Estado factura', factura?.estado || 'N/A'],
            ['Monto', `B/. ${formatearMonto(factura?.monto)}`]
        ]);

        doc.moveDown();

        dibujarTabla(doc, [
            { label: 'Etapa', key: 'etapa', x: 0, width: 160 },
            { label: 'Inicio', key: 'inicio', x: 160, width: 300 },
            { label: 'Fin', key: 'fin', x: 460, width: 250 }
        ], [
            { etapa: 'Ocupación', inicio: formatearFecha(r.fechaInicio), fin: formatearFecha(r.fechaFin) },
            { etapa: 'Montaje', inicio: formatearFecha(r.fechaInicioMontaje), fin: formatearFecha(r.fechaFinMontaje) },
            { etapa: 'Evento', inicio: formatearFecha(r.fechaInicioEvento), fin: formatearFecha(r.fechaFinEvento) },
            { etapa: 'Desmontaje', inicio: formatearFecha(r.fechaInicioDesmontaje), fin: formatearFecha(r.fechaFinDesmontaje) },
            { etapa: 'Cierre', inicio: formatearFecha(r.fechaInicioCerrado), fin: formatearFecha(r.fechaFinCerrado) }
        ]);

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar reserva individual' });
    }
}
async function reporteSolicitudes(req, res) {
    try {
        const { mes, anio, estado } = req.query;

        const where = {};
        const rango = obtenerRangoMes(mes, anio);

        if (rango) {
            where.creadoEn = rango;
        }

        if (estado) {
            where.estado = estado;
        }

        const solicitudes = await prisma.solicitud.findMany({
            where,
            include: {
                cliente: true,
                espacio: true,
                reserva: {
                    include: {
                        facturas: true
                    }
                }
            },
            orderBy: {
                creadoEn: 'asc'
            }
        });

        const doc = crearDocumentoPDF(
            res,
            'reporte-solicitudes.pdf',
            'Reporte de Solicitudes'
        );

        const totalMonto = solicitudes.reduce((sum, item) => {
            return sum + Number(item.costoEstimado || 0);
        }, 0);

        const totalPendientes = solicitudes.filter((s) => s.estado === 'PENDIENTE').length;
        const totalAprobadas = solicitudes.filter((s) => s.estado === 'APROBADA').length;
        const totalRechazadas = solicitudes.filter((s) => s.estado === 'RECHAZADA').length;

        doc.fontSize(10).font('Helvetica');

        doc.text(`Periodo: ${mes && anio ? `${mes}/${anio}` : 'Todos'}`);
        doc.text(`Estado: ${estado || 'Todos'}`);

        doc.moveDown(0.5);

        const resumenY = doc.y;
        const cardW = 135;
        const cardH = 45;
        const gap = 12;

        const tarjetas = [
            { titulo: 'Solicitudes', valor: solicitudes.length },
            { titulo: 'Aprobadas', valor: totalAprobadas },
            { titulo: 'Pendientes', valor: totalPendientes },
            { titulo: 'Rechazadas', valor: totalRechazadas },
            { titulo: 'Monto total', valor: `B/. ${formatearMonto(totalMonto)}` }
        ];

        tarjetas.forEach((item, index) => {
            const x = 35 + index * (cardW + gap);

            doc.roundedRect(x, resumenY, cardW, cardH, 6)
                .fillAndStroke('#f8fafc', '#d1d5db');

            doc.fillColor('#6b7280')
                .fontSize(8)
                .font('Helvetica')
                .text(item.titulo, x + 10, resumenY + 9, {
                    width: cardW - 20
                });

            doc.fillColor('#111827')
                .fontSize(13)
                .font('Helvetica-Bold')
                .text(String(item.valor), x + 10, resumenY + 24, {
                    width: cardW - 20,
                });
        });

        doc.y = resumenY + cardH + 25;

        if (solicitudes.length === 0) {
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#111827')
                .text('No existen registros para el período seleccionado.', {
                    align: 'center'
                });

            doc.end();
            return;
        }

        const columnas = [
    

 { label: 'Código', key: 'codigo', x: 0, width: 90 },
    { label: 'Fecha', key: 'creado', x: 90, width: 75 },
    { label: 'Evento', key: 'evento', x: 165, width: 155 }, 
    { label: 'Cliente', key: 'cliente', x: 320, width: 140 },
    { label: 'Espacio', key: 'espacio', x: 460, width: 115 }, 
    { label: 'Estado', key: 'estado', x: 575, width: 80 },
    { label: 'Costo', key: 'costo', x: 655, width: 65 }


];

        const filas = solicitudes.map((s) => ({
            codigo: s.codigo,
            creado: formatearFechaCorta(s.creadoEn),
            evento: textoCorto(s.nombreEvento, 34),
            cliente: textoCorto(s.cliente?.nombre, 28),
            espacio: textoCorto(s.espacio?.nombre, 24),
            estado: s.estado,
            costo: `B/. ${formatearMonto(s.costoEstimado)}`
        }));

        dibujarTabla(doc, columnas, filas);

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Error al generar reporte de solicitudes'
        });
    }
}

module.exports = {
    reporteClientes,
    reporteEspacios,
    reporteReservas,
    reporteFacturas,
    reporteSolicitudes,
    reporteSolicitudIndividual,
    reporteFacturaIndividual,
    reporteReservaIndividual
};