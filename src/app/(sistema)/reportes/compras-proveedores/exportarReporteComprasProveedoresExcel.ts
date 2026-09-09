"use client";

import type {
    CompraReporteProveedores,
} from "./ReporteComprasProveedoresClient";

type ResumenProveedor = {
    nombre: string;
    codigo: string;
    compras: number;
    total: number;
    pagado: number;
    pendiente: number;
    porcentaje: number;
};

type ResumenMes = {
    clave: string;
    etiqueta: string;
    total: number;
    pagado: number;
    pendiente: number;
};

type CondicionResumen = {
    nombre: string;
    cantidad: number;
    total: number;
};

export type DatosExportacionComprasProveedores = {
    simboloMoneda: string;

    fechaDesde: string;
    fechaHasta: string;

    nombreSucursal: string;
    nombreProveedor: string;
    estado: string;
    condicionPago: string;

    resumen: {
        compras: number;
        confirmadas: number;
        totalComprado: number;
        pagado: number;
        pendiente: number;
        proveedoresUsados: number;
    };

    compras: CompraReporteProveedores[];
    porProveedor: ResumenProveedor[];
    porMes: ResumenMes[];
    porCondicion: CondicionResumen[];
};

const VERDE_OSCURO = "26332F";
const VERDE = "6F8F83";
const VERDE_SUAVE = "DCE7E2";
const ROSA = "C79AA1";
const FONDO = "F6F7F4";
const BORDE = "DCE5E0";
const SECUNDARIO = "6B756F";
const BLANCO = "FFFFFF";

