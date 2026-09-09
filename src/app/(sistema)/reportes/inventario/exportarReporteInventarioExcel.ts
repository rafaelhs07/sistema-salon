"use client";

import type {
    ProductoReporteInventario,
} from "./ReporteInventarioClient";

type ResumenCategoria = {
    nombre: string;
    cantidad: number;
    unidades: number;
    valorCosto: number;
    valorVenta: number;
    porcentaje: number;
};

export type DatosExportacionInventario = {
    simboloMoneda: string;
    filtroCategoria: string;
    filtroEstadoProducto: string;
    filtroEstadoStock: string;

    resumen: {
        productos: number;
        activos: number;
        bajos: number;
        agotados: number;
        unidades: number;
        valorCosto: number;
        valorVenta: number;
        margenPotencial: number;
    };

    productos: ProductoReporteInventario[];
    porCategoria: ResumenCategoria[];
    alertas: ProductoReporteInventario[];
};

const VERDE_OSCURO = "26332F";
const VERDE = "6F8F83";
const VERDE_SUAVE = "DCE7E2";
const ROSA = "C79AA1";
const AMBAR = "D8B36A";
const FONDO = "F6F7F4";
const BORDE = "DCE5E0";
const SECUNDARIO = "6B756F";
const BLANCO = "FFFFFF";

export async function exportarReporteInventarioExcel(
    datos: DatosExportacionInventario,
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
        "Reporte de inventario";

    crearResumen(
        workbook,
        datos,
    );

    crearDetalle(
        workbook,
        datos,
    );

    crearCategorias(
        workbook,
        datos,
    );

    crearAlertas(
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
        "Reporte_Inventario.xlsx";

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
    datos: DatosExportacionInventario,
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
        { width: 27 },
        { width: 20 },
        { width: 5 },
        { width: 27 },
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
        "REPORTE DE INVENTARIO";

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

    aplicarKpi(
        hoja,
        "B6:C7",
        "PRODUCTOS ACTIVOS",
        datos.resumen.activos,
        "0",
        VERDE,
    );

    aplicarKpi(
        hoja,
        "E6:F7",
        "STOCK BAJO",
        datos.resumen.bajos,
        "0",
        AMBAR,
    );

    aplicarKpi(
        hoja,
        "B9:C10",
        "AGOTADOS",
        datos.resumen.agotados,
        "0",
        ROSA,
    );

    aplicarKpi(
        hoja,
        "E9:F10",
        "UNIDADES",
        datos.resumen.unidades,
        "#,##0.00",
        VERDE_OSCURO,
    );

    aplicarKpi(
        hoja,
        "B12:C13",
        "VALOR A COSTO",
        datos.resumen.valorCosto,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE_OSCURO,
    );

    aplicarKpi(
        hoja,
        "E12:F13",
        "VALOR A VENTA",
        datos.resumen.valorVenta,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE,
    );

    aplicarKpi(
        hoja,
        "B15:C16",
        "MARGEN POTENCIAL",
        datos.resumen.margenPotencial,
        `"${datos.simboloMoneda}" #,##0.00`,
        datos.resumen.margenPotencial >=
            0
            ? VERDE
            : ROSA,
    );

    hoja.mergeCells(
        "E15:F15",
    );

    const filtrosTitulo =
        hoja.getCell(
            "E15",
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
            "Categoría",
            datos.filtroCategoria,
        ],
        [
            "Estado producto",
            datos.filtroEstadoProducto,
        ],
        [
            "Estado stock",
            datos.filtroEstadoStock,
        ],
    ];

    let fila =
        16;

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
        "B21:F21",
    );

    const lecturaTitulo =
        hoja.getCell(
            "B21",
        );

    lecturaTitulo.value =
        "LECTURA DEL INVENTARIO";

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
        "B23:F25",
    );

    const lectura =
        hoja.getCell(
            "B23",
        );

    lectura.value =
        `El inventario filtrado contiene ${datos.resumen.activos} productos activos y ${datos.resumen.unidades.toLocaleString(
            "es-NI",
        )} unidades. El valor a costo es ${datos.simboloMoneda} ${datos.resumen.valorCosto.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}, mientras el valor potencial de venta asciende a ${datos.simboloMoneda} ${datos.resumen.valorVenta.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}. Hay ${datos.resumen.bajos} productos con stock bajo y ${datos.resumen.agotados} agotados.`;

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
        "B23:F25",
    );
}

