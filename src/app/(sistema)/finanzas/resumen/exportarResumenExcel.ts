"use client";

type MovimientoExportable = {
    id: string;
    sucursal_id: string | null;
    categoria_id: string | null;
    tipo: "INGRESO" | "GASTO";
    origen: string;
    metodo_pago: string | null;
    concepto: string;
    monto: number;
    fecha_movimiento: string;
    estado: "APLICADO" | "ANULADO";
    categorias_financieras: {
        nombre: string;
    } | null;
    sucursales: {
        nombre: string;
    } | null;
};

type ResumenMesExportable = {
    clave: string;
    etiqueta: string;
    ingresos: number;
    gastos: number;
    utilidad: number;
};

type CategoriaExportable = {
    nombre: string;
    total: number;
    porcentaje: number;
};

type DiaExportable = {
    dia: number;
    ingresos: number;
    gastos: number;
    utilidad: number;
};

export type DatosExportacionFinanciera = {
    simboloMoneda: string;
    salonNombre?: string;
    nombreSucursal: string;
    mesNombre: string;
    mesNumero: number;
    anio: number;

    ingresos: number;
    gastos: number;
    utilidad: number;
    margen: number;

    movimientos: MovimientoExportable[];
    tendencia12Meses: ResumenMesExportable[];
    categoriasIngreso: CategoriaExportable[];
    categoriasGasto: CategoriaExportable[];
    dias: DiaExportable[];
};

const COLOR_VERDE_OSCURO = "26332F";
const COLOR_VERDE = "6F8F83";
const COLOR_VERDE_SUAVE = "DCE7E2";
const COLOR_ROSA = "C79AA1";
const COLOR_FONDO = "F6F7F4";
const COLOR_BORDE = "DCE5E0";
const COLOR_TEXTO = "24302C";
const COLOR_SECUNDARIO = "6B756F";
const COLOR_BLANCO = "FFFFFF";

export async function exportarResumenFinancieroExcel(
    datos: DatosExportacionFinanciera,
) {
    const ExcelJS = await import("exceljs");

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Sistema de Salón";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.subject = "Resumen financiero";
    workbook.title = `Resumen financiero - ${datos.mesNombre} ${datos.anio}`;
    workbook.description =
        "Reporte de ingresos, gastos, utilidad y movimientos financieros.";

    crearHojaResumen(workbook, datos);
    crearHojaMovimientos(workbook, datos);
    crearHojaCategorias(
        workbook,
        "Ingresos por categoría",
        datos.categoriasIngreso,
        datos.simboloMoneda,
        "INGRESO",
    );
    crearHojaCategorias(
        workbook,
        "Gastos por categoría",
        datos.categoriasGasto,
        datos.simboloMoneda,
        "GASTO",
    );
    crearHojaTendencia(workbook, datos);
    crearHojaFlujoDiario(workbook, datos);

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = construirNombreArchivo(datos);
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
}

