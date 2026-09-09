"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TipoComisionServicio =
    | "USAR_TRABAJADOR"
    | "PORCENTAJE"
    | "MONTO_FIJO"
    | "SIN_COMISION";

export type TipoComisionEspecial =
    | "PORCENTAJE"
    | "MONTO_FIJO"
    | "SIN_COMISION";

export type UnidadMaterial =
    | "UNIDAD"
    | "ML"
    | "LITRO"
    | "GRAMO"
    | "KILOGRAMO"
    | "PAR"
    | "PAQUETE"
    | "APLICACION"
    | "OTRO";

export type EstadoServicio = "ACTIVO" | "INACTIVO";

export type TrabajadorServicioFormulario = {
    trabajadorId: string;
    usaComisionEspecial: boolean;
    tipoComisionEspecial: TipoComisionEspecial;
    comisionEspecial: number;
};

export type MaterialServicioFormulario = {
    idTemporal: string;
    productoId: string;
    nombreMaterial: string;
    cantidad: number;
    unidadMedida: UnidadMaterial;
    costoEstimado: number;
    descontarInventario: boolean;
    observaciones: string;
};

export type DatosServicio = {
    id?: string;
    categoriaId: string;
    nombre: string;
    descripcion: string;
    precio: number;
    duracionMinutos: number;
    color: string;
    permiteCitas: boolean;
    permiteDescuento: boolean;
    requiereAnticipo: boolean;
    montoAnticipo: number;
    tipoComisionGeneral: TipoComisionServicio;
    comisionGeneral: number;
    estado: EstadoServicio;
    trabajadores: TrabajadorServicioFormulario[];
    materiales: MaterialServicioFormulario[];
};

export type ResultadoAccion = {
    exito: boolean;
    mensaje: string;
};

export type ResultadoCategoria = ResultadoAccion & {
    categoria?: {
        id: string;
        nombre: string;
        color: string;
        estado: string;
    };
};

async function obtenerContextoAdministrador() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        return {
            supabase,
            perfil: null,
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
            error: "No fue posible verificar tu perfil.",
        };
    }

    if (perfil.estado !== "ACTIVO") {
        return {
            supabase,
            perfil: null,
            error: "Tu usuario se encuentra inactivo.",
        };
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(perfil.rol)) {
        return {
            supabase,
            perfil: null,
            error: "No tienes permisos para administrar servicios.",
        };
    }

    return {
        supabase,
        perfil,
        error: null,
    };
}

