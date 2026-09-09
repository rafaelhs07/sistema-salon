"use client";

import type {
    ClienteReporte,
} from "./ReporteClientesClient";

type ClienteAnalizadoExportable = ClienteReporte & {
    citas: number;
    citasFinalizadas: number;
    citasCanceladas: number;
    ventas: number;
    totalComprado: number;
    totalPagado: number;
    saldoPendiente: number;
    ultimaActividad: string | null;
};

type RankingCliente = {
    nombre: string;
    codigo: string;
    cantidad: number;
    total: number;
};

export type DatosExportacionClientes = {
    simboloMoneda: string;
    fechaDesde: string;
    fechaHasta: string;
    filtroActividad: string;
    filtroSaldo: string;

    resumen: {
        clientes: number;
        activos: number;
        citas: number;
        ventas: number;
        totalComprado: number;
        totalPagado: number;
        saldoPendiente: number;
    };

    clientes: ClienteAnalizadoExportable[];
    topCompras: RankingCliente[];
    topFrecuencia: RankingCliente[];
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

export async function exportarReporteClientesExcel(
    datos: DatosExportacionClientes,
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
        "Reporte de clientes";

    crearResumen(
        workbook,
        datos,
    );

    crearDetalleClientes(
        workbook,
        datos,
    );

    crearRanking(
        workbook,
        "Clientes por compra",
        datos.topCompras,
        datos.simboloMoneda,
        false,
    );

    crearRanking(
        workbook,
        "Clientes frecuentes",
        datos.topFrecuencia,
        datos.simboloMoneda,
        true,
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
        `Reporte_Clientes_${datos.fechaDesde || "inicio"}_${datos.fechaHasta || "actual"}.xlsx`;

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
    datos: DatosExportacionClientes,
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
        "REPORTE DE CLIENTES";
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
        `Periodo: ${datos.fechaDesde || "Inicio"} al ${datos.fechaHasta || "Actualidad"}`;

    periodo.font = {
        bold: true,
        color: {
            argb:
                TEXTO,
        },
    };

    periodo.alignment = {
        horizontal:
            "center",
    };

    aplicarKpi(
        hoja,
        "B7:C8",
        "CLIENTES",
        datos.resumen.clientes,
        "0",
        VERDE_OSCURO,
    );

    aplicarKpi(
        hoja,
        "E7:F8",
        "CON ACTIVIDAD",
        datos.resumen.activos,
        "0",
        VERDE,
    );

    aplicarKpi(
        hoja,
        "B10:C11",
        "CITAS",
        datos.resumen.citas,
        "0",
        VERDE,
    );

    aplicarKpi(
        hoja,
        "E10:F11",
        "VENTAS",
        datos.resumen.ventas,
        "0",
        VERDE,
    );

    aplicarKpi(
        hoja,
        "B13:C14",
        "TOTAL COMPRADO",
        datos.resumen.totalComprado,
        `"${datos.simboloMoneda}" #,##0.00`,
        VERDE_OSCURO,
    );

    aplicarKpi(
        hoja,
        "E13:F14",
        "SALDO PENDIENTE",
        datos.resumen.saldoPendiente,
        `"${datos.simboloMoneda}" #,##0.00`,
        ROSA,
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
            "Actividad",
            datos.filtroActividad,
        ],
        [
            "Saldo",
            datos.filtroSaldo,
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
            `B${fila}:D${fila}`,
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
            `E${fila}:F${fila}`,
        );
        hoja.getCell(
            `E${fila}`,
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
        "B23:F23",
    );

    const lecturaTitulo =
        hoja.getCell(
            "B23",
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
        "B25:F27",
    );

    const lectura =
        hoja.getCell(
            "B25",
        );

    lectura.value =
        `En el periodo analizado hay ${datos.resumen.clientes} clientes dentro del filtro, de los cuales ${datos.resumen.activos} tuvieron actividad. Se registraron ${datos.resumen.citas} citas y ${datos.resumen.ventas} ventas. El valor comprado suma ${datos.simboloMoneda} ${datos.resumen.totalComprado.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}, con ${datos.simboloMoneda} ${datos.resumen.saldoPendiente.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )} pendientes por cobrar.`;

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
        "B25:F27",
    );
}

function crearDetalleClientes(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionClientes,
) {
    const hoja =
        workbook.addWorksheet(
            "Detalle de clientes",
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
        { width: 18 },
        { width: 28 },
        { width: 12 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:L3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "DETALLE DE CLIENTES";
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
        "Cliente",
        "Teléfono",
        "WhatsApp",
        "Correo",
        "Citas",
        "Ventas",
        "Comprado",
        "Pagado",
        "Pendiente",
        "Última actividad",
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
        const cliente of datos.clientes
    ) {
        const valores = [
            cliente.codigo_cliente ??
            "—",
            cliente.nombre_completo,
            cliente.telefono ??
            "—",
            cliente.whatsapp ??
            "—",
            cliente.correo ??
            "—",
            cliente.citas,
            cliente.ventas,
            cliente.totalComprado,
            cliente.totalPagado,
            cliente.saldoPendiente,
            cliente.ultimaActividad ??
            "Sin actividad",
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

        hoja.getCell(
            fila,
            10,
        ).font = {
            bold: true,
            color: {
                argb:
                    VERDE,
            },
        };

        hoja.getCell(
            fila,
            11,
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
}

function crearRanking(
    workbook: import("exceljs").Workbook,
    nombreHoja: string,
    datos: RankingCliente[],
    simboloMoneda: string,
    frecuencia: boolean,
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
        { width: 18 },
        { width: 32 },
        { width: 18 },
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
        nombreHoja.toUpperCase();
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
        "Cliente",
        frecuencia
            ? "Citas"
            : "Ventas",
        "Valor comprado",
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
            item.codigo;

        hoja.getCell(
            fila,
            3,
        ).value =
            item.nombre;

        hoja.getCell(
            fila,
            4,
        ).value =
            item.cantidad;

        hoja.getCell(
            fila,
            5,
        ).value =
            item.total;

        hoja.getCell(
            fila,
            5,
        ).numFmt =
            `"${simboloMoneda}" #,##0.00`;

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