function crearHojaResumen(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionFinanciera,
) {
    const hoja = workbook.addWorksheet("Resumen", {
        views: [
            {
                showGridLines: false,
            },
        ],
    });

    hoja.properties.defaultRowHeight = 20;

    hoja.columns = [
        { key: "a", width: 4 },
        { key: "b", width: 27 },
        { key: "c", width: 20 },
        { key: "d", width: 4 },
        { key: "e", width: 27 },
        { key: "f", width: 20 },
        { key: "g", width: 4 },
    ];

    hoja.mergeCells("B2:F3");
    const titulo = hoja.getCell("B2");

    titulo.value = "RESUMEN FINANCIERO";
    titulo.font = {
        bold: true,
        size: 20,
        color: { argb: COLOR_BLANCO },
    };
    titulo.fill = relleno(COLOR_VERDE_OSCURO);
    titulo.alignment = {
        vertical: "middle",
        horizontal: "center",
    };

    hoja.getRow(2).height = 25;
    hoja.getRow(3).height = 25;

    hoja.mergeCells("B5:F5");
    const periodo = hoja.getCell("B5");
    periodo.value = `${datos.mesNombre} ${datos.anio} · ${datos.nombreSucursal}`;
    periodo.font = {
        bold: true,
        size: 12,
        color: { argb: COLOR_TEXTO },
    };
    periodo.alignment = {
        horizontal: "center",
    };

    aplicarKpi(
        hoja,
        "B7",
        "C8",
        "INGRESOS",
        datos.ingresos,
        datos.simboloMoneda,
        COLOR_VERDE,
    );

    aplicarKpi(
        hoja,
        "E7",
        "F8",
        "GASTOS",
        datos.gastos,
        datos.simboloMoneda,
        COLOR_ROSA,
    );

    aplicarKpi(
        hoja,
        "B10",
        "C11",
        "UTILIDAD",
        datos.utilidad,
        datos.simboloMoneda,
        datos.utilidad >= 0 ? COLOR_VERDE : COLOR_ROSA,
    );

    hoja.mergeCells("E10:F10");
    const margenTitulo = hoja.getCell("E10");
    margenTitulo.value = "MARGEN";
    margenTitulo.font = {
        bold: true,
        size: 10,
        color: { argb: COLOR_SECUNDARIO },
    };
    margenTitulo.fill = relleno(COLOR_FONDO);
    margenTitulo.alignment = {
        horizontal: "center",
        vertical: "middle",
    };
    hoja.mergeCells("E11:F11");
    const margen = hoja.getCell("E11");
    margen.value = datos.margen / 100;
    margen.numFmt = "0.0%";
    margen.font = {
        bold: true,
        size: 18,
        color: {
            argb:
                datos.margen >= 0
                    ? COLOR_VERDE_OSCURO
                    : COLOR_ROSA,
        },
    };
    margen.fill = relleno(COLOR_BLANCO);
    margen.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    estilizarBloque(hoja, "E10:F11");

    hoja.mergeCells("B14:F14");
    const seccion = hoja.getCell("B14");
    seccion.value = "INDICADORES DEL PERIODO";
    estiloTituloSeccion(seccion);

    const indicadores = [
        ["Movimientos registrados", datos.movimientos.length],
        [
            "Promedio de ingreso por movimiento",
            promedio(
                datos.movimientos
                    .filter((m) => m.tipo === "INGRESO")
                    .map((m) => Number(m.monto)),
            ),
        ],
        [
            "Promedio de gasto por movimiento",
            promedio(
                datos.movimientos
                    .filter((m) => m.tipo === "GASTO")
                    .map((m) => Number(m.monto)),
            ),
        ],
        [
            "Categoría principal de ingreso",
            datos.categoriasIngreso[0]?.nombre ?? "Sin datos",
        ],
        [
            "Categoría principal de gasto",
            datos.categoriasGasto[0]?.nombre ?? "Sin datos",
        ],
    ];

    let fila = 16;

    for (const [etiqueta, valor] of indicadores) {
        hoja.mergeCells(`B${fila}:D${fila}`);
        hoja.getCell(`B${fila}`).value = etiqueta;
        hoja.getCell(`B${fila}`).font = {
            bold: true,
            color: { argb: COLOR_TEXTO },
        };
        hoja.getCell(`B${fila}`).fill = relleno(COLOR_FONDO);

        hoja.mergeCells(`E${fila}:F${fila}`);
        hoja.getCell(`E${fila}`).value = valor;

        if (
            etiqueta === "Promedio de ingreso por movimiento" ||
            etiqueta === "Promedio de gasto por movimiento"
        ) {
            hoja.getCell(`E${fila}`).numFmt =
                `"${datos.simboloMoneda}" #,##0.00`;
        }

        hoja.getCell(`E${fila}`).alignment = {
            horizontal: "right",
        };

        estilizarBloque(hoja, `B${fila}:F${fila}`);
        fila += 1;
    }

    hoja.mergeCells(`B${fila + 2}:F${fila + 2}`);
    const nota = hoja.getCell(`B${fila + 2}`);

    nota.value =
        "Utilidad = Ingresos - Gastos · Margen = Utilidad / Ingresos";
    nota.font = {
        italic: true,
        size: 9,
        color: { argb: COLOR_SECUNDARIO },
    };
    nota.alignment = {
        horizontal: "center",
    };

    hoja.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
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

function crearHojaMovimientos(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionFinanciera,
) {
    const hoja = workbook.addWorksheet("Movimientos", {
        views: [
            {
                state: "frozen",
                ySplit: 5,
                showGridLines: false,
            },
        ],
    });

    hoja.columns = [
        { header: "", key: "espacio", width: 2 },
        { header: "Fecha", key: "fecha", width: 20 },
        { header: "Tipo", key: "tipo", width: 12 },
        { header: "Concepto", key: "concepto", width: 36 },
        { header: "Categoría", key: "categoria", width: 26 },
        { header: "Origen", key: "origen", width: 22 },
        { header: "Método", key: "metodo", width: 18 },
        { header: "Sucursal", key: "sucursal", width: 24 },
        { header: "Monto", key: "monto", width: 18 },
    ];

    hoja.mergeCells("B2:I3");
    const titulo = hoja.getCell("B2");
    titulo.value = `MOVIMIENTOS FINANCIEROS · ${datos.mesNombre.toUpperCase()} ${datos.anio}`;
    titulo.fill = relleno(COLOR_VERDE_OSCURO);
    titulo.font = {
        bold: true,
        size: 16,
        color: { argb: COLOR_BLANCO },
    };
    titulo.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    const cabeceras = [
        "Fecha",
        "Tipo",
        "Concepto",
        "Categoría",
        "Origen",
        "Método",
        "Sucursal",
        "Monto",
    ];

    cabeceras.forEach((cabecera, indice) => {
        const celda = hoja.getCell(5, indice + 2);
        celda.value = cabecera;
        estiloCabecera(celda);
    });

    let fila = 6;

    for (const movimiento of datos.movimientos) {
        hoja.getCell(fila, 2).value = new Date(
            movimiento.fecha_movimiento,
        );
        hoja.getCell(fila, 2).numFmt = "dd/mm/yyyy hh:mm";

        hoja.getCell(fila, 3).value =
            movimiento.tipo === "INGRESO"
                ? "Ingreso"
                : "Gasto";

        hoja.getCell(fila, 4).value = movimiento.concepto;

        hoja.getCell(fila, 5).value =
            movimiento.categorias_financieras?.nombre ??
            "Sin categoría";

        hoja.getCell(fila, 6).value = formatearOrigen(
            movimiento.origen,
        );

        hoja.getCell(fila, 7).value = formatearMetodo(
            movimiento.metodo_pago,
        );

        hoja.getCell(fila, 8).value =
            movimiento.sucursales?.nombre ??
            "Sin sucursal";

        hoja.getCell(fila, 9).value = Number(movimiento.monto);
        hoja.getCell(fila, 9).numFmt =
            `"${datos.simboloMoneda}" #,##0.00`;

        const colorFila =
            movimiento.tipo === "INGRESO"
                ? "F3F8F5"
                : "FBF5F6";

        for (let columna = 2; columna <= 9; columna++) {
            const celda = hoja.getCell(fila, columna);

            celda.fill = relleno(colorFila);
            celda.border = bordesSuaves();
            celda.alignment = {
                vertical: "middle",
                wrapText: columna === 4,
            };
        }

        hoja.getCell(fila, 3).font = {
            bold: true,
            color: {
                argb:
                    movimiento.tipo === "INGRESO"
                        ? COLOR_VERDE
                        : COLOR_ROSA,
            },
        };

        hoja.getCell(fila, 9).font = {
            bold: true,
            color: {
                argb:
                    movimiento.tipo === "INGRESO"
                        ? COLOR_VERDE_OSCURO
                        : "9A5F6B",
            },
        };

        fila += 1;
    }

    hoja.autoFilter = {
        from: {
            row: 5,
            column: 2,
        },
        to: {
            row: Math.max(fila - 1, 5),
            column: 9,
        },
    };

    const filaTotal = fila + 1;

    hoja.mergeCells(`B${filaTotal}:H${filaTotal}`);
    hoja.getCell(`B${filaTotal}`).value = "BALANCE DEL PERIODO";
    hoja.getCell(`B${filaTotal}`).font = {
        bold: true,
        color: { argb: COLOR_BLANCO },
    };
    hoja.getCell(`B${filaTotal}`).fill =
        relleno(COLOR_VERDE_OSCURO);
    hoja.getCell(`B${filaTotal}`).alignment = {
        horizontal: "right",
    };

    hoja.getCell(`I${filaTotal}`).value = datos.utilidad;
    hoja.getCell(`I${filaTotal}`).numFmt =
        `"${datos.simboloMoneda}" #,##0.00`;
    hoja.getCell(`I${filaTotal}`).font = {
        bold: true,
        color: { argb: COLOR_BLANCO },
    };
    hoja.getCell(`I${filaTotal}`).fill =
        relleno(COLOR_VERDE_OSCURO);

    hoja.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
    };
}