function validarServicio(
    datos: DatosServicio,
): ResultadoAccion | null {
    if (datos.nombre.trim().length < 2) {
        return {
            exito: false,
            mensaje: "El nombre del servicio debe tener al menos 2 caracteres.",
        };
    }

    if (!datos.categoriaId) {
        return {
            exito: false,
            mensaje: "Selecciona una categoría.",
        };
    }

    if (datos.precio < 0) {
        return {
            exito: false,
            mensaje: "El precio no puede ser negativo.",
        };
    }

    if (
        !Number.isInteger(datos.duracionMinutos) ||
        datos.duracionMinutos < 5 ||
        datos.duracionMinutos > 1440
    ) {
        return {
            exito: false,
            mensaje: "La duración debe estar entre 5 y 1440 minutos.",
        };
    }

    if (
        datos.requiereAnticipo &&
        datos.montoAnticipo <= 0
    ) {
        return {
            exito: false,
            mensaje: "El monto del anticipo debe ser mayor que cero.",
        };
    }

    if (
        datos.requiereAnticipo &&
        datos.montoAnticipo > datos.precio
    ) {
        return {
            exito: false,
            mensaje: "El anticipo no puede superar el precio del servicio.",
        };
    }

    if (
        datos.tipoComisionGeneral === "PORCENTAJE" &&
        (datos.comisionGeneral < 0 || datos.comisionGeneral > 100)
    ) {
        return {
            exito: false,
            mensaje: "La comisión porcentual debe estar entre 0 y 100.",
        };
    }

    if (
        datos.tipoComisionGeneral === "MONTO_FIJO" &&
        datos.comisionGeneral < 0
    ) {
        return {
            exito: false,
            mensaje: "La comisión fija no puede ser negativa.",
        };
    }

    const trabajadoresUnicos = new Set(
        datos.trabajadores.map(
            (trabajador) => trabajador.trabajadorId,
        ),
    );

    if (
        trabajadoresUnicos.size !==
        datos.trabajadores.length
    ) {
        return {
            exito: false,
            mensaje: "Hay trabajadores duplicados en el servicio.",
        };
    }

    for (const trabajador of datos.trabajadores) {
        if (!trabajador.trabajadorId) {
            return {
                exito: false,
                mensaje: "Existe un trabajador inválido.",
            };
        }

        if (
            trabajador.usaComisionEspecial &&
            trabajador.tipoComisionEspecial === "PORCENTAJE" &&
            (trabajador.comisionEspecial < 0 ||
                trabajador.comisionEspecial > 100)
        ) {
            return {
                exito: false,
                mensaje:
                    "Una comisión especial porcentual está fuera del rango permitido.",
            };
        }

        if (
            trabajador.usaComisionEspecial &&
            trabajador.tipoComisionEspecial === "MONTO_FIJO" &&
            trabajador.comisionEspecial < 0
        ) {
            return {
                exito: false,
                mensaje:
                    "Una comisión especial fija no puede ser negativa.",
            };
        }
    }

    for (const material of datos.materiales) {
        if (material.nombreMaterial.trim().length < 2) {
            return {
                exito: false,
                mensaje:
                    "Todos los materiales deben tener un nombre válido.",
            };
        }

        if (material.cantidad <= 0) {
            return {
                exito: false,
                mensaje:
                    "La cantidad de cada material debe ser mayor que cero.",
            };
        }

        if (material.costoEstimado < 0) {
            return {
                exito: false,
                mensaje:
                    "El costo estimado de un material no puede ser negativo.",
            };
        }

        if (
            material.descontarInventario &&
            !material.productoId
        ) {
            return {
                exito: false,
                mensaje:
                    `Selecciona el producto de inventario para el material "${material.nombreMaterial.trim()}".`,
            };
        }
    }

    return null;
}

async function validarRelaciones(
    supabase: Awaited<ReturnType<typeof createClient>>,
    salonId: string,
    datos: DatosServicio,
) {
    const { data: categoria, error: categoriaError } =
        await supabase
            .from("categorias_servicios")
            .select("id")
            .eq("id", datos.categoriaId)
            .eq("salon_id", salonId)
            .eq("estado", "ACTIVA")
            .single();

    if (categoriaError || !categoria) {
        return {
            exito: false,
            mensaje:
                "La categoría seleccionada no pertenece a tu salón o está inactiva.",
        };
    }

    const trabajadoresIds = datos.trabajadores.map(
        (trabajador) => trabajador.trabajadorId,
    );

    if (trabajadoresIds.length > 0) {
        const { data: trabajadores, error } = await supabase
            .from("trabajadores")
            .select("id")
            .eq("salon_id", salonId)
            .eq("estado", "ACTIVO")
            .in("id", trabajadoresIds);

        if (
            error ||
            (trabajadores?.length ?? 0) !==
            new Set(trabajadoresIds).size
        ) {
            return {
                exito: false,
                mensaje:
                    "Uno o más trabajadores seleccionados no pertenecen al salón o están inactivos.",
            };
        }
    }

    const productosIds = [
        ...new Set(
            datos.materiales
                .filter(
                    (material) =>
                        material.descontarInventario &&
                        material.productoId,
                )
                .map(
                    (material) =>
                        material.productoId,
                ),
        ),
    ];

    if (productosIds.length > 0) {
        const {
            data: productos,
            error: productosError,
        } = await supabase
            .from("productos")
            .select(`
                id,
                nombre,
                unidad_medida,
                controla_stock,
                permite_consumo_servicio,
                estado
            `)
            .eq("salon_id", salonId)
            .eq("estado", "ACTIVO")
            .eq("permite_consumo_servicio", true)
            .in("id", productosIds);

        if (
            productosError ||
            (productos?.length ?? 0) !==
            productosIds.length
        ) {
            return {
                exito: false,
                mensaje:
                    "Uno o más productos vinculados a los materiales no pertenecen al salón, están inactivos o no permiten consumo por servicios.",
            };
        }

        for (const material of datos.materiales) {
            if (
                !material.descontarInventario ||
                !material.productoId
            ) {
                continue;
            }

            const producto = productos?.find(
                (item) =>
                    item.id === material.productoId,
            );

            if (!producto) {
                return {
                    exito: false,
                    mensaje:
                        `No fue posible validar el producto del material "${material.nombreMaterial}".`,
                };
            }

            if (!producto.controla_stock) {
                return {
                    exito: false,
                    mensaje:
                        `El producto "${producto.nombre}" no controla stock y no puede usarse para descuento automático.`,
                };
            }

            if (
                producto.unidad_medida &&
                material.unidadMedida &&
                producto.unidad_medida !==
                material.unidadMedida
            ) {
                return {
                    exito: false,
                    mensaje:
                        `La unidad del material "${material.nombreMaterial}" (${material.unidadMedida}) no coincide con la unidad del producto "${producto.nombre}" (${producto.unidad_medida}).`,
                };
            }
        }
    }

    return {
        exito: true,
        mensaje: "",
    };
}

