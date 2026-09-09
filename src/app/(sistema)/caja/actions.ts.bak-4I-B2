"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DatosAperturaCaja = {
    sucursalId: string;
    montoInicial: number;
    observaciones: string;
};

export type ResultadoCaja = {
    exito: boolean;
    mensaje: string;
    cajaId?: string;
};

async function obtenerContextoUsuario() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        return {
            supabase,
            perfil: null,
            userId: null,
            error: "Tu sesión ha vencido.",
        };
    }

    const { data: perfil, error: perfilError } =
        await supabase
            .from("usuarios_perfiles")
            .select("salon_id, rol, estado")
            .eq("id", user.id)
            .single();

    if (
        perfilError ||
        !perfil ||
        perfil.estado !== "ACTIVO"
    ) {
        return {
            supabase,
            perfil: null,
            userId: user.id,
            error: "No fue posible verificar tu perfil.",
        };
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
            "RECEPCION",
            "CAJA",
        ].includes(perfil.rol)
    ) {
        return {
            supabase,
            perfil: null,
            userId: user.id,
            error:
                "No tienes permisos para administrar la caja.",
        };
    }

    return {
        supabase,
        perfil,
        userId: user.id,
        error: null,
    };
}

export async function abrirCaja(
    datos: DatosAperturaCaja,
): Promise<ResultadoCaja> {
    try {
        if (!datos.sucursalId) {
            return {
                exito: false,
                mensaje: "Selecciona una sucursal.",
            };
        }

        if (
            !Number.isFinite(datos.montoInicial) ||
            datos.montoInicial < 0
        ) {
            return {
                exito: false,
                mensaje:
                    "El monto inicial no puede ser negativo.",
            };
        }

        const contexto = await obtenerContextoUsuario();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.userId
        ) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesión.",
            };
        }

        const { supabase, perfil, userId } = contexto;

        const { data: sucursal, error: sucursalError } =
            await supabase
                .from("sucursales")
                .select("id, nombre, estado")
                .eq("id", datos.sucursalId)
                .eq("salon_id", perfil.salon_id)
                .single();

        if (
            sucursalError ||
            !sucursal ||
            sucursal.estado !== "ACTIVA"
        ) {
            return {
                exito: false,
                mensaje:
                    "La sucursal no existe o no está activa.",
            };
        }

        const { data: cajaExistente, error: cajaError } =
            await supabase
                .from("cajas_sesiones")
                .select("id")
                .eq("salon_id", perfil.salon_id)
                .eq("sucursal_id", datos.sucursalId)
                .eq("estado", "ABIERTA")
                .maybeSingle();

        if (cajaError) {
            return {
                exito: false,
                mensaje: `No fue posible comprobar la caja: ${cajaError.message}`,
            };
        }

        if (cajaExistente) {
            return {
                exito: false,
                mensaje:
                    "Esta sucursal ya tiene una caja abierta.",
                cajaId: cajaExistente.id,
            };
        }

        const ahora = new Date().toISOString();
        const montoInicial = Number(
            datos.montoInicial.toFixed(2),
        );

        const { data: nuevaCaja, error: crearError } =
            await supabase
                .from("cajas_sesiones")
                .insert({
                    salon_id: perfil.salon_id,
                    sucursal_id: datos.sucursalId,
                    usuario_apertura_id: userId,
                    fecha_apertura: ahora,
                    monto_inicial: montoInicial,
                    estado: "ABIERTA",
                    observaciones_apertura:
                        datos.observaciones.trim() || null,
                    actualizado_en: ahora,
                })
                .select("id")
                .single();

        if (crearError || !nuevaCaja) {
            const esDuplicada =
                crearError?.code === "23505";

            return {
                exito: false,
                mensaje: esDuplicada
                    ? "Esta sucursal ya tiene una caja abierta."
                    : crearError
                        ? `No fue posible abrir la caja: ${crearError.message}`
                        : "No fue posible obtener la caja creada.",
            };
        }

        /*
         * El movimiento de apertura solo se registra cuando
         * existe efectivo inicial mayor que cero.
         */
        if (montoInicial > 0) {
            const { error: movimientoError } =
                await supabase
                    .from("movimientos_caja")
                    .insert({
                        salon_id: perfil.salon_id,
                        sucursal_id: datos.sucursalId,
                        caja_sesion_id: nuevaCaja.id,
                        tipo: "APERTURA",
                        naturaleza: "ENTRADA",
                        metodo_pago: "EFECTIVO",
                        concepto: "Monto inicial de caja",
                        monto: montoInicial,
                        observaciones:
                            datos.observaciones.trim() ||
                            null,
                        registrado_por: userId,
                        fecha_movimiento: ahora,
                    });

            if (movimientoError) {
                await supabase
                    .from("cajas_sesiones")
                    .delete()
                    .eq("id", nuevaCaja.id)
                    .eq("salon_id", perfil.salon_id);

                return {
                    exito: false,
                    mensaje: `No fue posible registrar el movimiento de apertura: ${movimientoError.message}`,
                };
            }
        }

        revalidatePath("/caja");

        return {
            exito: true,
            mensaje: `Caja de ${sucursal.nombre} abierta correctamente.`,
            cajaId: nuevaCaja.id,
        };
    } catch (error) {
        console.error("Error abriendo caja:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al abrir la caja.",
        };
    }
}