"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type DatosFichaBelleza = {
    alergias: string;
    sensibilidades: string;
    tipoCabello: string;
    texturaCabello: string;
    estadoCabello: string;
    colorNaturalCabello: string;
    colorActualCabello: string;
    tratamientosPrevios: string;
    productosPreferidos: string;
    productosNoRecomendados: string;
    preferenciasGenerales: string;
    restricciones: string;
    observacionesProfesionales: string;
};

export type DatosFormula = {
    trabajadorId: string;
    nombre: string;
    tipo:
    | "TINTE"
    | "DECOLORACION"
    | "TRATAMIENTO"
    | "MEZCLA"
    | "OTRO";
    formula: string;
    resultado: string;
    observaciones: string;
    fechaAplicacion: string;
};

export type DatosNota = {
    titulo: string;
    nota: string;
    tipo:
    | "GENERAL"
    | "PREFERENCIA"
    | "ALERGIA"
    | "SERVICIO"
    | "PAGO"
    | "IMPORTANTE"
    | "OTRO";
    esImportante: boolean;
};

export type ResultadoAccion = {
    exito: boolean;
    mensaje: string;
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
            user: null,
            error: "Tu sesión ha vencido.",
        };
    }

    const { data: perfil, error: perfilError } = await supabase
        .from("usuarios_perfiles")
        .select("salon_id, rol, estado")
        .eq("id", user.id)
        .single();

    if (perfilError || !perfil) {
        return {
            supabase,
            perfil: null,
            user,
            error: "No fue posible verificar tu perfil.",
        };
    }

    if (perfil.estado !== "ACTIVO") {
        return {
            supabase,
            perfil: null,
            user,
            error: "Tu usuario está inactivo.",
        };
    }

    return {
        supabase,
        perfil,
        user,
        error: null,
    };
}

async function verificarCliente(
    supabase: Awaited<ReturnType<typeof createClient>>,
    salonId: string,
    clienteId: string,
) {
    const { data, error } = await supabase
        .from("clientes")
        .select("id")
        .eq("id", clienteId)
        .eq("salon_id", salonId)
        .single();

    return !error && Boolean(data);
}

export async function guardarFichaBelleza(
    clienteId: string,
    datos: DatosFichaBelleza,
): Promise<ResultadoAccion> {
    try {
        const contexto = await obtenerContextoUsuario();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje: contexto.error ?? "No fue posible verificar tu sesión.",
            };
        }

        if (
            !["SUPER_ADMIN", "ADMIN", "RECEPCION", "TRABAJADOR"].includes(
                contexto.perfil.rol,
            )
        ) {
            return {
                exito: false,
                mensaje: "No tienes permisos para modificar la ficha.",
            };
        }

        const pertenece = await verificarCliente(
            contexto.supabase,
            contexto.perfil.salon_id,
            clienteId,
        );

        if (!pertenece) {
            return {
                exito: false,
                mensaje: "El cliente no pertenece a tu salón.",
            };
        }

        const { error } = await contexto.supabase
            .from("clientes_ficha_belleza")
            .upsert(
                {
                    salon_id: contexto.perfil.salon_id,
                    cliente_id: clienteId,
                    alergias: datos.alergias.trim() || null,
                    sensibilidades: datos.sensibilidades.trim() || null,
                    tipo_cabello: datos.tipoCabello.trim() || null,
                    textura_cabello: datos.texturaCabello.trim() || null,
                    estado_cabello: datos.estadoCabello.trim() || null,
                    color_natural_cabello:
                        datos.colorNaturalCabello.trim() || null,
                    color_actual_cabello:
                        datos.colorActualCabello.trim() || null,
                    tratamientos_previos:
                        datos.tratamientosPrevios.trim() || null,
                    productos_preferidos:
                        datos.productosPreferidos.trim() || null,
                    productos_no_recomendados:
                        datos.productosNoRecomendados.trim() || null,
                    preferencias_generales:
                        datos.preferenciasGenerales.trim() || null,
                    restricciones: datos.restricciones.trim() || null,
                    observaciones_profesionales:
                        datos.observacionesProfesionales.trim() || null,
                    actualizado_en: new Date().toISOString(),
                },
                {
                    onConflict: "cliente_id",
                },
            );

        if (error) {
            return {
                exito: false,
                mensaje: `No fue posible guardar la ficha: ${error.message}`,
            };
        }

        revalidatePath(`/clientes/${clienteId}`);

        return {
            exito: true,
            mensaje: "Ficha de belleza guardada correctamente.",
        };
    } catch (error) {
        console.error("Error guardando ficha:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado al guardar la ficha.",
        };
    }
}

