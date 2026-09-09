"use client";

export type VentaExportable = {
    id: string;
    sucursal_id: string | null;
    codigo_venta: string;
    tipo_venta: string;
    subtotal: number;
    descuento: number;
    impuestos: number;
    total: number;
    monto_pagado: number;
    saldo_pendiente: number;
    cambio_entregado: number;
    estado_pago: string;
    estado: string;
    fecha_venta: string;

    sucursales: {
        nombre: string;
    } | null;

    venta_pagos: {
        id: string;
        metodo_pago: string;
        monto: number;
        estado: string;
        fecha_pago: string;
    }[];
};

type Ranking = {
    nombre: string;
    total: number;
    porcentaje: number;
};

type VentaDia = {
    fecha: string;
    etiqueta: string;
    total: number;
};

export type DatosExportacionReporteVentas = {
    simboloMoneda: string;

    fechaDesde: string;
    fechaHasta: string;

    nombreSucursal: string;
    tipoVenta: string;
    estadoPago: string;
    metodoPago: string;

    cantidad: number;
    totalVendido: number;
    cobrado: number;
    pendiente: number;
    ticketPromedio: number;

    ventas: VentaExportable[];

    porTipo: Ranking[];
    porMetodo: Ranking[];
    porDia: VentaDia[];
};

const VERDE_OSCURO = "26332F";
const VERDE = "6F8F83";
const VERDE_SUAVE = "DCE7E2";
const ROSA = "C79AA1";
const FONDO = "F6F7F4";
const BORDE = "DCE5E0";
const TEXTO = "24302C";
const SECUNDARIO = "6B756F";
const BLANCO = "FFFFFF";

