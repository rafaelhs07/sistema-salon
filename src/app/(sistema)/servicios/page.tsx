import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ServiciosClient, {
    type CategoriaServicioListado,
    type ProductoInventarioDisponible,
    type ServicioListado,
    type TrabajadorDisponible,
} from "./ServiciosClient";

type ConfiguracionMoneda = {
    simbolo_moneda: string;
};

export default async function ServiciosPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
        redirect("/login");
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
        redirect("/login");
    }

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
            "RECEPCION",
        ].includes(perfil.rol)
    ) {
        redirect("/inicio");
    }

    const puedeAdministrar = [
        "SUPER_ADMIN",
        "ADMIN",
    ].includes(perfil.rol);

    const [
        resultadoServicios,
        resultadoCategorias,
        resultadoTrabajadores,
        resultadoProductos,
        resultadoConfiguracion,
    ] = await Promise.all([
        supabase
            .from("servicios")
            .select(`
                id,
                categoria_id,
                nombre,
                descripcion,
                precio,
                duracion_minutos,
                color,
                permite_citas,
                permite_descuento,
                requiere_anticipo,
                monto_anticipo,
                tipo_comision_general,
                comision_general,
                estado,
                categorias_servicios (
                    id,
                    nombre,
                    color
                ),
                trabajador_servicios (
                    trabajador_id,
                    usa_comision_especial,
                    tipo_comision_especial,
                    comision_especial,
                    estado,
                    trabajadores (
                        id,
                        nombre_completo,
                        color_calendario
                    )
                ),
                servicio_materiales (
                    id,
                    producto_id,
                    nombre_material,
                    cantidad,
                    unidad_medida,
                    costo_estimado,
                    descontar_inventario,
                    observaciones
                )
            `)
            .eq("salon_id", perfil.salon_id)
            .order("estado", {
                ascending: true,
            })
            .order("nombre", {
                ascending: true,
            }),

        supabase
            .from("categorias_servicios")
            .select(`
                id,
                nombre,
                descripcion,
                color,
                estado,
                orden
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("orden", {
                ascending: true,
            })
            .order("nombre", {
                ascending: true,
            }),

        supabase
            .from("trabajadores")
            .select(`
                id,
                nombre_completo,
                color_calendario,
                modalidad_pago,
                tipo_comision,
                comision_general,
                estado,
                permite_citas
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre_completo", {
                ascending: true,
            }),

        supabase
            .from("productos")
            .select(`
                id,
                codigo_producto,
                codigo_barras,
                nombre,
                marca,
                presentacion,
                unidad_medida,
                controla_stock,
                permite_consumo_servicio,
                estado
            `)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .eq("permite_consumo_servicio", true)
            .eq("controla_stock", true)
            .order("nombre", {
                ascending: true,
            }),

        supabase
            .from("configuracion_salon")
            .select("simbolo_moneda")
            .eq("salon_id", perfil.salon_id)
            .single(),
    ]);

    if (resultadoServicios.error) {
        console.error(
            "Error cargando servicios:",
            resultadoServicios.error,
        );
    }

    if (resultadoCategorias.error) {
        console.error(
            "Error cargando categorías:",
            resultadoCategorias.error,
        );
    }

    if (resultadoTrabajadores.error) {
        console.error(
            "Error cargando trabajadores:",
            resultadoTrabajadores.error,
        );
    }

    if (resultadoProductos.error) {
        console.error(
            "Error cargando productos para materiales:",
            resultadoProductos.error,
        );
    }

    const configuracion =
        resultadoConfiguracion.data as
        | ConfiguracionMoneda
        | null;

    return (
        <div className="mx-auto max-w-[1600px]">
            <ServiciosClient
                serviciosIniciales={
                    (resultadoServicios.data ??
                        []) as unknown as ServicioListado[]
                }
                categoriasIniciales={
                    (resultadoCategorias.data ??
                        []) as CategoriaServicioListado[]
                }
                trabajadoresDisponibles={
                    (resultadoTrabajadores.data ??
                        []) as TrabajadorDisponible[]
                }
                productosDisponibles={
                    (resultadoProductos.data ??
                        []) as ProductoInventarioDisponible[]
                }
                simboloMoneda={
                    configuracion?.simbolo_moneda ??
                    "C$"
                }
                puedeAdministrar={
                    puedeAdministrar
                }
            />
        </div>
    );
}