export async function crearFormulaCliente(
    clienteId: string,
    datos: DatosFormula,
): Promise<ResultadoAccion> {
    try {
        if (datos.nombre.trim().length < 2) {
            return {
                exito: false,
                mensaje: "Escribe un nombre para la fórmula.",
            };
        }

        if (datos.formula.trim().length < 2) {
            return {
                exito: false,
                mensaje: "Escribe la fórmula o mezcla utilizada.",
            };
        }

        const contexto = await obtenerContextoUsuario();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.user
        ) {
            return {
                exito: false,
                mensaje: contexto.error ?? "No fue posible verificar tu sesión.",
            };
        }

        if (
            !["SUPER_ADMIN", "ADMIN", "TRABAJADOR"].includes(
                contexto.perfil.rol,
            )
        ) {
            return {
                exito: false,
                mensaje: "No tienes permisos para registrar fórmulas.",
            };
        }

        const pertenece = await verificarCliente(
            contexto.supabase,
            contexto.perfil.salon_id,
            clienteId,
        );

        if (!pertenece) {
            return {
                exito: false,
                mensaje: "El cliente no pertenece a tu salón.",
            };
        }

        if (datos.trabajadorId) {
            const { data: trabajador, error: trabajadorError } =
                await contexto.supabase
                    .from("trabajadores")
                    .select("id")
                    .eq("id", datos.trabajadorId)
                    .eq("salon_id", contexto.perfil.salon_id)
                    .single();

            if (trabajadorError || !trabajador) {
                return {
                    exito: false,
                    mensaje: "El trabajador seleccionado no es válido.",
                };
            }
        }

        const { error } = await contexto.supabase
            .from("clientes_formulas")
            .insert({
                salon_id: contexto.perfil.salon_id,
                cliente_id: clienteId,
                trabajador_id: datos.trabajadorId || null,
                nombre: datos.nombre.trim(),
                tipo: datos.tipo,
                formula: datos.formula.trim(),
                resultado: datos.resultado.trim() || null,
                observaciones: datos.observaciones.trim() || null,
                fecha_aplicacion: datos.fechaAplicacion || null,
                creado_por: contexto.user.id,
                estado: "ACTIVA",
                actualizado_en: new Date().toISOString(),
            });

        if (error) {
            return {
                exito: false,
                mensaje: `No fue posible registrar la fórmula: ${error.message}`,
            };
        }

        revalidatePath(`/clientes/${clienteId}`);

        return {
            exito: true,
            mensaje: "Fórmula registrada correctamente.",
        };
    } catch (error) {
        console.error("Error creando fórmula:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado al registrar la fórmula.",
        };
    }
}

export async function crearNotaCliente(
    clienteId: string,
    datos: DatosNota,
): Promise<ResultadoAccion> {
    try {
        if (datos.nota.trim().length < 2) {
            return {
                exito: false,
                mensaje: "La nota está vacía.",
            };
        }

        const contexto = await obtenerContextoUsuario();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.user
        ) {
            return {
                exito: false,
                mensaje: contexto.error ?? "No fue posible verificar tu sesión.",
            };
        }

        const pertenece = await verificarCliente(
            contexto.supabase,
            contexto.perfil.salon_id,
            clienteId,
        );

        if (!pertenece) {
            return {
                exito: false,
                mensaje: "El cliente no pertenece a tu salón.",
            };
        }

        const { error } = await contexto.supabase
            .from("clientes_notas")
            .insert({
                salon_id: contexto.perfil.salon_id,
                cliente_id: clienteId,
                usuario_id: contexto.user.id,
                titulo: datos.titulo.trim() || null,
                nota: datos.nota.trim(),
                tipo: datos.tipo,
                es_importante: datos.esImportante,
                estado: "ACTIVA",
                actualizado_en: new Date().toISOString(),
            });

        if (error) {
            return {
                exito: false,
                mensaje: `No fue posible registrar la nota: ${error.message}`,
            };
        }

        revalidatePath(`/clientes/${clienteId}`);

        return {
            exito: true,
            mensaje: "Nota registrada correctamente.",
        };
    } catch (error) {
        console.error("Error creando nota:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado al registrar la nota.",
        };
    }
}

