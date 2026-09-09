/* eslint-disable no-console */

/**
 * 4I-B2
 * Aplica guardias de permisos a Server Actions existentes.
 *
 * Diseñado específicamente para:
 * rafasteel/sistema-salon
 *
 * REQUISITOS:
 * - ejecutar desde la raíz del proyecto;
 * - package.json debe existir;
 * - TypeScript debe estar instalado;
 * - src/lib/permisos/acciones.ts y codigos.ts deben existir.
 *
 * SEGURIDAD:
 * - crea respaldo .bak-4I-B2 antes de modificar cada archivo;
 * - no toca archivos de usuarios, porque ya fueron protegidos en 4I-B;
 * - es idempotente: no vuelve a insertar la misma guardia.
 */

const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const ROOT = process.cwd();
const REPORT = path.join(
    ROOT,
    "reporte_4I_B2.txt",
);

if (
    !fs.existsSync(
        path.join(
            ROOT,
            "package.json",
        ),
    )
) {
    throw new Error(
        "Ejecuta este script desde la raíz del proyecto, donde está package.json.",
    );
}

const IMPORT_ACCIONES =
    'import { exigirPermisoAccion, exigirCualquieraPermisosAccion } from "@/lib/permisos/acciones";';

const IMPORT_CODIGOS =
    'import { PERMISOS } from "@/lib/permisos/codigos";';