function obtenerComisionGeneral(datos: DatosServicio) {
    if (
        datos.tipoComisionGeneral === "USAR_TRABAJADOR" ||
        datos.tipoComisionGeneral === "SIN_COMISION"
    ) {
        return 0;
    }

    return datos.comisionGeneral;
}

async function reemplazarRelacionesServicio(
    supabase: Awaited<ReturnType<typeof createClient>>,
    salonId: string,
    servicioId: string,
    datos: DatosServicio,
): Promise<ResultadoAccion> {
    const { error: borrarTrabajadoresError } =
        await supabase
            .from("trabajador_servicios")
            .delete()
            .eq("servicio_id", servicioId)
            .eq("salon_id", salonId);

    if (borrarTrabajadoresError) {
        console.error(
            "Error limpiando trabajadores del servicio:",
            borrarTrabajadoresError,
        );

        return {
            exito: false,
            mensaje:
                "No fue posible actualizar los trabajadores autorizados.",
        };
    }

    const { error: borrarMaterialesError } = await supabase
        .from("servicio_materiales")
        .delete()
        .eq("servicio_id", servicioId)
        .eq("salon_id", salonId);

    if (borrarMaterialesError) {
        console.error(
            "Error limpiando materiales del servicio:",
            borrarMaterialesError,
        );

        return {
            exito: false,
            mensaje: "No fue posible actualizar los materiales.",
        };
    }

    if (datos.trabajadores.length > 0) {
        const filasTrabajadores = datos.trabajadores.map(
            (trabajador) => ({
                salon_id: salonId,
                trabajador_id: trabajador.trabajadorId,
                servicio_id: servicioId,
                usa_comision_especial:
                    trabajador.usaComisionEspecial,
                tipo_comision_especial:
                    trabajador.usaComisionEspecial
                        ? trabajador.tipoComisionEspecial
                        : null,
                comision_especial:
                    trabajador.usaComisionEspecial &&
                        trabajador.tipoComisionEspecial !==
                        "SIN_COMISION"
                        ? trabajador.comisionEspecial
                        : trabajador.usaComisionEspecial
                            ? 0
                            : null,
                estado: "ACTIVO",
                actualizado_en: new Date().toISOString(),
            }),
        );

        const { error } = await supabase
            .from("trabajador_servicios")
            .insert(filasTrabajadores);

        if (error) {
            console.error(
                "Error asignando trabajadores:",
                error,
            );

            return {
                exito: false,
                mensaje:
                    "No fue posible asignar los trabajadores al servicio.",
            };
        }
    }

    if (datos.materiales.length > 0) {
        const filasMateriales = datos.materiales.map(
            (material) => ({
                salon_id: salonId,
                servicio_id: servicioId,
                producto_id:
                    material.descontarInventario
                        ? material.productoId || null
                        : null,
                nombre_material: material.nombreMaterial.trim(),
                cantidad: material.cantidad,
                unidad_medida: material.unidadMedida,
                costo_estimado: material.costoEstimado,
                descontar_inventario:
                    material.descontarInventario,
                observaciones:
                    material.observaciones.trim() || null,
                actualizado_en: new Date().toISOString(),
            }),
        );

        const { error } = await supabase
            .from("servicio_materiales")
            .insert(filasMateriales);

        if (error) {
            console.error("Error asignando materiales:", error);

            return {
                exito: false,
                mensaje:
                    "No fue posible guardar los materiales del servicio.",
            };
        }
    }

    return {
        exito: true,
        mensaje: "",
    };
}