export async function exportarReporteVentasExcel(
    datos: DatosExportacionReporteVentas,
) {
    const ExcelJS =
        await import("exceljs");

    const workbook =
        new ExcelJS.Workbook();

    workbook.creator =
        "Sistema de Salón";

    workbook.created =
        new Date();

    workbook.modified =
        new Date();

    workbook.title =
        "Reporte de ventas";

    workbook.subject =
        "Reporte comercial del salón";

    crearResumen(
        workbook,
        datos,
    );

    crearDetalleVentas(
        workbook,
        datos,
    );

    crearRanking(
        workbook,
        "Ventas por tipo",
        datos.porTipo,
        datos.simboloMoneda,
        VERDE,
    );

    crearRanking(
        workbook,
        "Métodos de pago",
        datos.porMetodo,
        datos.simboloMoneda,
        "8A9E95",
    );

    crearComportamientoDiario(
        workbook,
        datos,
    );

    const buffer =
        await workbook.xlsx.writeBuffer();

    const blob =
        new Blob(
            [buffer],
            {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        );

    const url =
        URL.createObjectURL(
            blob,
        );

    const enlace =
        document.createElement(
            "a",
        );

    enlace.href =
        url;

    enlace.download =
        construirNombreArchivo(
            datos,
        );

    document.body.appendChild(
        enlace,
    );

    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(
        url,
    );
}

function crearResumen(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionReporteVentas,
) {
    const hoja =
        workbook.addWorksheet(
            "Resumen",
            {
                views: [
                    {
                        showGridLines:
                            false,
                    },
                ],
            },
        );

    hoja.columns = [
        { width: 3 },
        { width: 26 },
        { width: 20 },
        { width: 5 },
        { width: 26 },
        { width: 20 },
        { width: 3 },
    ];

    hoja.mergeCells(
        "B2:F3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "REPORTE DE VENTAS";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 20,
        color: {
            argb: BLANCO,
        },
    };

    titulo.alignment = {
        horizontal:
            "center",
        vertical:
            "middle",
    };

    hoja.mergeCells(
        "B5:F5",
    );

    const periodo =
        hoja.getCell(
            "B5",
        );

    periodo.value =
        `Periodo: ${datos.fechaDesde ||
        "Inicio"
        } al ${datos.fechaHasta ||
        "Actualidad"
        } · ${datos.nombreSucursal
        }`;

    periodo.font = {
        bold: true,
        color: {
            argb: TEXTO,
        },
    };

    periodo.alignment = {
        horizontal:
            "center",
    };

    aplicarKpi(
        hoja,
        "B7:C8",
        "VENTAS",
        datos.cantidad,
        "0",
        VERDE,
    );

    aplicarKpi(
        hoja,
        "E7:F8",
        "TOTAL VENDIDO",
        datos.totalVendido,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE,
    );

    aplicarKpi(
        hoja,
        "B10:C11",
        "COBRADO",
        datos.cobrado,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE,
    );

    aplicarKpi(
        hoja,
        "E10:F11",
        "PENDIENTE",
        datos.pendiente,
        `"${datos.simboloMoneda}" #,##0.00`,
        ROSA,
    );

    aplicarKpi(
        hoja,
        "B13:C14",
        "TICKET PROMEDIO",
        datos.ticketPromedio,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE_OSCURO,
    );

    hoja.mergeCells(
        "E13:F13",
    );

    const filtrosTitulo =
        hoja.getCell(
            "E13",
        );

    filtrosTitulo.value =
        "FILTROS APLICADOS";

    filtrosTitulo.fill =
        relleno(
            VERDE_SUAVE,
        );

    filtrosTitulo.font = {
        bold: true,
        color: {
            argb:
                VERDE_OSCURO,
        },
    };

    filtrosTitulo.alignment = {
        horizontal:
            "center",
    };

    const filtros = [
        [
            "Tipo de venta",
            datos.tipoVenta,
        ],
        [
            "Estado de pago",
            datos.estadoPago,
        ],
        [
            "Método de pago",
            datos.metodoPago,
        ],
    ];

    let fila =
        14;

    for (
        const [
            etiqueta,
            valor,
        ] of filtros
    ) {
        hoja.getCell(
            `E${fila}`,
        ).value =
            etiqueta;

        hoja.getCell(
            `E${fila}`,
        ).font = {
            bold: true,
            color: {
                argb:
                    SECUNDARIO,
            },
        };

        hoja.getCell(
            `F${fila}`,
        ).value =
            valor;

        aplicarBordes(
            hoja,
            `E${fila}:F${fila}`,
        );

        fila +=
            1;
    }

    hoja.mergeCells(
        "B18:F18",
    );

    const seccion =
        hoja.getCell(
            "B18",
        );

    seccion.value =
        "INTERPRETACIÓN DEL PERIODO";

    seccion.fill =
        relleno(
            VERDE_SUAVE,
        );

    seccion.font = {
        bold: true,
        color: {
            argb:
                VERDE_OSCURO,
        },
    };

    seccion.alignment = {
        horizontal:
            "center",
    };

    hoja.mergeCells(
        "B20:F22",
    );

    const interpretacion =
        hoja.getCell(
            "B20",
        );

    const porcentajeCobrado =
        datos.totalVendido >
            0
            ? (
                datos.cobrado /
                datos.totalVendido
            ) *
            100
            : 0;

    interpretacion.value =
        `Durante el periodo seleccionado se registraron ${datos.cantidad} ventas por un total de ${datos.simboloMoneda} ${datos.totalVendido.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}. Se ha cobrado el ${porcentajeCobrado.toFixed(
            1,
        )}% del valor vendido y existe un saldo pendiente de ${datos.simboloMoneda} ${datos.pendiente.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}.`;

    interpretacion.alignment = {
        wrapText: true,
        vertical:
            "middle",
    };

    interpretacion.fill =
        relleno(
            FONDO,
        );

    aplicarBordes(
        hoja,
        "B20:F22",
    );

    hoja.pageSetup = {
        orientation:
            "landscape",
        fitToPage:
            true,
        fitToWidth:
            1,
        fitToHeight:
            0,
        margins: {
            left: 0.25,
            right: 0.25,
            top: 0.4,
            bottom: 0.4,
            header: 0.2,
            footer: 0.2,
        },
    };
}

function crearDetalleVentas(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionReporteVentas,
) {
    const hoja =
        workbook.addWorksheet(
            "Detalle de ventas",
            {
                views: [
                    {
                        state:
                            "frozen",
                        ySplit:
                            5,
                        showGridLines:
                            false,
                    },
                ],
            },
        );

    hoja.columns = [
        { width: 3 },
        { width: 20 },
        { width: 19 },
        { width: 18 },
        { width: 24 },
        { width: 17 },
        { width: 24 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:K3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "DETALLE DE VENTAS";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 17,
        color: {
            argb: BLANCO,
        },
    };

    titulo.alignment = {
        horizontal:
            "center",
        vertical:
            "middle",
    };

    const cabeceras = [
        "Fecha",
        "Código",
        "Tipo",
        "Sucursal",
        "Estado pago",
        "Método",
        "Subtotal",
        "Descuento",
        "Total",
        "Cobrado",
        "Pendiente",
    ];

    cabeceras.forEach(
        (
            cabecera,
            indice,
        ) => {
            const celda =
                hoja.getCell(
                    5,
                    indice +
                    2,
                );

            celda.value =
                cabecera;

            estiloCabecera(
                celda,
            );
        },
    );

    let fila =
        6;

    for (
        const venta of datos.ventas
    ) {
        const metodos =
            Array.from(
                new Set(
                    venta.venta_pagos
                        .filter(
                            (
                                pago,
                            ) =>
                                pago.estado ===
                                "APLICADO",
                        )
                        .map(
                            (
                                pago,
                            ) =>
                                formatearMetodo(
                                    pago.metodo_pago,
                                ),
                        ),
                ),
            ).join(
                " + ",
            ) ||
            "—";

        const valores = [
            new Date(
                venta.fecha_venta,
            ),
            venta.codigo_venta,
            formatearTipo(
                venta.tipo_venta,
            ),
            venta.sucursales
                ?.nombre ??
            "Sin sucursal",
            venta.estado_pago,
            metodos,
            Number(
                venta.subtotal,
            ),
            Number(
                venta.descuento,
            ),
            Number(
                venta.total,
            ),
            Number(
                venta.monto_pagado,
            ),
            Number(
                venta.saldo_pendiente,
            ),
        ];

        valores.forEach(
            (
                valor,
                indice,
            ) => {
                const celda =
                    hoja.getCell(
                        fila,
                        indice +
                        2,
                    );

                celda.value =
                    valor;

                celda.border =
                    bordes();

                celda.fill =
                    relleno(
                        fila %
                            2 ===
                            0
                            ? "FBFCFA"
                            : BLANCO,
                    );

                celda.alignment = {
                    vertical:
                        "middle",
                    wrapText:
                        indice ===
                        5,
                };
            },
        );

        hoja.getCell(
            fila,
            2,
        ).numFmt =
            "dd/mm/yyyy hh:mm";

        for (
            let columna =
                8;
            columna <=
            12;
            columna++
        ) {
            hoja.getCell(
                fila,
                columna,
            ).numFmt =
                `"${datos.simboloMoneda}" #,##0.00`;
        }

        hoja.getCell(
            fila,
            6,
        ).font = {
            bold: true,
            color: {
                argb:
                    venta.estado_pago ===
                        "PAGADA"
                        ? VERDE
                        : venta.estado_pago ===
                            "ANULADA"
                            ? ROSA
                            : "8A6A28",
            },
        };

        hoja.getCell(
            fila,
            11,
        ).font = {
            bold: true,
            color: {
                argb:
                    VERDE,
            },
        };

        hoja.getCell(
            fila,
            12,
        ).font = {
            bold: true,
            color: {
                argb:
                    ROSA,
            },
        };

        fila +=
            1;
    }

    hoja.autoFilter = {
        from: {
            row: 5,
            column: 2,
        },
        to: {
            row: Math.max(
                fila -
                1,
                5,
            ),
            column:
                12,
        },
    };

    const totalFila =
        fila +
        1;

    hoja.mergeCells(
        `B${totalFila}:J${totalFila}`,
    );

    hoja.getCell(
        `B${totalFila}`,
    ).value =
        "TOTAL VENDIDO";

    hoja.getCell(
        `B${totalFila}`,
    ).fill =
        relleno(
            VERDE_OSCURO,
        );

    hoja.getCell(
        `B${totalFila}`,
    ).font = {
        bold: true,
        color: {
            argb: BLANCO,
        },
    };

    hoja.getCell(
        `B${totalFila}`,
    ).alignment = {
        horizontal:
            "right",
    };

    hoja.getCell(
        `K${totalFila}`,
    ).value =
        datos.totalVendido;

    hoja.getCell(
        `K${totalFila}`,
    ).numFmt =
        `"${datos.simboloMoneda}" #,##0.00`;

    hoja.getCell(
        `K${totalFila}`,
    ).fill =
        relleno(
            VERDE_OSCURO,
        );

    hoja.getCell(
        `K${totalFila}`,
    ).font = {
        bold: true,
        color: {
            argb: BLANCO,
        },
    };
}

function crearRanking(
    workbook: import("exceljs").Workbook,
    nombreHoja: string,
    datos: Ranking[],
    simboloMoneda: string,
    color: string,
) {
    const hoja =
        workbook.addWorksheet(
            nombreHoja,
            {
                views: [
                    {
                        showGridLines:
                            false,
                    },
                ],
            },
        );

    hoja.columns = [
        { width: 3 },
        { width: 32 },
        { width: 20 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:D3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        nombreHoja.toUpperCase();

    titulo.fill =
        relleno(
            color,
        );

    titulo.font = {
        bold: true,
        size: 17,
        color: {
            argb: BLANCO,
        },
    };

    titulo.alignment = {
        horizontal:
            "center",
        vertical:
            "middle",
    };

    [
        "Categoría",
        "Monto",
        "% del total",
    ].forEach(
        (
            cabecera,
            indice,
        ) => {
            const celda =
                hoja.getCell(
                    5,
                    indice +
                    2,
                );

            celda.value =
                cabecera;

            estiloCabecera(
                celda,
            );
        },
    );

    let fila =
        6;

    for (
        const dato of datos
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            dato.nombre;

        hoja.getCell(
            fila,
            3,
        ).value =
            dato.total;

        hoja.getCell(
            fila,
            3,
        ).numFmt =
            `"${simboloMoneda}" #,##0.00`;

        hoja.getCell(
            fila,
            4,
        ).value =
            dato.porcentaje /
            100;

        hoja.getCell(
            fila,
            4,
        ).numFmt =
            "0.0%";

        for (
            let columna =
                2;
            columna <=
            4;
            columna++
        ) {
            hoja.getCell(
                fila,
                columna,
            ).border =
                bordes();

            hoja.getCell(
                fila,
                columna,
            ).fill =
                relleno(
                    fila %
                        2 ===
                        0
                        ? "FBFCFA"
                        : BLANCO,
                );
        }

        fila +=
            1;
    }
}

function crearComportamientoDiario(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionReporteVentas,
) {
    const hoja =
        workbook.addWorksheet(
            "Comportamiento diario",
            {
                views: [
                    {
                        showGridLines:
                            false,
                    },
                ],
            },
        );

    hoja.columns = [
        { width: 3 },
        { width: 18 },
        { width: 22 },
    ];

    hoja.mergeCells(
        "B2:C3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "COMPORTAMIENTO DIARIO";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 17,
        color: {
            argb: BLANCO,
        },
    };

    titulo.alignment = {
        horizontal:
            "center",
        vertical:
            "middle",
    };

    [
        "Fecha",
        "Total vendido",
    ].forEach(
        (
            cabecera,
            indice,
        ) => {
            const celda =
                hoja.getCell(
                    5,
                    indice +
                    2,
                );

            celda.value =
                cabecera;

            estiloCabecera(
                celda,
            );
        },
    );

    let fila =
        6;

    for (
        const dia of datos.porDia
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            dia.fecha;

        hoja.getCell(
            fila,
            3,
        ).value =
            dia.total;

        hoja.getCell(
            fila,
            3,
        ).numFmt =
            `"${datos.simboloMoneda}" #,##0.00`;

        aplicarBordes(
            hoja,
            `B${fila}:C${fila}`,
        );

        fila +=
            1;
    }
}

function aplicarKpi(
    hoja: import("exceljs").Worksheet,
    rango: string,
    titulo: string,
    valor: number,
    formato: string,
    color: string,
) {
    const [
        inicio,
        fin,
    ] =
        rango.split(
            ":",
        );

    const coordenadasInicio =
        parsearCelda(
            inicio,
        );

    const coordenadasFin =
        parsearCelda(
            fin,
        );

    const filaTitulo =
        coordenadasInicio.fila;

    const filaValor =
        coordenadasFin.fila;

    hoja.mergeCells(
        `${numeroAColumna(
            coordenadasInicio.columna,
        )}${filaTitulo}:${numeroAColumna(
            coordenadasFin.columna,
        )}${filaTitulo}`,
    );

    hoja.mergeCells(
        `${numeroAColumna(
            coordenadasInicio.columna,
        )}${filaValor}:${numeroAColumna(
            coordenadasFin.columna,
        )}${filaValor}`,
    );

    const celdaTitulo =
        hoja.getCell(
            filaTitulo,
            coordenadasInicio.columna,
        );

    celdaTitulo.value =
        titulo;

    celdaTitulo.fill =
        relleno(
            FONDO,
        );

    celdaTitulo.font = {
        bold: true,
        color: {
            argb:
                SECUNDARIO,
        },
    };

    celdaTitulo.alignment = {
        horizontal:
            "center",
    };

    const celdaValor =
        hoja.getCell(
            filaValor,
            coordenadasInicio.columna,
        );

    celdaValor.value =
        valor;

    celdaValor.numFmt =
        formato;

    celdaValor.font = {
        bold: true,
        size: 18,
        color: {
            argb:
                color,
        },
    };

    celdaValor.alignment = {
        horizontal:
            "center",
    };

    aplicarBordes(
        hoja,
        rango,
    );
}

function estiloCabecera(
    celda: import("exceljs").Cell,
) {
    celda.fill =
        relleno(
            VERDE_OSCURO,
        );

    celda.font = {
        bold: true,
        color: {
            argb:
                BLANCO,
        },
    };

    celda.alignment = {
        horizontal:
            "center",
        vertical:
            "middle",
        wrapText:
            true,
    };

    celda.border =
        bordes();
}

function aplicarBordes(
    hoja: import("exceljs").Worksheet,
    rango: string,
) {
    const [
        inicio,
        fin,
    ] =
        rango.split(
            ":",
        );

    const a =
        parsearCelda(
            inicio,
        );

    const b =
        parsearCelda(
            fin,
        );

    for (
        let fila =
            a.fila;
        fila <=
        b.fila;
        fila++
    ) {
        for (
            let columna =
                a.columna;
            columna <=
            b.columna;
            columna++
        ) {
            hoja.getCell(
                fila,
                columna,
            ).border =
                bordes();
        }
    }
}

function bordes(): Partial<import("exceljs").Borders> {
    const borde = {
        style:
            "thin" as const,
        color: {
            argb:
                BORDE,
        },
    };

    return {
        top: borde,
        left: borde,
        bottom: borde,
        right: borde,
    };
}

function relleno(
    argb: string,
): import("exceljs").Fill {
    return {
        type:
            "pattern",
        pattern:
            "solid",
        fgColor: {
            argb,
        },
    };
}

function parsearCelda(
    referencia: string,
) {
    const coincidencia =
        referencia.match(
            /^([A-Z]+)(\d+)$/,
        );

    if (
        !coincidencia
    ) {
        throw new Error(
            `Referencia inválida: ${referencia}`,
        );
    }

    return {
        columna:
            columnaANumero(
                coincidencia[
                1
                ],
            ),

        fila:
            Number(
                coincidencia[
                2
                ],
            ),
    };
}

function columnaANumero(
    valor: string,
) {
    let resultado =
        0;

    for (
        const caracter of valor
    ) {
        resultado =
            resultado *
            26 +
            caracter.charCodeAt(
                0,
            ) -
            64;
    }

    return resultado;
}

function numeroAColumna(
    numero: number,
) {
    let resultado =
        "";

    let actual =
        numero;

    while (
        actual >
        0
    ) {
        const resto =
            (
                actual -
                1
            ) %
            26;

        resultado =
            String.fromCharCode(
                65 +
                resto,
            ) +
            resultado;

        actual =
            Math.floor(
                (
                    actual -
                    1
                ) /
                26,
            );
    }

    return resultado;
}

function construirNombreArchivo(
    datos: DatosExportacionReporteVentas,
) {
    const desde =
        datos.fechaDesde ||
        "inicio";

    const hasta =
        datos.fechaHasta ||
        "actual";

    const sucursal =
        datos.nombreSucursal
            .normalize(
                "NFD",
            )
            .replace(
                /[\u0300-\u036f]/g,
                "",
            )
            .replace(
                /[^a-zA-Z0-9]+/g,
                "_",
            )
            .replace(
                /^_+|_+$/g,
                "",
            );

    return `Reporte_Ventas_${desde}_${hasta}_${sucursal || "Salon"}.xlsx`;
}

function formatearTipo(
    valor: string,
) {
    return (
        {
            CITA:
                "Cita",
            DIRECTA:
                "Venta directa",
            PRODUCTOS:
                "Productos",
            MIXTA:
                "Mixta",
        }[valor] ??
        valor
    );
}

function formatearMetodo(
    valor: string,
) {
    return (
        {
            EFECTIVO:
                "Efectivo",
            TARJETA:
                "Tarjeta",
            TRANSFERENCIA:
                "Transferencia",
            DEPOSITO:
                "Depósito",
            CHEQUE:
                "Cheque",
            CREDITO:
                "Crédito",
            OTRO:
                "Otro",
        }[valor] ??
        valor
    );
}