function crearHojaCategorias(
    workbook: import("exceljs").Workbook,
    nombreHoja: string,
    categorias: CategoriaExportable[],
    simboloMoneda: string,
    tipo: "INGRESO" | "GASTO",
) {
    const hoja = workbook.addWorksheet(nombreHoja, {
        views: [
            {
                state: "frozen",
                ySplit: 5,
                showGridLines: false,
            },
        ],
    });

    hoja.columns = [
        { width: 3 },
        { width: 34 },
        { width: 22 },
        { width: 18 },
    ];

    hoja.mergeCells("B2:D3");
    const titulo = hoja.getCell("B2");

    titulo.value = nombreHoja.toUpperCase();
    titulo.fill = relleno(
        tipo === "INGRESO"
            ? COLOR_VERDE
            : COLOR_ROSA,
    );
    titulo.font = {
        bold: true,
        size: 16,
        color: { argb: COLOR_BLANCO },
    };
    titulo.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    ["Categoría", "Monto", "% del total"].forEach(
        (cabecera, indice) => {
            const celda = hoja.getCell(5, indice + 2);
            celda.value = cabecera;
            estiloCabecera(celda);
        },
    );

    let fila = 6;

    categorias.forEach((categoria) => {
        hoja.getCell(fila, 2).value = categoria.nombre;
        hoja.getCell(fila, 3).value = categoria.total;
        hoja.getCell(fila, 3).numFmt =
            `"${simboloMoneda}" #,##0.00`;
        hoja.getCell(fila, 4).value = categoria.porcentaje / 100;
        hoja.getCell(fila, 4).numFmt = "0.0%";

        for (let columna = 2; columna <= 4; columna++) {
            hoja.getCell(fila, columna).border = bordesSuaves();
            hoja.getCell(fila, columna).fill = relleno(
                fila % 2 === 0 ? "FBFCFA" : COLOR_BLANCO,
            );
        }

        fila += 1;
    });

    if (categorias.length === 0) {
        hoja.mergeCells("B6:D7");
        hoja.getCell("B6").value =
            "No hay datos para el periodo seleccionado.";
        hoja.getCell("B6").alignment = {
            horizontal: "center",
            vertical: "middle",
        };
        hoja.getCell("B6").font = {
            italic: true,
            color: { argb: COLOR_SECUNDARIO },
        };
    }
}

