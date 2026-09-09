/**
 * Mapa central de rutas -> permiso requerido.
 *
 * El orden importa:
 * primero van rutas mas especificas y luego las generales.
 */

export type ReglaPermisoRuta = {
    coincide: (
        pathname: string,
    ) => boolean;
    permiso: string;
};

export const reglasPermisosRutas: ReglaPermisoRuta[] = [
    // USUARIOS
    {
        coincide: (p) =>
            p === "/usuarios/nuevo",
        permiso: "USUARIOS_CREAR",
    },
    {
        coincide: (p) =>
            /^\/usuarios\/[^/]+\/editar\/?$/.test(
                p,
            ),
        permiso: "USUARIOS_EDITAR",
    },
    {
        coincide: (p) =>
            /^\/usuarios\/[^/]+\/permisos\/?$/.test(
                p,
            ),
        permiso: "USUARIOS_PERMISOS",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/usuarios",
            ),
        permiso: "USUARIOS_VER",
    },

    // AGENDA
    {
        coincide: (p) =>
            p === "/agenda/nueva",
        permiso: "AGENDA_CREAR",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/agenda",
            ),
        permiso: "AGENDA_VER",
    },

    // CLIENTES
    {
        coincide: (p) =>
            p.startsWith(
                "/clientes",
            ),
        permiso: "CLIENTES_VER",
    },

    // TRABAJADORES
    {
        coincide: (p) =>
            p.startsWith(
                "/trabajadores",
            ),
        permiso: "TRABAJADORES_VER",
    },

    // SERVICIOS
    {
        coincide: (p) =>
            p.startsWith(
                "/servicios",
            ),
        permiso: "SERVICIOS_VER",
    },

    // CAJA
    {
        coincide: (p) =>
            p.startsWith(
                "/caja/cobrar",
            ),
        permiso: "CAJA_COBRAR",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/caja/venta-directa",
            ) ||
            p.startsWith(
                "/caja/venta-productos",
            ),
        permiso:
            "CAJA_VENTA_DIRECTA",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/caja",
            ),
        permiso: "CAJA_VER",
    },

    // CUENTAS POR COBRAR
    {
        coincide: (p) =>
            p.includes(
                "/abonar/",
            ) &&
            p.startsWith(
                "/cuentas-cobrar",
            ),
        permiso:
            "CUENTAS_COBRAR_ABONAR",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/cuentas-cobrar",
            ),
        permiso:
            "CUENTAS_COBRAR_VER",
    },

    // INVENTARIO
    {
        coincide: (p) =>
            p.startsWith(
                "/inventario/movimientos/nuevo",
            ),
        permiso:
            "INVENTARIO_AJUSTAR",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/inventario/traslados",
            ),
        permiso:
            "INVENTARIO_TRASLADAR",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/inventario/catalogo/nuevo",
            ),
        permiso:
            "INVENTARIO_PRODUCTOS_CREAR",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/inventario/catalogo/",
            ) &&
            p.includes(
                "/editar",
            ),
        permiso:
            "INVENTARIO_PRODUCTOS_EDITAR",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/inventario",
            ),
        permiso: "INVENTARIO_VER",
    },

    // COMPRAS
    {
        coincide: (p) =>
            p.startsWith(
                "/compras",
            ),
        permiso: "COMPRAS_VER",
    },

    // FINANZAS
    {
        coincide: (p) =>
            p.startsWith(
                "/finanzas/ingresos/nuevo",
            ),
        permiso:
            "FINANZAS_INGRESO",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/finanzas/gastos/nuevo",
            ),
        permiso:
            "FINANZAS_GASTO",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/finanzas/categorias",
            ),
        permiso:
            "FINANZAS_CATEGORIAS",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/finanzas",
            ),
        permiso: "FINANZAS_VER",
    },

    // REPORTES
    {
        coincide: (p) =>
            p.startsWith(
                "/reportes/ventas",
            ),
        permiso: "REPORTES_VENTAS",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/reportes/citas-servicios",
            ),
        permiso: "REPORTES_CITAS",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/reportes/clientes",
            ),
        permiso:
            "REPORTES_CLIENTES",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/reportes/inventario",
            ),
        permiso:
            "REPORTES_INVENTARIO",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/reportes/compras-proveedores",
            ),
        permiso:
            "REPORTES_COMPRAS",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/reportes/financiero",
            ) ||
            p.startsWith(
                "/reportes/comparativos",
            ),
        permiso:
            "REPORTES_FINANCIEROS",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/reportes",
            ),
        permiso: "REPORTES_VER",
    },

    // NOTIFICACIONES
    {
        coincide: (p) =>
            p.startsWith(
                "/configuracion/notificaciones",
            ),
        permiso:
            "NOTIFICACIONES_CONFIGURAR",
    },
    {
        coincide: (p) =>
            p.startsWith(
                "/notificaciones",
            ),
        permiso:
            "NOTIFICACIONES_VER",
    },

    // CONFIGURACION
    {
        coincide: (p) =>
            p.startsWith(
                "/configuracion",
            ),
        permiso:
            "CONFIGURACION_VER",
    },

    // INICIO
    {
        coincide: (p) =>
            p.startsWith(
                "/inicio",
            ),
        permiso: "INICIO_VER",
    },
];

export function obtenerPermisoRuta(
    pathname: string,
) {
    return (
        reglasPermisosRutas.find(
            (
                regla,
            ) =>
                regla.coincide(
                    pathname,
                ),
        )?.permiso ??
        null
    );
}