export async function subirArchivoCliente(
    formData: FormData,
): Promise<ResultadoAccion> {
    try {
        const clienteId = String(formData.get("clienteId") ?? "");
        const tipo = String(formData.get("tipo") ?? "OTRO");
        const descripcion = String(formData.get("descripcion") ?? "");
        const fechaServicio = String(formData.get("fechaServicio") ?? "");
        const archivo = formData.get("archivo");

        if (!(archivo instanceof File) || archivo.size === 0) {
            return {
                exito: false,
                mensaje: "Selecciona un archivo.",
            };
        }

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
        ];

        if (!tiposPermitidos.includes(archivo.type)) {
            return {
                exito: false,
                mensaje:
                    "Solo se permiten imágenes JPG, PNG, WEBP o archivos PDF.",
            };
        }

        if (archivo.size > 8 * 1024 * 1024) {
            return {
                exito: false,
                mensaje: "El archivo no puede superar 8 MB.",
            };
        }

        const contexto = await obtenerContextoUsuario();

        if (
            contexto.error ||
            !contexto.perfil ||
            !contexto.user
        ) {
            return {
                exito: false,
                mensaje: contexto.error ?? "No fue posible verificar tu sesión.",
            };
        }

        if (
            !["SUPER_ADMIN", "ADMIN", "RECEPCION", "TRABAJADOR"].includes(
                contexto.perfil.rol,
            )
        ) {
            return {
                exito: false,
                mensaje: "No tienes permisos para subir archivos.",
            };
        }

        const pertenece = await verificarCliente(
            contexto.supabase,
            contexto.perfil.salon_id,
            clienteId,
        );

        if (!pertenece) {
            return {
                exito: false,
                mensaje: "El cliente no pertenece a tu salón.",
            };
        }

        const extension =
            archivo.name.split(".").pop()?.toLowerCase() || "bin";

        const ruta = `${contexto.perfil.salon_id}/${clienteId}/${randomUUID()}.${extension}`;

        const { error: storageError } = await contexto.supabase.storage
            .from("clientes-archivos")
            .upload(ruta, archivo, {
                contentType: archivo.type,
                upsert: false,
            });

        if (storageError) {
            return {
                exito: false,
                mensaje: `No fue posible subir el archivo: ${storageError.message}`,
            };
        }

        const { error: registroError } = await contexto.supabase
            .from("clientes_archivos")
            .insert({
                salon_id: contexto.perfil.salon_id,
                cliente_id: clienteId,
                tipo,
                nombre_archivo: archivo.name,
                ruta_archivo: ruta,
                descripcion: descripcion.trim() || null,
                fecha_servicio: fechaServicio || null,
                creado_por: contexto.user.id,
            });

        if (registroError) {
            await contexto.supabase.storage
                .from("clientes-archivos")
                .remove([ruta]);

            return {
                exito: false,
                mensaje: `No fue posible registrar el archivo: ${registroError.message}`,
            };
        }

        revalidatePath(`/clientes/${clienteId}`);

        return {
            exito: true,
            mensaje: "Archivo subido correctamente.",
        };
    } catch (error) {
        console.error("Error subiendo archivo:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado al subir el archivo.",
        };
    }
}