function crearHojaTendencia(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionFinanciera,
) {
    const hoja = workbook.addWorksheet("Tendencia 12 meses", {
        views: [
            {
                state: "frozen",
                ySplit: 5,
                showGridLines: false,
            },
        ],
    });

    hoja.columns = [
        { width: 3 },
        { width: 18 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
        { width: 16 },
    ];

    hoja.mergeCells("B2:F3");
    const titulo = hoja.getCell("B2");
    titulo.value = "TENDENCIA FINANCIERA · 12 MESES";
    titulo.fill = relleno(COLOR_VERDE_OSCURO);
    titulo.font = {
        bold: true,
        size: 16,
        color: { argb: COLOR_BLANCO },
    };
    titulo.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    [
        "Mes",
        "Ingresos",
        "Gastos",
        "Utilidad",
        "Margen",
    ].forEach((cabecera, indice) => {
        const celda = hoja.getCell(5, indice + 2);
        celda.value = cabecera;
        estiloCabecera(celda);
    });

    let fila = 6;

    datos.tendencia12Meses.forEach((mes) => {
        hoja.getCell(fila, 2).value = mes.etiqueta;
        hoja.getCell(fila, 3).value = mes.ingresos;
        hoja.getCell(fila, 4).value = mes.gastos;
        hoja.getCell(fila, 5).value = mes.utilidad;

        hoja.getCell(fila, 6).value =
            mes.ingresos > 0
                ? mes.utilidad / mes.ingresos
                : 0;

        for (const columna of [3, 4, 5]) {
            hoja.getCell(fila, columna).numFmt =
                `"${datos.simboloMoneda}" #,##0.00`;
        }

        hoja.getCell(fila, 6).numFmt = "0.0%";

        for (let columna = 2; columna <= 6; columna++) {
            hoja.getCell(fila, columna).border = bordesSuaves();
            hoja.getCell(fila, columna).fill = relleno(
                fila % 2 === 0 ? "FBFCFA" : COLOR_BLANCO,
            );
        }

        hoja.getCell(fila, 5).font = {
            bold: true,
            color: {
                argb:
                    mes.utilidad >= 0
                        ? COLOR_VERDE
                        : COLOR_ROSA,
            },
        };

        fila += 1;
    });

}

function crearHojaFlujoDiario(
    workbook: import("exceljs").Workbook,
    datos: DatosExportacionFinanciera,
) {
    const hoja = workbook.addWorksheet("Flujo diario", {
        views: [
            {
                state: "frozen",
                ySplit: 5,
                showGridLines: false,
            },
        ],
    });

    hoja.columns = [
        { width: 3 },
        { width: 12 },
        { width: 20 },
        { width: 20 },
        { width: 20 },
    ];

    hoja.mergeCells("B2:E3");
    const titulo = hoja.getCell("B2");
    titulo.value = `FLUJO DIARIO · ${datos.mesNombre.toUpperCase()} ${datos.anio}`;
    titulo.fill = relleno(COLOR_VERDE_OSCURO);
    titulo.font = {
        bold: true,
        size: 16,
        color: { argb: COLOR_BLANCO },
    };
    titulo.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    ["Día", "Ingresos", "Gastos", "Utilidad"].forEach(
        (cabecera, indice) => {
            const celda = hoja.getCell(5, indice + 2);
            celda.value = cabecera;
            estiloCabecera(celda);
        },
    );

    let fila = 6;

    datos.dias.forEach((dia) => {
        hoja.getCell(fila, 2).value = dia.dia;
        hoja.getCell(fila, 3).value = dia.ingresos;
        hoja.getCell(fila, 4).value = dia.gastos;
        hoja.getCell(fila, 5).value = dia.utilidad;

        for (const columna of [3, 4, 5]) {
            hoja.getCell(fila, columna).numFmt =
                `"${datos.simboloMoneda}" #,##0.00`;
        }

        for (let columna = 2; columna <= 5; columna++) {
            hoja.getCell(fila, columna).border = bordesSuaves();
            hoja.getCell(fila, columna).fill = relleno(
                fila % 2 === 0 ? "FBFCFA" : COLOR_BLANCO,
            );
        }

        hoja.getCell(fila, 5).font = {
            bold: true,
            color: {
                argb:
                    dia.utilidad >= 0
                        ? COLOR_VERDE
                        : COLOR_ROSA,
            },
        };

        fila += 1;
    });
}

function aplicarKpi(
    hoja: import("exceljs").Worksheet,
    celdaTitulo: string,
    celdaValor: string,
    etiqueta: string,
    valor: number,
    simboloMoneda: string,
    colorAcento: string,
) {
    const inicioTitulo = celdaTitulo;
    const finTitulo = desplazarColumna(celdaTitulo, 1);

    hoja.mergeCells(`${inicioTitulo}:${finTitulo}`);

    const titulo = hoja.getCell(inicioTitulo);
    titulo.value = etiqueta;
    titulo.font = {
        bold: true,
        size: 10,
        color: { argb: COLOR_SECUNDARIO },
    };
    titulo.fill = relleno(COLOR_FONDO);
    titulo.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    const inicioValor = celdaValor;
    const finValor = desplazarColumna(celdaValor, 1);

    hoja.mergeCells(`${inicioValor}:${finValor}`);

    const celda = hoja.getCell(inicioValor);
    celda.value = valor;
    celda.numFmt = `"${simboloMoneda}" #,##0.00`;
    celda.font = {
        bold: true,
        size: 18,
        color: { argb: colorAcento },
    };
    celda.fill = relleno(COLOR_BLANCO);
    celda.alignment = {
        horizontal: "center",
        vertical: "middle",
    };

    estilizarBloque(
        hoja,
        `${inicioTitulo}:${finValor}`,
    );
}

function estilizarBloque(
    hoja: import("exceljs").Worksheet,
    rango: string,
) {
    const [inicio, fin] = rango.split(":");
    const a = parsearCelda(inicio);
    const b = parsearCelda(fin);

    for (let fila = a.fila; fila <= b.fila; fila++) {
        for (
            let columna = a.columna;
            columna <= b.columna;
            columna++
        ) {
            hoja.getCell(fila, columna).border = bordesSuaves();
        }
    }
}

function estiloTituloSeccion(
    celda: import("exceljs").Cell,
) {
    celda.fill = relleno(COLOR_VERDE_SUAVE);
    celda.font = {
        bold: true,
        size: 11,
        color: { argb: COLOR_VERDE_OSCURO },
    };
    celda.alignment = {
        horizontal: "center",
        vertical: "middle",
    };
}

function estiloCabecera(
    celda: import("exceljs").Cell,
) {
    celda.fill = relleno(COLOR_VERDE_OSCURO);
    celda.font = {
        bold: true,
        color: { argb: COLOR_BLANCO },
    };
    celda.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
    };
    celda.border = bordesSuaves();
}

