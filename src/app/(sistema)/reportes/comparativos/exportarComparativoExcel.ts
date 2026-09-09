"use client";

type ResumenPeriodo = {
    ventasCantidad: number;
    ventasMonto: number;
    cobrado: number;
    ingresos: number;
    gastos: number;
    utilidad: number;
    citas: number;
    citasFinalizadas: number;
    comprasCantidad: number;
    comprasMonto: number;
    clientesActivos: number;
};

type ComparacionMetrica = {
    clave: string;
    titulo: string;
    valorA: number;
    valorB: number;
    diferencia: number;
    porcentaje: number | null;
    formato:
    | "moneda"
    | "numero";
};

export type DatosExportacionComparativo = {
    simboloMoneda: string;
    desdeA: string;
    hastaA: string;
    desdeB: string;
    hastaB: string;
    periodoA: ResumenPeriodo;
    periodoB: ResumenPeriodo;
    comparaciones: ComparacionMetrica[];
};

const VERDE_OSCURO = "26332F";
const VERDE = "6F8F83";
const VERDE_SUAVE = "DCE7E2";
const ROSA = "C79AA1";
const FONDO = "F6F7F4";
const BORDE = "DCE5E0";
const BLANCO = "FFFFFF";
const SECUNDARIO = "6B756F";