export async function exportarReporteComprasProveedoresExcel(
    datos: DatosExportacionComprasProveedores,
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
        "Reporte de compras y proveedores";

    crearResumen(
        workbook,
        datos,
    );

    crearDetalleCompras(
        workbook,
        datos,
    );

    crearDetalleProductos(
        workbook,
        datos,
    );

    crearProveedores(
        workbook,
        datos,
    );

    crearTendencia(
        workbook,
        datos,
    );

    crearCondiciones(
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
    datos: DatosExportacionComprasProveedores,
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
        { width: 28 },
        { width: 20 },
        { width: 5 },
        { width: 28 },
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
        "REPORTE DE COMPRAS Y PROVEEDORES";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 20,
        color: {
            argb:
                BLANCO,
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
        `Periodo: ${datos.fechaDesde || "Inicio"} al ${datos.fechaHasta || "Actualidad"} · ${datos.nombreSucursal}`;

    periodo.font = {
        bold: true,
        color: {
            argb:
                VERDE_OSCURO,
        },
    };

    periodo.alignment = {
        horizontal:
            "center",
    };

    aplicarKpi(
        hoja,
        "B7:C8",
        "COMPRAS",
        datos.resumen.compras,
        "0",
        VERDE_OSCURO,
    );

    aplicarKpi(
        hoja,
        "E7:F8",
        "CONFIRMADAS",
        datos.resumen.confirmadas,
        "0",
        VERDE,
    );

    aplicarKpi(
        hoja,
        "B10:C11",
        "TOTAL COMPRADO",
        datos.resumen.totalComprado,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE_OSCURO,
    );

    aplicarKpi(
        hoja,
        "E10:F11",
        "PAGADO",
        datos.resumen.pagado,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE,
    );

    aplicarKpi(
        hoja,
        "B13:C14",
        "PENDIENTE",
        datos.resumen.pendiente,
        `"${datos.simboloMoneda}" #,##0.00`,
        ROSA,
    );

    aplicarKpi(
        hoja,
        "E13:F14",
        "PROVEEDORES USADOS",
        datos.resumen.proveedoresUsados,
        "0",
        VERDE_OSCURO,
    );

    hoja.mergeCells(
        "B17:F17",
    );

    const filtrosTitulo =
        hoja.getCell(
            "B17",
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
            "Proveedor",
            datos.nombreProveedor,
        ],
        [
            "Sucursal",
            datos.nombreSucursal,
        ],
        [
            "Estado",
            datos.estado,
        ],
        [
            "Condición",
            datos.condicionPago,
        ],
    ];

    let fila =
        19;

    for (
        const [
            etiqueta,
            valor,
        ] of filtros
    ) {
        hoja.mergeCells(
            `B${fila}:C${fila}`,
        );

        hoja.getCell(
            `B${fila}`,
        ).value =
            etiqueta;

        hoja.getCell(
            `B${fila}`,
        ).font = {
            bold: true,
            color: {
                argb:
                    SECUNDARIO,
            },
        };

        hoja.mergeCells(
            `D${fila}:F${fila}`,
        );

        hoja.getCell(
            `D${fila}`,
        ).value =
            valor;

        aplicarBordes(
            hoja,
            `B${fila}:F${fila}`,
        );

        fila +=
            1;
    }

    hoja.mergeCells(
        "B25:F25",
    );

    const lecturaTitulo =
        hoja.getCell(
            "B25",
        );

    lecturaTitulo.value =
        "LECTURA DEL PERIODO";

    lecturaTitulo.fill =
        relleno(
            VERDE_SUAVE,
        );

    lecturaTitulo.font = {
        bold: true,
        color: {
            argb:
                VERDE_OSCURO,
        },
    };

    lecturaTitulo.alignment = {
        horizontal:
            "center",
    };

    hoja.mergeCells(
        "B27:F29",
    );

    const lectura =
        hoja.getCell(
            "B27",
        );

    lectura.value =
        `En el periodo seleccionado se registraron ${datos.resumen.compras} compras, de las cuales ${datos.resumen.confirmadas} están confirmadas. El total comprado asciende a ${datos.simboloMoneda} ${datos.resumen.totalComprado.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}; se han pagado ${datos.simboloMoneda} ${datos.resumen.pagado.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )} y quedan ${datos.simboloMoneda} ${datos.resumen.pendiente.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )} pendientes.`;

    lectura.alignment = {
        wrapText: true,
        vertical:
            "middle",
    };

    lectura.fill =
        relleno(
            FONDO,
        );

    aplicarBordes(
        hoja,
        "B27:F29",
    );
}

function crearDetalleCompras(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionComprasProveedores,
) {
    const hoja =
        workbook.addWorksheet(
            "Detalle de compras",
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
        { width: 20 },
        { width: 18 },
        { width: 30 },
        { width: 24 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:M3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "DETALLE DE COMPRAS";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 17,
        color: {
            argb:
                BLANCO,
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
        "Código",
        "Factura",
        "Proveedor",
        "Sucursal",
        "Condición",
        "Estado",
        "Estado pago",
        "Subtotal",
        "Total",
        "Pagado",
        "Pendiente",
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
        const compra of datos.compras
    ) {
        const valores = [
            new Date(
                compra.fecha_compra,
            ),
            compra.codigo_compra,
            compra.numero_factura ??
            "—",
            compra.proveedores
                ?.nombre ??
            "Sin proveedor",
            compra.sucursales
                ?.nombre ??
            "Sin sucursal",
            formatearCondicion(
                compra.condicion_pago,
            ),
            formatearEstado(
                compra.estado,
            ),
            compra.estado_pago,
            Number(
                compra.subtotal,
            ),
            Number(
                compra.total,
            ),
            Number(
                compra.monto_pagado,
            ),
            Number(
                compra.saldo_pendiente,
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
                10;
            columna <=
            13;
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
            13,
        ).font = {
            bold: true,
            color: {
                argb:
                    Number(
                        compra.saldo_pendiente,
                    ) >
                        0
                        ? ROSA
                        : VERDE,
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
                13,
        },
    };
}

function crearDetalleProductos(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionComprasProveedores,
) {
    const hoja =
        workbook.addWorksheet(
            "Productos comprados",
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
        { width: 18 },
        { width: 20 },
        { width: 30 },
        { width: 18 },
        { width: 28 },
        { width: 16 },
        { width: 16 },
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
        "PRODUCTOS COMPRADOS";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 17,
        color: {
            argb:
                BLANCO,
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
        "Compra",
        "Proveedor",
        "Código producto",
        "Producto",
        "Unidad",
        "Cantidad",
        "Costo unitario",
        "Descuento",
        "Total línea",
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
        const compra of datos.compras
    ) {
        for (
            const detalle of compra.compra_detalles
        ) {
            const valores = [
                new Date(
                    compra.fecha_compra,
                ),
                compra.codigo_compra,
                compra.proveedores
                    ?.nombre ??
                "Sin proveedor",
                detalle.productos
                    ?.codigo_producto ??
                "—",
                detalle.productos
                    ?.nombre ??
                "Producto",
                detalle.productos
                    ?.unidad_medida ??
                "—",
                Number(
                    detalle.cantidad,
                ),
                Number(
                    detalle.costo_unitario,
                ),
                Number(
                    detalle.descuento,
                ),
                Number(
                    detalle.total,
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
                },
            );

            hoja.getCell(
                fila,
                2,
            ).numFmt =
                "dd/mm/yyyy";

            for (
                let columna =
                    9;
                columna <=
                11;
                columna++
            ) {
                hoja.getCell(
                    fila,
                    columna,
                ).numFmt =
                    `"${datos.simboloMoneda}" #,##0.00`;
            }

            fila +=
                1;
        }
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
                11,
        },
    };
}

function crearProveedores(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionComprasProveedores,
) {
    const hoja =
        workbook.addWorksheet(
            "Proveedores",
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
        { width: 34 },
        { width: 16 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:H3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "COMPRAS POR PROVEEDOR";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 17,
        color: {
            argb:
                BLANCO,
        },
    };

    titulo.alignment = {
        horizontal:
            "center",
        vertical:
            "middle",
    };

    [
        "Código",
        "Proveedor",
        "Compras",
        "Total",
        "Pagado",
        "Pendiente",
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
        const item of datos.porProveedor
    ) {
        const valores = [
            item.codigo,
            item.nombre,
            item.compras,
            item.total,
            item.pagado,
            item.pendiente,
            item.porcentaje /
            100,
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
            },
        );

        for (
            let columna =
                5;
            columna <=
            7;
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
            8,
        ).numFmt =
            "0.0%";

        fila +=
            1;
    }
}

function crearTendencia(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionComprasProveedores,
) {
    const hoja =
        workbook.addWorksheet(
            "Tendencia mensual",
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
        { width: 20 },
        { width: 20 },
        { width: 20 },
    ];

    hoja.mergeCells(
        "B2:E3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "TENDENCIA DE COMPRAS";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 17,
        color: {
            argb:
                BLANCO,
        },
    };

    titulo.alignment = {
        horizontal:
            "center",
        vertical:
            "middle",
    };

    [
        "Mes",
        "Comprado",
        "Pagado",
        "Pendiente",
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
        const item of datos.porMes
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            item.clave;

        hoja.getCell(
            fila,
            3,
        ).value =
            item.total;

        hoja.getCell(
            fila,
            4,
        ).value =
            item.pagado;

        hoja.getCell(
            fila,
            5,
        ).value =
            item.pendiente;

        for (
            let columna =
                3;
            columna <=
            5;
            columna++
        ) {
            hoja.getCell(
                fila,
                columna,
            ).numFmt =
                `"${datos.simboloMoneda}" #,##0.00`;
        }

        aplicarBordes(
            hoja,
            `B${fila}:E${fila}`,
        );

        fila +=
            1;
    }
}

function crearCondiciones(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionComprasProveedores,
) {
    const hoja =
        workbook.addWorksheet(
            "Condiciones de pago",
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
        { width: 28 },
        { width: 18 },
        { width: 20 },
    ];

    hoja.mergeCells(
        "B2:D3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "CONDICIONES DE PAGO";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 17,
        color: {
            argb:
                BLANCO,
        },
    };

    titulo.alignment = {
        horizontal:
            "center",
        vertical:
            "middle",
    };

    [
        "Condición",
        "Compras",
        "Total",
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
        const item of datos.porCondicion
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            item.nombre;

        hoja.getCell(
            fila,
            3,
        ).value =
            item.cantidad;

        hoja.getCell(
            fila,
            4,
        ).value =
            item.total;

        hoja.getCell(
            fila,
            4,
        ).numFmt =
            `"${datos.simboloMoneda}" #,##0.00`;

        aplicarBordes(
            hoja,
            `B${fila}:D${fila}`,
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

    const a =
        parsearCelda(
            inicio,
        );

    const b =
        parsearCelda(
            fin,
        );

    hoja.mergeCells(
        `${numeroAColumna(
            a.columna,
        )}${a.fila}:${numeroAColumna(
            b.columna,
        )}${a.fila}`,
    );

    hoja.mergeCells(
        `${numeroAColumna(
            a.columna,
        )}${b.fila}:${numeroAColumna(
            b.columna,
        )}${b.fila}`,
    );

    const tituloCelda =
        hoja.getCell(
            a.fila,
            a.columna,
        );

    tituloCelda.value =
        titulo;

    tituloCelda.fill =
        relleno(
            FONDO,
        );

    tituloCelda.font = {
        bold: true,
        color: {
            argb:
                SECUNDARIO,
        },
    };

    tituloCelda.alignment = {
        horizontal:
            "center",
    };

    const valorCelda =
        hoja.getCell(
            b.fila,
            a.columna,
        );

    valorCelda.value =
        valor;

    valorCelda.numFmt =
        formato;

    valorCelda.font = {
        bold: true,
        size: 18,
        color: {
            argb:
                color,
        },
    };

    valorCelda.alignment = {
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
    datos: DatosExportacionComprasProveedores,
) {
    const proveedor =
        datos.nombreProveedor
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

    return `Reporte_Compras_${datos.fechaDesde || "inicio"}_${datos.fechaHasta || "actual"}_${proveedor || "Proveedores"}.xlsx`;
}

function formatearEstado(
    valor: string,
) {
    return (
        {
            BORRADOR:
                "Borrador",
            CONFIRMADA:
                "Confirmada",
            ANULADA:
                "Anulada",
        }[valor] ??
        valor
    );
}

function formatearCondicion(
    valor: string,
) {
    return (
        {
            CONTADO:
                "Contado",
            CREDITO:
                "Crédito",
            MIXTA:
                "Mixta",
        }[valor] ??
        valor
    );
}