function crearDetalle(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionInventario,
) {
    const hoja =
        workbook.addWorksheet(
            "Detalle de inventario",
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
        { width: 30 },
        { width: 18 },
        { width: 20 },
        { width: 20 },
        { width: 16 },
        { width: 14 },
        { width: 14 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 16 },
    ];

    hoja.mergeCells(
        "B2:N3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "DETALLE DE INVENTARIO";

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

    const cabeceras = [
        "Código",
        "Producto",
        "Marca",
        "Presentación",
        "Categoría",
        "Unidad",
        "Stock",
        "Stock mínimo",
        "Costo unitario",
        "Precio venta",
        "Valor costo",
        "Valor venta",
        "Estado stock",
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
        const producto of datos.productos
    ) {
        const estadoStock =
            obtenerEstadoStock(
                producto,
            );

        const valorCosto =
            Number(
                producto.stock ??
                0,
            ) *
            Number(
                producto.costo_unitario ??
                0,
            );

        const valorVenta =
            Number(
                producto.stock ??
                0,
            ) *
            Number(
                producto.precio_venta ??
                0,
            );

        const valores = [
            producto.codigo_producto,
            producto.nombre,
            producto.marca ??
            "—",
            producto.presentacion ??
            "—",
            producto.categoria ??
            "Sin categoría",
            producto.unidad_medida,
            Number(
                producto.stock ??
                0,
            ),
            Number(
                producto.stock_minimo ??
                0,
            ),
            Number(
                producto.costo_unitario ??
                0,
            ),
            Number(
                producto.precio_venta ??
                0,
            ),
            valorCosto,
            valorVenta,
            estadoStock,
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
                        1 ||
                        indice ===
                        4,
                };
            },
        );

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
            14,
        ).font = {
            bold: true,
            color: {
                argb:
                    estadoStock ===
                        "AGOTADO"
                        ? ROSA
                        : estadoStock ===
                            "BAJO"
                            ? AMBAR
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
                14,
        },
    };
}

function crearCategorias(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionInventario,
) {
    const hoja =
        workbook.addWorksheet(
            "Categorías",
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
        { width: 30 },
        { width: 16 },
        { width: 16 },
        { width: 20 },
        { width: 20 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:G3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "INVENTARIO POR CATEGORÍA";

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
        "Categoría",
        "Productos",
        "Unidades",
        "Valor costo",
        "Valor venta",
        "% del costo",
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
        const item of datos.porCategoria
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
            item.unidades;

        hoja.getCell(
            fila,
            5,
        ).value =
            item.valorCosto;

        hoja.getCell(
            fila,
            6,
        ).value =
            item.valorVenta;

        hoja.getCell(
            fila,
            7,
        ).value =
            item.porcentaje /
            100;

        hoja.getCell(
            fila,
            5,
        ).numFmt =
            `"${datos.simboloMoneda}" #,##0.00`;

        hoja.getCell(
            fila,
            6,
        ).numFmt =
            `"${datos.simboloMoneda}" #,##0.00`;

        hoja.getCell(
            fila,
            7,
        ).numFmt =
            "0.0%";

        for (
            let columna =
                2;
            columna <=
            7;
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

function crearAlertas(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionInventario,
) {
    const hoja =
        workbook.addWorksheet(
            "Alertas de stock",
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
        { width: 32 },
        { width: 22 },
        { width: 16 },
        { width: 16 },
        { width: 20 },
    ];

    hoja.mergeCells(
        "B2:G3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "ALERTAS DE STOCK";

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
        "Producto",
        "Categoría",
        "Stock",
        "Mínimo",
        "Estado stock",
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
        const producto of datos.alertas
    ) {
        const estado =
            obtenerEstadoStock(
                producto,
            );

        const valores = [
            producto.codigo_producto,
            producto.nombre,
            producto.categoria ??
            "Sin categoría",
            Number(
                producto.stock ??
                0,
            ),
            Number(
                producto.stock_minimo ??
                0,
            ),
            estado,
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
                        estado ===
                            "AGOTADO"
                            ? "FBEDEF"
                            : "FFF8E5",
                    );
            },
        );

        hoja.getCell(
            fila,
            7,
        ).font = {
            bold: true,
            color: {
                argb:
                    estado ===
                        "AGOTADO"
                        ? ROSA
                        : AMBAR,
            },
        };

        fila +=
            1;
    }
}

function obtenerEstadoStock(
    producto: ProductoReporteInventario,
) {
    if (
        !producto.controla_stock
    ) {
        return "SIN_CONTROL";
    }

    const stock =
        Number(
            producto.stock ??
            0,
        );

    const minimo =
        Number(
            producto.stock_minimo ??
            0,
        );

    if (
        stock <=
        0
    ) {
        return "AGOTADO";
    }

    if (
        stock <=
        minimo
    ) {
        return "BAJO";
    }

    return "NORMAL";
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