export async function exportarComparativoExcel(
    datos: DatosExportacionComparativo,
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
        "Comparativo entre periodos";

    crearResumen(
        workbook,
        datos,
    );

    crearDetallePeriodo(
        workbook,
        "Periodo A",
        datos.desdeA,
        datos.hastaA,
        datos.periodoA,
        datos.simboloMoneda,
    );

    crearDetallePeriodo(
        workbook,
        "Periodo B",
        datos.desdeB,
        datos.hastaB,
        datos.periodoB,
        datos.simboloMoneda,
    );

    crearComparacion(
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
        `Comparativo_${datos.desdeA}_${datos.hastaA}_vs_${datos.desdeB}_${datos.hastaB}.xlsx`;

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
    datos: DatosExportacionComparativo,
) {
    const hoja =
        workbook.addWorksheet(
            "Resumen comparativo",
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
        { width: 20 },
        { width: 20 },
        { width: 18 },
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
        "COMPARATIVO ENTRE PERIODOS";

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

    const periodos =
        hoja.getCell(
            "B5",
        );

    periodos.value =
        `Periodo A: ${datos.desdeA} al ${datos.hastaA} · Periodo B: ${datos.desdeB} al ${datos.hastaB}`;

    periodos.font = {
        bold: true,
        color: {
            argb:
                VERDE_OSCURO,
        },
    };

    periodos.alignment = {
        horizontal:
            "center",
    };

    [
        "Indicador",
        "Periodo A",
        "Periodo B",
        "Diferencia",
        "Variación",
    ].forEach(
        (
            cabecera,
            indice,
        ) => {
            const celda =
                hoja.getCell(
                    7,
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
        8;

    for (
        const item of datos.comparaciones
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            item.titulo;

        hoja.getCell(
            fila,
            3,
        ).value =
            item.valorA;

        hoja.getCell(
            fila,
            4,
        ).value =
            item.valorB;

        hoja.getCell(
            fila,
            5,
        ).value =
            item.diferencia;

        hoja.getCell(
            fila,
            6,
        ).value =
            item.porcentaje ===
                null
                ? "Sin base"
                : item.porcentaje /
                100;

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

        if (
            item.formato ===
            "moneda"
        ) {
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
        } else {
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
                    "#,##0";
            }
        }

        if (
            item.porcentaje !==
            null
        ) {
            hoja.getCell(
                fila,
                6,
            ).numFmt =
                "0.0%";

            hoja.getCell(
                fila,
                6,
            ).font = {
                bold: true,
                color: {
                    argb:
                        item.porcentaje >=
                            0
                            ? VERDE
                            : ROSA,
                },
            };
        }

        hoja.getCell(
            fila,
            5,
        ).font = {
            bold: true,
            color: {
                argb:
                    item.diferencia >=
                        0
                        ? VERDE
                        : ROSA,
            },
        };

        fila +=
            1;
    }

    hoja.mergeCells(
        `B${fila + 2}:F${fila + 2}`,
    );

    const lecturaTitulo =
        hoja.getCell(
            `B${fila + 2}`,
        );

    lecturaTitulo.value =
        "LECTURA RÁPIDA";

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
        `B${fila + 4}:F${fila + 6}`,
    );

    const lectura =
        hoja.getCell(
            `B${fila + 4}`,
        );

    const utilidad =
        datos.comparaciones.find(
            (item) =>
                item.clave ===
                "utilidad",
        );

    lectura.value =
        utilidad?.porcentaje ===
            null
            ? "No existe una base suficiente para calcular la variación porcentual de utilidad entre ambos periodos."
            : `La utilidad del Periodo A es ${utilidad && utilidad.diferencia >= 0 ? "superior" : "inferior"} a la del Periodo B en ${Math.abs(
                utilidad?.porcentaje ??
                0,
            ).toFixed(
                1,
            )}%. Revisa también ventas, gastos, citas y compras para entender el cambio general del negocio.`;

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
        `B${fila + 4}:F${fila + 6}`,
    );
}

function crearDetallePeriodo(
    workbook: import("exceljs").Workbook,
    tituloHoja: string,
    desde: string,
    hasta: string,
    resumen: ResumenPeriodo,
    simboloMoneda: string,
) {
    const hoja =
        workbook.addWorksheet(
            tituloHoja,
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
        { width: 24 },
        { width: 3 },
    ];

    hoja.mergeCells(
        "B2:C3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        tituloHoja.toUpperCase();

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 18,
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
        "B5:C5",
    );

    hoja.getCell(
        "B5",
    ).value =
        `${desde} al ${hasta}`;

    hoja.getCell(
        "B5",
    ).alignment = {
        horizontal:
            "center",
    };

    hoja.getCell(
        "B5",
    ).font = {
        bold: true,
        color: {
            argb:
                SECUNDARIO,
        },
    };

    const datos = [
        [
            "Cantidad de ventas",
            resumen.ventasCantidad,
            "numero",
        ],
        [
            "Valor de ventas",
            resumen.ventasMonto,
            "moneda",
        ],
        [
            "Cobrado",
            resumen.cobrado,
            "moneda",
        ],
        [
            "Ingresos",
            resumen.ingresos,
            "moneda",
        ],
        [
            "Gastos",
            resumen.gastos,
            "moneda",
        ],
        [
            "Utilidad",
            resumen.utilidad,
            "moneda",
        ],
        [
            "Citas",
            resumen.citas,
            "numero",
        ],
        [
            "Citas finalizadas",
            resumen.citasFinalizadas,
            "numero",
        ],
        [
            "Cantidad de compras",
            resumen.comprasCantidad,
            "numero",
        ],
        [
            "Valor de compras",
            resumen.comprasMonto,
            "moneda",
        ],
        [
            "Clientes con actividad",
            resumen.clientesActivos,
            "numero",
        ],
    ] as const;

    let fila =
        7;

    for (
        const [
            nombre,
            valor,
            formato,
        ] of datos
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            nombre;

        hoja.getCell(
            fila,
            2,
        ).font = {
            bold: true,
            color: {
                argb:
                    VERDE_OSCURO,
            },
        };

        hoja.getCell(
            fila,
            3,
        ).value =
            valor;

        hoja.getCell(
            fila,
            3,
        ).numFmt =
            formato ===
                "moneda"
                ? `"${simboloMoneda}" #,##0.00`
                : "#,##0";

        aplicarBordes(
            hoja,
            `B${fila}:C${fila}`,
        );

        fila +=
            1;
    }
}

function crearComparacion(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionComparativo,
) {
    const hoja =
        workbook.addWorksheet(
            "Variaciones",
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
        { width: 22 },
        { width: 22 },
        { width: 22 },
        { width: 18 },
    ];

    hoja.mergeCells(
        "B2:F3",
    );

    const titulo =
        hoja.getCell(
            "B2",
        );

    titulo.value =
        "VARIACIONES ENTRE PERIODOS";

    titulo.fill =
        relleno(
            VERDE_OSCURO,
        );

    titulo.font = {
        bold: true,
        size: 18,
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
        "Indicador",
        "Periodo A",
        "Periodo B",
        "Diferencia",
        "% Variación",
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
        const item of datos.comparaciones
    ) {
        hoja.getCell(
            fila,
            2,
        ).value =
            item.titulo;

        hoja.getCell(
            fila,
            3,
        ).value =
            item.valorA;

        hoja.getCell(
            fila,
            4,
        ).value =
            item.valorB;

        hoja.getCell(
            fila,
            5,
        ).value =
            item.diferencia;

        hoja.getCell(
            fila,
            6,
        ).value =
            item.porcentaje ===
                null
                ? "Sin base"
                : item.porcentaje /
                100;

        if (
            item.formato ===
            "moneda"
        ) {
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
        }

        if (
            item.porcentaje !==
            null
        ) {
            hoja.getCell(
                fila,
                6,
            ).numFmt =
                "0.0%";
        }

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
        }

        fila +=
            1;
    }
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
