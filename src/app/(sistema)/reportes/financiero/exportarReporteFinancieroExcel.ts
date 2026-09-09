"use client";

import type {
    MovimientoReporteFinanciero,
} from "./ReporteFinancieroClient";

type CategoriaResumen = {
    nombre: string;
    tipo: string;
    total: number;
    porcentaje: number;
};

type RankingResumen = {
    nombre: string;
    total: number;
    porcentaje: number;
};

type TendenciaResumen = {
    clave: string;
    etiqueta: string;
    ingresos: number;
    gastos: number;
    utilidad: number;
};

export type DatosExportacionReporteFinanciero = {
    simboloMoneda: string;

    fechaDesde: string;
    fechaHasta: string;
    nombreSucursal: string;

    tipo: string;
    estado: string;
    categoria: string;
    origen: string;
    metodoPago: string;

    ingresos: number;
    gastos: number;
    utilidad: number;
    margen: number;
    cantidad: number;

    movimientos: MovimientoReporteFinanciero[];
    porCategoria: CategoriaResumen[];
    porOrigen: RankingResumen[];
    porMetodo: RankingResumen[];
    tendencia: TendenciaResumen[];
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

export async function exportarReporteFinancieroExcel(
    datos: DatosExportacionReporteFinanciero,
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
        "Reporte financiero";

    workbook.subject =
        "Ingresos, gastos y utilidad";

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

    crearRanking(
        workbook,
        "Origen de movimientos",
        datos.porOrigen,
        datos.simboloMoneda,
    );

    crearRanking(
        workbook,
        "Métodos de pago",
        datos.porMetodo,
        datos.simboloMoneda,
    );

    crearTendencia(
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
    datos: DatosExportacionReporteFinanciero,
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
        "REPORTE FINANCIERO";

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
        `Periodo: ${datos.fechaDesde || "Inicio"} al ${datos.fechaHasta || "Actualidad"} · ${datos.nombreSucursal}`;

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
        "INGRESOS",
        datos.ingresos,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE,
    );

    aplicarKpi(
        hoja,
        "E7:F8",
        "GASTOS",
        datos.gastos,
        `"${datos.simboloMoneda}" #,##0.00`,
        ROSA,
    );

    aplicarKpi(
        hoja,
        "B10:C11",
        "UTILIDAD",
        datos.utilidad,
        `"${datos.simboloMoneda}" #,##0.00`,
        datos.utilidad >=
            0
            ? VERDE
            : ROSA,
    );

    aplicarKpi(
        hoja,
        "E10:F11",
        "MARGEN",
        datos.margen /
        100,
        "0.0%",
        datos.margen >=
            0
            ? VERDE
            : ROSA,
    );

    aplicarKpi(
        hoja,
        "B13:C14",
        "MOVIMIENTOS",
        datos.cantidad,
        "0",
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
            "Tipo",
            datos.tipo,
        ],
        [
            "Estado",
            datos.estado,
        ],
        [
            "Categoría",
            datos.categoria,
        ],
        [
            "Origen",
            datos.origen,
        ],
        [
            "Método",
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
        "B21:F21",
    );

    const interpretacionTitulo =
        hoja.getCell(
            "B21",
        );

    interpretacionTitulo.value =
        "LECTURA DEL PERIODO";

    interpretacionTitulo.fill =
        relleno(
            VERDE_SUAVE,
        );

    interpretacionTitulo.font = {
        bold: true,
        color: {
            argb:
                VERDE_OSCURO,
        },
    };

    interpretacionTitulo.alignment = {
        horizontal:
            "center",
    };

    hoja.mergeCells(
        "B23:F25",
    );

    const interpretacion =
        hoja.getCell(
            "B23",
        );

    interpretacion.value =
        `En el periodo seleccionado se registraron ${datos.cantidad} movimientos. Los ingresos suman ${datos.simboloMoneda} ${datos.ingresos.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}, los gastos ${datos.simboloMoneda} ${datos.gastos.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )} y la utilidad resultante es ${datos.simboloMoneda} ${datos.utilidad.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}, con un margen de ${datos.margen.toFixed(
            1,
        )}%.`;

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
        "B23:F25",
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
    };
}