const targets = [
    // ========================================================
    // AGENDA
    // ========================================================
    {
        file:
            "src/app/(sistema)/agenda/actions.ts",
        read:
            "AGENDA_VER",
        write:
            "AGENDA_EDITAR",
    },
    {
        file:
            "src/app/(sistema)/agenda/nueva/actions.ts",
        read:
            "AGENDA_CREAR",
        write:
            "AGENDA_CREAR",
    },
    {
        file:
            "src/app/(sistema)/agenda/[id]/actions.ts",
        read:
            "AGENDA_VER",
        write:
            "AGENDA_EDITAR",
        overrides: [
            [
                /confirm/i,
                "AGENDA_CONFIRMAR",
            ],
            [
                /espera/i,
                "AGENDA_EN_ESPERA",
            ],
            [
                /iniciar|inicio/i,
                "AGENDA_INICIAR",
            ],
            [
                /finaliz/i,
                "AGENDA_FINALIZAR",
            ],
            [
                /reprogram/i,
                "AGENDA_REPROGRAMAR",
            ],
            [
                /cancel/i,
                "AGENDA_CANCELAR",
            ],
            [
                /no.?asist|inasist/i,
                "AGENDA_NO_ASISTIO",
            ],
            [
                /cobrar|cobro/i,
                "AGENDA_COBRAR",
            ],
            [
                /editar|actualizar|modificar/i,
                "AGENDA_EDITAR",
            ],
        ],
    },

    // ========================================================
    // CAJA
    // ========================================================
    {
        file:
            "src/app/(sistema)/caja/actions.ts",
        read:
            "CAJA_VER",
        write:
            "CAJA_ABRIR",
        overrides: [
            [
                /abrir/i,
                "CAJA_ABRIR",
            ],
            [
                /cerrar/i,
                "CAJA_CERRAR",
            ],
        ],
    },
    {
        file:
            "src/app/(sistema)/caja/cierre/[id]/actions.ts",
        read:
            "CAJA_VER_CIERRES",
        write:
            "CAJA_CERRAR",
    },
    {
        file:
            "src/app/(sistema)/caja/cobrar/actions.ts",
        read:
            "CAJA_COBRAR",
        write:
            "CAJA_COBRAR",
    },
    {
        file:
            "src/app/(sistema)/caja/movimientos/[id]/actions.ts",
        read:
            "CAJA_VER",
        writeAny: [
            "CAJA_INGRESO_MANUAL",
            "CAJA_EGRESO_MANUAL",
        ],
    },
    {
        file:
            "src/app/(sistema)/caja/venta-directa/actions.ts",
        read:
            "CAJA_VENTA_DIRECTA",
        write:
            "CAJA_VENTA_DIRECTA",
    },
    {
        file:
            "src/app/(sistema)/caja/venta-productos/actions.ts",
        read:
            "CAJA_VENTA_DIRECTA",
        write:
            "CAJA_VENTA_DIRECTA",
    },
    {
        file:
            "src/app/(sistema)/caja/ventas/[id]/actions.ts",
        read:
            "CAJA_VER",
        write:
            "CAJA_ANULAR_VENTA",
        overrides: [
            [
                /anular|cancel/i,
                "CAJA_ANULAR_VENTA",
            ],
        ],
    },

    // ========================================================
    // CUENTAS POR COBRAR
    // ========================================================
    {
        file:
            "src/app/(sistema)/cuentas-cobrar/[clienteId]/actions.ts",
        read:
            "CUENTAS_COBRAR_VER",
        write:
            "CUENTAS_COBRAR_EDITAR",
    },
    {
        file:
            "src/app/(sistema)/cuentas-cobrar/[clienteId]/abonar/[cuentaId]/actions.ts",
        read:
            "CUENTAS_COBRAR_VER",
        write:
            "CUENTAS_COBRAR_ABONAR",
    },

    // ========================================================
    // INVENTARIO
    // ========================================================
    {
        file:
            "src/app/(sistema)/inventario/catalogo/actions.ts",
        read:
            "INVENTARIO_VER",
        write:
            "INVENTARIO_PRODUCTOS_EDITAR",
        overrides: [
            [
                /crear|nuevo|registrar/i,
                "INVENTARIO_PRODUCTOS_CREAR",
            ],
            [
                /editar|actualizar|modificar|eliminar|inactivar|activar/i,
                "INVENTARIO_PRODUCTOS_EDITAR",
            ],
        ],
    },
    {
        file:
            "src/app/(sistema)/inventario/catalogo/product-actions.ts",
        read:
            "INVENTARIO_VER",
        write:
            "INVENTARIO_PRODUCTOS_EDITAR",
        overrides: [
            [
                /crear|nuevo|registrar/i,
                "INVENTARIO_PRODUCTOS_CREAR",
            ],
            [
                /editar|actualizar|modificar|eliminar|inactivar|activar/i,
                "INVENTARIO_PRODUCTOS_EDITAR",
            ],
        ],
    },
    {
        file:
            "src/app/(sistema)/inventario/movimientos/nuevo/actions.ts",
        read:
            "INVENTARIO_VER_MOVIMIENTOS",
        write:
            "INVENTARIO_AJUSTAR",
    },
    {
        file:
            "src/app/(sistema)/inventario/traslados/actions.ts",
        read:
            "INVENTARIO_VER",
        write:
            "INVENTARIO_TRASLADAR",
    },

    // ========================================================
    // COMPRAS
    // ========================================================
    {
        file:
            "src/app/(sistema)/compras/nueva/actions.ts",
        read:
            "COMPRAS_VER",
        write:
            "COMPRAS_CREAR",
    },
    {
        file:
            "src/app/(sistema)/compras/[compraId]/actions.ts",
        read:
            "COMPRAS_VER",
        write:
            "COMPRAS_CREAR",
        overrides: [
            [
                /pagar|pago|abonar|abono/i,
                "COMPRAS_PAGAR",
            ],
            [
                /anular|cancel/i,
                "COMPRAS_ANULAR",
            ],
        ],
    },
    {
        file:
            "src/app/(sistema)/compras/cuentas-pagar/[cuentaId]/actions.ts",
        read:
            "COMPRAS_VER",
        write:
            "COMPRAS_PAGAR",
    },
    {
        file:
            "src/app/(sistema)/compras/proveedores/actions.ts",
        read:
            "PROVEEDORES_VER",
        write:
            "PROVEEDORES_EDITAR",
        overrides: [
            [
                /crear|nuevo|registrar/i,
                "PROVEEDORES_CREAR",
            ],
            [
                /editar|actualizar|modificar|eliminar|inactivar|activar/i,
                "PROVEEDORES_EDITAR",
            ],
        ],
    },

    // ========================================================
    // FINANZAS
    // ========================================================
    {
        file:
            "src/app/(sistema)/finanzas/categorias/actions.ts",
        read:
            "FINANZAS_VER",
        write:
            "FINANZAS_CATEGORIAS",
    },
    {
        file:
            "src/app/(sistema)/finanzas/gastos/nuevo/actions.ts",
        read:
            "FINANZAS_VER",
        write:
            "FINANZAS_GASTO",
    },
    {
        file:
            "src/app/(sistema)/finanzas/ingresos/nuevo/actions.ts",
        read:
            "FINANZAS_VER",
        write:
            "FINANZAS_INGRESO",
    },

    // ========================================================
    // CONFIGURACION
    // ========================================================
    {
        file:
            "src/app/(sistema)/configuracion/actions.ts",
        read:
            "CONFIGURACION_VER",
        write:
            "CONFIGURACION_EDITAR",
        overrides: [
            [
                /pos|terminal/i,
                "CONFIGURACION_POS",
            ],
        ],
    },
    {
        file:
            "src/app/(sistema)/configuracion/notificaciones/actions.ts",
        read:
            "NOTIFICACIONES_CONFIGURAR",
        write:
            "NOTIFICACIONES_CONFIGURAR",
    },

    // ========================================================
    // NOTIFICACIONES
    // ========================================================
    {
        file:
            "src/app/(sistema)/notificaciones/actions.ts",
        read:
            "NOTIFICACIONES_VER",
        write:
            "NOTIFICACIONES_GESTIONAR",
    },
];