function relleno(
    argb: string,
): import("exceljs").Fill {
    return {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb },
    };
}

function bordesSuaves(): Partial<import("exceljs").Borders> {
    const borde = {
        style: "thin" as const,
        color: {
            argb: COLOR_BORDE,
        },
    };

    return {
        top: borde,
        left: borde,
        bottom: borde,
        right: borde,
    };
}

function promedio(
    valores: number[],
) {
    if (valores.length === 0) {
        return 0;
    }

    return (
        valores.reduce(
            (total, valor) => total + valor,
            0,
        ) / valores.length
    );
}

function construirNombreArchivo(
    datos: DatosExportacionFinanciera,
) {
    const sucursal = datos.nombreSucursal
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    return `Estado_Financiero_${datos.anio}_${String(
        datos.mesNumero,
    ).padStart(2, "0")}_${sucursal || "Salon"}.xlsx`;
}

function formatearOrigen(
    valor: string,
) {
    return (
        {
            VENTA: "Venta",
            PAGO_PROVEEDOR: "Pago a proveedor",
            COMISION_POS: "Comisión POS",
            MOVIMIENTO_CAJA: "Movimiento de caja",
            MANUAL: "Registro manual",
            AJUSTE: "Ajuste",
            OTRO: "Otro",
        }[valor] ?? valor
    );
}