export async function crearCategoriaServicio(
    nombre: string,
    color: string,
): Promise<ResultadoCategoria> {
    try {
        const nombreLimpio = nombre.trim();

        if (nombreLimpio.length < 2) {
            return {
                exito: false,
                mensaje:
                    "El nombre de la categoría debe tener al menos 2 caracteres.",
            };
        }

        const contexto = await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { data: existente } = await supabase
            .from("categorias_servicios")
            .select("id, nombre, color, estado")
            .eq("salon_id", perfil.salon_id)
            .ilike("nombre", nombreLimpio)
            .maybeSingle();

        if (existente) {
            if (existente.estado === "INACTIVA") {
                const { data, error } = await supabase
                    .from("categorias_servicios")
                    .update({
                        estado: "ACTIVA",
                        color: color || existente.color,
                        actualizado_en: new Date().toISOString(),
                    })
                    .eq("id", existente.id)
                    .eq("salon_id", perfil.salon_id)
                    .select("id, nombre, color, estado")
                    .single();

                if (error || !data) {
                    return {
                        exito: false,
                        mensaje: "No fue posible reactivar la categoría.",
                    };
                }

                revalidatePath("/servicios");

                return {
                    exito: true,
                    mensaje: "Categoría reactivada correctamente.",
                    categoria: data,
                };
            }

            return {
                exito: true,
                mensaje: "La categoría ya estaba registrada.",
                categoria: existente,
            };
        }

        const { data, error } = await supabase
            .from("categorias_servicios")
            .insert({
                salon_id: perfil.salon_id,
                nombre: nombreLimpio,
                color: color || "#6F8F83",
                estado: "ACTIVA",
                actualizado_en: new Date().toISOString(),
            })
            .select("id, nombre, color, estado")
            .single();

        if (error || !data) {
            console.error("Error creando categoría:", error);

            return {
                exito: false,
                mensaje: "No fue posible crear la categoría.",
            };
        }

        revalidatePath("/servicios");

        return {
            exito: true,
            mensaje: "Categoría creada correctamente.",
            categoria: data,
        };
    } catch (error) {
        console.error("Error inesperado creando categoría:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al crear la categoría.",
        };
    }
}