function crearDetalle(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionReporteFinanciero,
) {
    const hoja =
        workbook.addWorksheet(
            "Detalle financiero",
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
        { width: 14 },
        { width: 36 },
        { width: 28 },
        { width: 22 },
        { width: 18 },
        { width: 25 },
        { width: 16 },
        { width: 20 },
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
        "DETALLE DE MOVIMIENTOS FINANCIEROS";

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
        "Tipo",
        "Concepto",
        "Categoría",
        "Origen",
        "Método",
        "Sucursal",
        "Estado",
        "Referencia",
        "Monto",
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
        const movimiento of datos.movimientos
    ) {
        const valores = [
            new Date(
                movimiento.fecha_movimiento,
            ),
            movimiento.tipo ===
                "INGRESO"
                ? "Ingreso"
                : "Gasto",
            movimiento.concepto,
            movimiento
                .categorias_financieras
                ?.nombre ??
            "Sin categoría",
            formatearOrigen(
                movimiento.origen,
            ),
            formatearMetodo(
                movimiento.metodo_pago,
            ),
            movimiento
                .sucursales
                ?.nombre ??
            "Sin sucursal",
            movimiento.estado,
            movimiento.referencia ??
            "—",
            Number(
                movimiento.monto,
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
                        2 ||
                        indice ===
                        3,
                };
            },
        );

        hoja.getCell(
            fila,
            2,
        ).numFmt =
            "dd/mm/yyyy hh:mm";

        hoja.getCell(
            fila,
            11,
        ).numFmt =
            `"${datos.simboloMoneda}" #,##0.00`;

        hoja.getCell(
            fila,
            3,
        ).font = {
            bold: true,
            color: {
                argb:
                    movimiento.tipo ===
                        "INGRESO"
                        ? VERDE
                        : ROSA,
            },
        };

        hoja.getCell(
            fila,
            11,
        ).font = {
            bold: true,
            color: {
                argb:
                    movimiento.tipo ===
                        "INGRESO"
                        ? VERDE
                        : ROSA,
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
                11,
        },
    };
}

function crearCategorias(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionReporteFinanciero,
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
        { width: 32 },
        { width: 16 },
        { width: 20 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:E3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "MOVIMIENTO POR CATEGORÍA";

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
        "Categoría",
        "Tipo",
        "Monto",
        "% del movimiento",
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
            item.tipo;

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

        hoja.getCell(
            fila,
            5,
        ).value =
            item.porcentaje /
            100;

        hoja.getCell(
            fila,
            5,
        ).numFmt =
            "0.0%";

        for (
            let columna =
                2;
            columna <=
            5;
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

        hoja.getCell(
            fila,
            3,
        ).font = {
            bold: true,
            color: {
                argb:
                    item.tipo ===
                        "INGRESO"
                        ? VERDE
                        : ROSA,
            },
        };

        fila +=
            1;
    }
}

function crearRanking(
    workbook: import("exceljs").Workbook,
    nombreHoja: string,
    datos: RankingResumen[],
    simboloMoneda: string,
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
        { width: 34 },
        { width: 22 },
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
        "Concepto",
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
        const item of datos
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
            item.total;

        hoja.getCell(
            fila,
            3,
        ).numFmt =
            `"${simboloMoneda}" #,##0.00`;

        hoja.getCell(
            fila,
            4,
        ).value =
            item.porcentaje /
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

function crearTendencia(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionReporteFinanciero,
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
        { width: 16 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 16 },
    ];

    hoja.mergeCells(
        "B2:F3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "TENDENCIA FINANCIERA";

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
        "Mes",
        "Ingresos",
        "Gastos",
        "Utilidad",
        "Margen",
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
        const mes of datos.tendencia
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            mes.clave;

        hoja.getCell(
            fila,
            3,
        ).value =
            mes.ingresos;

        hoja.getCell(
            fila,
            4,
        ).value =
            mes.gastos;

        hoja.getCell(
            fila,
            5,
        ).value =
            mes.utilidad;

        hoja.getCell(
            fila,
            6,
        ).value =
            mes.ingresos >
                0
                ? mes.utilidad /
                mes.ingresos
                : 0;

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

        hoja.getCell(
            fila,
            6,
        ).numFmt =
            "0.0%";

        for (
            let columna =
                2;
            columna <=
            6;
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

        hoja.getCell(
            fila,
            5,
        ).font = {
            bold: true,
            color: {
                argb:
                    mes.utilidad >=
                        0
                        ? VERDE
                        : ROSA,
            },
        };

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
    datos: DatosExportacionReporteFinanciero,
) {
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

    return `Reporte_Financiero_${datos.fechaDesde || "inicio"}_${datos.fechaHasta || "actual"}_${sucursal || "Salon"}.xlsx`;
}

function formatearOrigen(
    valor: string,
) {
    return (
        {
            VENTA:
                "Ventas",
            PAGO_PROVEEDOR:
                "Pagos a proveedores",
            COMISION_POS:
                "Comisiones POS",
            MOVIMIENTO_CAJA:
                "Movimientos de caja",
            MANUAL:
                "Registros manuales",
            AJUSTE:
                "Ajustes",
            OTRO:
                "Otros",
        }[valor] ??
        valor
    );
}

function formatearMetodo(
    valor: string | null,
) {
    if (
        !valor
    ) {
        return "Sin método";
    }

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
