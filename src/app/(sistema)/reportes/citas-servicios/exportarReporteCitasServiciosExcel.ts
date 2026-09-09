"use client";

import type {
    CitaReporte,
} from "./ReporteCitasServiciosClient";

type Ranking = {
    nombre: string;
    cantidad: number;
    total: number;
    porcentaje: number;
};

type Dia = {
    fecha: string;
    etiqueta: string;
    cantidad: number;
};

export type DatosExportacionCitasServicios = {
    simboloMoneda: string;
    fechaDesde: string;
    fechaHasta: string;
    nombreSucursal: string;
    trabajador: string;
    estado: string;
    servicio: string;

    totalCitas: number;
    finalizadas: number;
    canceladas: number;
    servicios: number;
    valorCitas: number;

    citas: CitaReporte[];
    porEstado: Ranking[];
    porTrabajador: Ranking[];
    porServicio: Ranking[];
    porDia: Dia[];
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

export async function exportarReporteCitasServiciosExcel(
    datos: DatosExportacionCitasServicios,
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
        "Reporte de citas y servicios";

    crearResumen(
        workbook,
        datos,
    );

    crearDetalleCitas(
        workbook,
        datos,
    );

    crearDetalleServicios(
        workbook,
        datos,
    );

    crearRanking(
        workbook,
        "Estados de cita",
        datos.porEstado,
        datos.simboloMoneda,
        false,
    );

    crearRanking(
        workbook,
        "Servicios",
        datos.porServicio,
        datos.simboloMoneda,
        true,
    );

    crearRanking(
        workbook,
        "Trabajadores",
        datos.porTrabajador,
        datos.simboloMoneda,
        true,
    );

    crearFlujoDiario(
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
    datos: DatosExportacionCitasServicios,
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
        "REPORTE DE CITAS Y SERVICIOS";

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
        "CITAS",
        datos.totalCitas,
        "0",
        VERDE,
    );

    aplicarKpi(
        hoja,
        "E7:F8",
        "FINALIZADAS",
        datos.finalizadas,
        "0",
        VERDE,
    );

    aplicarKpi(
        hoja,
        "B10:C11",
        "CANCELADAS / NO ASISTIÓ",
        datos.canceladas,
        "0",
        ROSA,
    );

    aplicarKpi(
        hoja,
        "E10:F11",
        "SERVICIOS",
        datos.servicios,
        "0",
        VERDE_OSCURO,
    );

    aplicarKpi(
        hoja,
        "B13:C14",
        "VALOR DE CITAS",
        datos.valorCitas,
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
            "Trabajador",
            datos.trabajador,
        ],
        [
            "Estado",
            datos.estado,
        ],
        [
            "Servicio",
            datos.servicio,
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
        "B19:F19",
    );

    const lecturaTitulo =
        hoja.getCell(
            "B19",
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
        "B21:F23",
    );

    const lectura =
        hoja.getCell(
            "B21",
        );

    const tasaFinalizacion =
        datos.totalCitas >
            0
            ? (
                datos.finalizadas /
                datos.totalCitas
            ) *
            100
            : 0;

    lectura.value =
        `En el periodo seleccionado se registraron ${datos.totalCitas} citas y ${datos.servicios} servicios. ${datos.finalizadas} citas fueron finalizadas, equivalente al ${tasaFinalizacion.toFixed(
            1,
        )}% del total. El valor acumulado de las citas filtradas es ${datos.simboloMoneda} ${datos.valorCitas.toLocaleString(
            "es-NI",
            {
                minimumFractionDigits:
                    2,
                maximumFractionDigits:
                    2,
            },
        )}.`;

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
        "B21:F23",
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

function crearDetalleCitas(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionCitasServicios,
) {
    const hoja =
        workbook.addWorksheet(
            "Detalle de citas",
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
        { width: 15 },
        { width: 19 },
        { width: 28 },
        { width: 24 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 38 },
        { width: 34 },
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
        "DETALLE DE CITAS";
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
        "Fecha",
        "Código",
        "Cliente",
        "Sucursal",
        "Hora inicio",
        "Hora fin",
        "Estado",
        "Servicios",
        "Trabajadores",
        "Total",
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
        const cita of datos.citas
    ) {
        const servicios =
            cita.cita_servicios
                .map(
                    (item) =>
                        item.nombre_servicio,
                )
                .join(
                    ", ",
                );

        const trabajadores =
            Array.from(
                new Set(
                    cita.cita_servicios.map(
                        (item) =>
                            item.trabajadores
                                ?.nombre_completo ??
                            "Sin trabajador",
                    ),
                ),
            ).join(
                ", ",
            );

        const valores = [
            cita.fecha,
            cita.codigo_cita ??
            "—",
            cita.clientes
                ?.nombre_completo ??
            "Sin cliente",
            cita.sucursales
                ?.nombre ??
            "Sin sucursal",
            cita.hora_inicio,
            cita.hora_fin,
            formatearEstado(
                cita.estado,
            ),
            servicios,
            trabajadores,
            Number(
                cita.total,
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
                        7 ||
                        indice ===
                        8,
                };
            },
        );

        hoja.getCell(
            fila,
            11,
        ).numFmt =
            `"${datos.simboloMoneda}" #,##0.00`;

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

function crearDetalleServicios(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionCitasServicios,
) {
    const hoja =
        workbook.addWorksheet(
            "Detalle de servicios",
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
        { width: 15 },
        { width: 20 },
        { width: 30 },
        { width: 28 },
        { width: 24 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:J3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "DETALLE DE SERVICIOS";
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
        "Cita",
        "Servicio",
        "Trabajador",
        "Sucursal",
        "Duración",
        "Estado",
        "Precio",
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
        const cita of datos.citas
    ) {
        for (
            const servicio of cita.cita_servicios
        ) {
            const valores = [
                cita.fecha,
                cita.codigo_cita ??
                "—",
                servicio.nombre_servicio,
                servicio.trabajadores
                    ?.nombre_completo ??
                "Sin trabajador",
                cita.sucursales
                    ?.nombre ??
                "Sin sucursal",
                `${servicio.duracion_minutos} min`,
                servicio.estado,
                Number(
                    servicio.precio_unitario,
                ),
                Number(
                    servicio.total,
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
                9,
            ).numFmt =
                `"${datos.simboloMoneda}" #,##0.00`;

            hoja.getCell(
                fila,
                10,
            ).numFmt =
                `"${datos.simboloMoneda}" #,##0.00`;

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
                10,
        },
    };
}

function crearRanking(
    workbook: import("exceljs").Workbook,
    nombreHoja: string,
    datos: Ranking[],
    simboloMoneda: string,
    mostrarMonto: boolean,
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
        "Concepto",
        "Cantidad",
        "Monto",
        "% registros",
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
            item.cantidad;

        hoja.getCell(
            fila,
            4,
        ).value =
            mostrarMonto
                ? item.total
                : 0;

        hoja.getCell(
            fila,
            4,
        ).numFmt =
            mostrarMonto
                ? `"${simboloMoneda}" #,##0.00`
                : "0";

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

        fila +=
            1;
    }
}

function crearFlujoDiario(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionCitasServicios,
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
        { width: 18 },
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
        "Cantidad de citas",
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
        const item of datos.porDia
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            item.fecha;

        hoja.getCell(
            fila,
            3,
        ).value =
            item.cantidad;

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
    datos: DatosExportacionCitasServicios,
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

    return `Reporte_Citas_Servicios_${datos.fechaDesde || "inicio"}_${datos.fechaHasta || "actual"}_${sucursal || "Salon"}.xlsx`;
}

function formatearEstado(
    valor: string,
) {
    return (
        {
            PENDIENTE:
                "Pendiente",
            CONFIRMADA:
                "Confirmada",
            EN_ESPERA:
                "En espera",
            EN_PROCESO:
                "En proceso",
            FINALIZADA:
                "Finalizada",
            CANCELADA:
                "Cancelada",
            NO_ASISTIO:
                "No asistió",
            REPROGRAMADA:
                "Reprogramada",
        }[valor] ??
        valor
    );
}