export async function crearServicio(
    datos: DatosServicio,
): Promise<ResultadoAccion> {
    try {
        const validacion = validarServicio(datos);

        if (validacion) {
            return validacion;
        }

        const contexto = await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const validacionRelaciones = await validarRelaciones(
            supabase,
            perfil.salon_id,
            datos,
        );

        if (!validacionRelaciones.exito) {
            return validacionRelaciones;
        }

        const { data: servicio, error } = await supabase
            .from("servicios")
            .insert({
                salon_id: perfil.salon_id,
                categoria_id: datos.categoriaId,
                nombre: datos.nombre.trim(),
                descripcion: datos.descripcion.trim() || null,
                precio: datos.precio,
                duracion_minutos: datos.duracionMinutos,
                color: datos.color || "#6F8F83",
                permite_citas: datos.permiteCitas,
                permite_descuento: datos.permiteDescuento,
                requiere_anticipo: datos.requiereAnticipo,
                monto_anticipo: datos.requiereAnticipo
                    ? datos.montoAnticipo
                    : 0,
                tipo_comision_general:
                    datos.tipoComisionGeneral,
                comision_general:
                    obtenerComisionGeneral(datos),
                estado: datos.estado,
                actualizado_en: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (error || !servicio) {
            console.error("Error creando servicio:", error);

            return {
                exito: false,
                mensaje: error
                    ? `No fue posible crear el servicio: ${error.message}`
                    : "No fue posible obtener el servicio creado.",
            };
        }

        const resultadoRelaciones =
            await reemplazarRelacionesServicio(
                supabase,
                perfil.salon_id,
                servicio.id,
                datos,
            );

        if (!resultadoRelaciones.exito) {
            return resultadoRelaciones;
        }

        revalidatePath("/servicios");

        return {
            exito: true,
            mensaje: "Servicio registrado correctamente.",
        };
    } catch (error) {
        console.error("Error inesperado creando servicio:", error);

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al registrar el servicio.",
        };
    }
}

export async function actualizarServicio(
    datos: DatosServicio,
): Promise<ResultadoAccion> {
    try {
        if (!datos.id) {
            return {
                exito: false,
                mensaje: "No se recibió el servicio a actualizar.",
            };
        }

        const validacion = validarServicio(datos);

        if (validacion) {
            return validacion;
        }

        const contexto = await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { data: existente, error: existenteError } =
            await supabase
                .from("servicios")
                .select("id")
                .eq("id", datos.id)
                .eq("salon_id", perfil.salon_id)
                .single();

        if (existenteError || !existente) {
            return {
                exito: false,
                mensaje:
                    "El servicio no existe o no pertenece a tu salón.",
            };
        }

        const validacionRelaciones = await validarRelaciones(
            supabase,
            perfil.salon_id,
            datos,
        );

        if (!validacionRelaciones.exito) {
            return validacionRelaciones;
        }

        const { error } = await supabase
            .from("servicios")
            .update({
                categoria_id: datos.categoriaId,
                nombre: datos.nombre.trim(),
                descripcion: datos.descripcion.trim() || null,
                precio: datos.precio,
                duracion_minutos: datos.duracionMinutos,
                color: datos.color || "#6F8F83",
                permite_citas: datos.permiteCitas,
                permite_descuento: datos.permiteDescuento,
                requiere_anticipo: datos.requiereAnticipo,
                monto_anticipo: datos.requiereAnticipo
                    ? datos.montoAnticipo
                    : 0,
                tipo_comision_general:
                    datos.tipoComisionGeneral,
                comision_general:
                    obtenerComisionGeneral(datos),
                estado: datos.estado,
                actualizado_en: new Date().toISOString(),
            })
            .eq("id", datos.id)
            .eq("salon_id", perfil.salon_id);

        if (error) {
            console.error("Error actualizando servicio:", error);

            return {
                exito: false,
                mensaje: `No fue posible actualizar el servicio: ${error.message}`,
            };
        }

        const resultadoRelaciones =
            await reemplazarRelacionesServicio(
                supabase,
                perfil.salon_id,
                datos.id,
                datos,
            );

        if (!resultadoRelaciones.exito) {
            return resultadoRelaciones;
        }

        revalidatePath("/servicios");

        return {
            exito: true,
            mensaje: "Servicio actualizado correctamente.",
        };
    } catch (error) {
        console.error(
            "Error inesperado actualizando servicio:",
            error,
        );

        return {
            exito: false,
            mensaje:
                "Ocurrió un error inesperado al actualizar el servicio.",
        };
    }
}

export async function cambiarEstadoServicio(
    servicioId: string,
    estado: EstadoServicio,
): Promise<ResultadoAccion> {
    try {
        const contexto = await obtenerContextoAdministrador();

        if (contexto.error || !contexto.perfil) {
            return {
                exito: false,
                mensaje:
                    contexto.error ??
                    "No fue posible verificar los permisos.",
            };
        }

        const { supabase, perfil } = contexto;

        const { error } = await supabase
            .from("servicios")
            .update({
                estado,
                actualizado_en: new Date().toISOString(),
            })
            .eq("id", servicioId)
            .eq("salon_id", perfil.salon_id);

        if (error) {
            return {
                exito: false,
                mensaje: `No fue posible cambiar el estado: ${error.message}`,
            };
        }

        revalidatePath("/servicios");

        return {
            exito: true,
            mensaje:
                estado === "ACTIVO"
                    ? "Servicio activado correctamente."
                    : "Servicio desactivado correctamente.",
        };
    } catch (error) {
        console.error("Error cambiando estado:", error);

        return {
            exito: false,
            mensaje: "Ocurrió un error inesperado.",
        };
    }
}