function formatearMetodo(
    valor: string | null,
) {
    if (!valor) {
        return "—";
    }

    return (
        {
            EFECTIVO: "Efectivo",
            TARJETA: "Tarjeta",
            TRANSFERENCIA: "Transferencia",
            DEPOSITO: "Depósito",
            CHEQUE: "Cheque",
            CREDITO: "Crédito",
            OTRO: "Otro",
        }[valor] ?? valor
    );
}

function desplazarColumna(
    referencia: string,
    cantidad: number,
) {
    const { columna, fila } = parsearCelda(referencia);
    return `${numeroAColumna(columna + cantidad)}${fila}`;
}

function parsearCelda(
    referencia: string,
) {
    const coincidencia = referencia.match(
        /^([A-Z]+)(\d+)$/,
    );

    if (!coincidencia) {
        throw new Error(
            `Referencia de celda inválida: ${referencia}`,
        );
    }

    return {
        columna: columnaANumero(coincidencia[1]),
        fila: Number(coincidencia[2]),
    };
}

function columnaANumero(
    columna: string,
) {
    let numero = 0;

    for (const caracter of columna) {
        numero =
            numero * 26 +
            caracter.charCodeAt(0) -
            64;
    }

    return numero;
}

function numeroAColumna(
    numero: number,
) {
    let resultado = "";
    let actual = numero;

    while (actual > 0) {
        const resto = (actual - 1) % 26;
        resultado =
            String.fromCharCode(65 + resto) +
            resultado;
        actual = Math.floor((actual - 1) / 26);
    }

    return resultado;
}