export async function eliminarFormulaCliente(
    clienteId: string,
    formulaId: string,
): Promise<ResultadoAccion> {
    try {
        const contexto = await obtenerContextoUsuario();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesión.",
            };
        }

        if (
            !["SUPER_ADMIN", "ADMIN", "TRABAJADOR"].includes(
                contexto.perfil.rol,
            )
        ) {
            return {
                exito: false,
                mensaje:
                    "No tienes permisos para eliminar fórmulas.",
            };
        }

        const { data: formula, error: formulaError } =
            await contexto.supabase
                .from("clientes_formulas")
                .select("id")
                .eq("id", formulaId)
                .eq("cliente_id", clienteId)
                .eq("salon_id", contexto.perfil.salon_id)
                .single();

        if (formulaError || !formula) {
            return {
                exito: false,
                mensaje:
                    "La fórmula no existe o no pertenece a este cliente.",
            };
        }

        const { error } = await contexto.supabase
            .from("clientes_formulas")
            .delete()
            .eq("id", formulaId)
            .eq("cliente_id", clienteId)
            .eq("salon_id", contexto.perfil.salon_id);

        if (error) {
            return {
                exito: false,
                mensaje: `No fue posible eliminar la fórmula: ${error.message}`,
            };
        }

        revalidatePath(`/clientes/${clienteId}`);

        return {
            exito: true,
            mensaje: "Fórmula eliminada correctamente.",
        };
    } catch (error) {
        console.error("Error eliminando fórmula:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al eliminar la fórmula.",
        };
    }
}

export async function eliminarNotaCliente(
    clienteId: string,
    notaId: string,
): Promise<ResultadoAccion> {
    try {
        const contexto = await obtenerContextoUsuario();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesión.",
            };
        }

        if (
            ![
                "SUPER_ADMIN",
                "ADMIN",
                "RECEPCION",
                "CAJA",
                "TRABAJADOR",
            ].includes(contexto.perfil.rol)
        ) {
            return {
                exito: false,
                mensaje: "No tienes permisos para eliminar notas.",
            };
        }

        const { data: nota, error: notaError } =
            await contexto.supabase
                .from("clientes_notas")
                .select("id")
                .eq("id", notaId)
                .eq("cliente_id", clienteId)
                .eq("salon_id", contexto.perfil.salon_id)
                .single();

        if (notaError || !nota) {
            return {
                exito: false,
                mensaje:
                    "La nota no existe o no pertenece a este cliente.",
            };
        }

        const { error } = await contexto.supabase
            .from("clientes_notas")
            .delete()
            .eq("id", notaId)
            .eq("cliente_id", clienteId)
            .eq("salon_id", contexto.perfil.salon_id);

        if (error) {
            return {
                exito: false,
                mensaje: `No fue posible eliminar la nota: ${error.message}`,
            };
        }

        revalidatePath(`/clientes/${clienteId}`);

        return {
            exito: true,
            mensaje: "Nota eliminada correctamente.",
        };
    } catch (error) {
        console.error("Error eliminando nota:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al eliminar la nota.",
        };
    }
}

export async function eliminarArchivoCliente(
    clienteId: string,
    archivoId: string,
): Promise<ResultadoAccion> {
    try {
        const contexto = await obtenerContextoUsuario();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar tu sesión.",
            };
        }

        if (
            !["SUPER_ADMIN", "ADMIN"].includes(
                contexto.perfil.rol,
            )
        ) {
            return {
                exito: false,
                mensaje:
                    "Solo un administrador puede eliminar archivos.",
            };
        }

        const { data: archivo, error: archivoError } =
            await contexto.supabase
                .from("clientes_archivos")
                .select("id, ruta_archivo")
                .eq("id", archivoId)
                .eq("cliente_id", clienteId)
                .eq("salon_id", contexto.perfil.salon_id)
                .single();

        if (archivoError || !archivo) {
            return {
                exito: false,
                mensaje:
                    "El archivo no existe o no pertenece a este cliente.",
            };
        }

        const { error: storageError } =
            await contexto.supabase.storage
                .from("clientes-archivos")
                .remove([archivo.ruta_archivo]);

        if (storageError) {
            return {
                exito: false,
                mensaje: `No fue posible eliminar el archivo del almacenamiento: ${storageError.message}`,
            };
        }

        const { error: registroError } =
            await contexto.supabase
                .from("clientes_archivos")
                .delete()
                .eq("id", archivoId)
                .eq("cliente_id", clienteId)
                .eq("salon_id", contexto.perfil.salon_id);

        if (registroError) {
            return {
                exito: false,
                mensaje: `El archivo fue eliminado del almacenamiento, pero no fue posible eliminar su registro: ${registroError.message}`,
            };
        }

        revalidatePath(`/clientes/${clienteId}`);

        return {
            exito: true,
            mensaje: "Archivo eliminado correctamente.",
        };
    } catch (error) {
        console.error("Error eliminando archivo:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al eliminar el archivo.",
        };
    }
}