function normalizar(
    value,
) {
    return value.replace(
        /\\/g,
        "/",
    );
}

function isExportedAsyncFunction(
    node,
) {
    if (
        !ts.isFunctionDeclaration(
            node,
        ) ||
        !node.body ||
        !node.name
    ) {
        return false;
    }

    const modifiers =
        node.modifiers ??
        [];

    const exported =
        modifiers.some(
            (
                modifier,
            ) =>
                modifier.kind ===
                ts.SyntaxKind.ExportKeyword,
        );

    const asyncModifier =
        modifiers.some(
            (
                modifier,
            ) =>
                modifier.kind ===
                ts.SyntaxKind.AsyncKeyword,
        );

    return (
        exported &&
        asyncModifier
    );
}

function functionMutates(
    source,
    node,
) {
    const bodyText =
        source
            .slice(
                node.body.pos,
                node.body.end,
            );

    return (
        /\.(insert|update|delete|upsert)\s*\(/i.test(
            bodyText,
        ) ||
        /\.rpc\s*\(/i.test(
            bodyText,
        )
    );
}

function chooseRule(
    target,
    functionName,
    mutates,
) {
    for (
        const [
            regex,
            permiso,
        ]
        of target.overrides ??
        []
    ) {
        if (
            regex.test(
                functionName,
            )
        ) {
            return {
                kind:
                    "one",
                permisos: [
                    permiso,
                ],
            };
        }
    }

    if (
        mutates &&
        target.writeAny
    ) {
        return {
            kind:
                "any",
            permisos:
                target.writeAny,
        };
    }

    return {
        kind:
            "one",
        permisos: [
            mutates
                ? target.write
                : target.read,
        ],
    };
}

function buildGuard(
    rule,
) {
    if (
        rule.kind ===
        "any"
    ) {
        const permisos =
            rule.permisos
                .map(
                    (
                        permiso,
                    ) =>
                        `PERMISOS.${permiso}`,
                )
                .join(
                    ", ",
                );

        return `\n        await exigirCualquieraPermisosAccion([${permisos}]);`;
    }

    return `\n        await exigirPermisoAccion(PERMISOS.${rule.permisos[0]});`;
}

function ensureImports(
    source,
) {
    let result =
        source;

    if (
        !result.includes(
            '@/lib/permisos/acciones',
        )
    ) {
        const useServer =
            result.match(
                /^["']use server["'];?\s*/m,
            );

        if (
            useServer
        ) {
            const insertAt =
                useServer.index +
                useServer[0].length;

            result =
                result.slice(
                    0,
                    insertAt,
                ) +
                `\n\n${IMPORT_ACCIONES}\n${IMPORT_CODIGOS}` +
                result.slice(
                    insertAt,
                );
        } else {
            result =
                `${IMPORT_ACCIONES}\n${IMPORT_CODIGOS}\n\n${result}`;
        }
    } else if (
        !result.includes(
            '@/lib/permisos/codigos',
        )
    ) {
        const firstImportEnd =
            result.indexOf(
                "\n",
                result.indexOf(
                    "import ",
                ),
            );

        result =
            result.slice(
                0,
                firstImportEnd + 1,
            ) +
            `${IMPORT_CODIGOS}\n` +
            result.slice(
                firstImportEnd + 1,
            );
    }

    return result;
}

function patchTarget(
    target,
) {
    const absolute =
        path.join(
            ROOT,
            target.file,
        );

    if (
        !fs.existsSync(
            absolute,
        )
    ) {
        return {
            file:
                target.file,
            status:
                "NO_ENCONTRADO",
            functions: [],
        };
    }

    let source =
        fs.readFileSync(
            absolute,
            "utf8",
        );

    const before =
        source;

    source =
        ensureImports(
            source,
        );

    const sourceFile =
        ts.createSourceFile(
            target.file,
            source,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );

    const insertions =
        [];
    const functionReport =
        [];

    for (
        const node
        of sourceFile.statements
    ) {
        if (
            !isExportedAsyncFunction(
                node,
            )
        ) {
            continue;
        }

        const name =
            node.name.text;

        const mutates =
            functionMutates(
                source,
                node,
            );

        const rule =
            chooseRule(
                target,
                name,
                mutates,
            );

        const bodyStart =
            node.body.getStart(
                sourceFile,
            );

        const nearby =
            source.slice(
                bodyStart,
                Math.min(
                    source.length,
                    bodyStart +
                    500,
                ),
            );

        const alreadyGuarded =
            nearby.includes(
                "exigirPermisoAccion(",
            ) ||
            nearby.includes(
                "exigirCualquieraPermisosAccion(",
            );

        functionReport.push({
            name,
            mutates,
            rule,
            alreadyGuarded,
        });

        if (
            alreadyGuarded
        ) {
            continue;
        }

        insertions.push({
            pos:
                bodyStart +
                1,
            text:
                buildGuard(
                    rule,
                ),
        });
    }

    insertions.sort(
        (
            a,
            b,
        ) =>
            b.pos -
            a.pos,
    );

    for (
        const insertion
        of insertions
    ) {
        source =
            source.slice(
                0,
                insertion.pos,
            ) +
            insertion.text +
            source.slice(
                insertion.pos,
            );
    }

    if (
        source ===
        before
    ) {
        return {
            file:
                target.file,
            status:
                "SIN_CAMBIOS",
            functions:
                functionReport,
        };
    }

    const backup =
        `${absolute}.bak-4I-B2`;

    if (
        !fs.existsSync(
            backup,
        )
    ) {
        fs.copyFileSync(
            absolute,
            backup,
        );
    }

    fs.writeFileSync(
        absolute,
        source,
        "utf8",
    );

    return {
        file:
            target.file,
        status:
            "ACTUALIZADO",
        functions:
            functionReport,
    };
}

const results =
    targets.map(
        patchTarget,
    );

const lines = [];

lines.push(
    "============================================================",
);
lines.push(
    "4I-B2 - REPORTE DE PROTECCION DE SERVER ACTIONS",
);
lines.push(
    `Fecha: ${new Date().toISOString()}`,
);
lines.push(
    "============================================================",
);
lines.push(
    "",
);

for (
    const result
    of results
) {
    lines.push(
        `ARCHIVO: ${normalizar(result.file)}`,
    );
    lines.push(
        `ESTADO: ${result.status}`,
    );

    for (
        const fn
        of result.functions
    ) {
        lines.push(
            `  - ${fn.name}`,
        );
        lines.push(
            `    tipo: ${fn.mutates ? "MUTACION" : "LECTURA"}`,
        );
        lines.push(
            `    permiso: ${fn.rule.permisos.join(" O ")}`,
        );
        lines.push(
            `    ya_protegida: ${fn.alreadyGuarded ? "SI" : "NO"}`,
        );
    }

    lines.push(
        "",
    );
}

fs.writeFileSync(
    REPORT,
    lines.join(
        "\n",
    ),
    "utf8",
);

console.log(
    "",
);
console.log(
    "4I-B2 terminado.",
);
console.log(
    "",
);

for (
    const result
    of results
) {
    console.log(
        `${result.status.padEnd(14)} ${result.file}`,
    );
}

console.log(
    "",
);
console.log(
    `Reporte: ${REPORT}`,
);
console.log(
    "",
);
console.log(
    "Ahora ejecuta: npm run build",
);
