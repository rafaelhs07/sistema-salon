import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ClientePerfilClient, {
    type ArchivoCliente,
    type ClientePerfil,
    type FichaBelleza,
    type FormulaCliente,
    type NotaCliente,
    type TrabajadorSimple,
} from "./ClientePerfilClient";

export default async function ClientePerfilPage({
    params,
}: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { id } = await params;

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

    const [
        resultadoCliente,
        resultadoFicha,
        resultadoFormulas,
        resultadoNotas,
        resultadoArchivos,
        resultadoTrabajadores,
    ] = await Promise.all([
        supabase
            .from("clientes")
            .select(`
        id,
        codigo_cliente,
        nombre_completo,
        telefono,
        whatsapp,
        correo,
        direccion,
        fecha_nacimiento,
        genero,
        contacto_emergencia_nombre,
        contacto_emergencia_telefono,
        como_conocio_salon,
        permite_notificaciones,
        permite_whatsapp,
        permite_correo,
        cliente_frecuente,
        estado,
        observaciones,
        fecha_registro,
        sucursales (
          nombre
        )
      `)
            .eq("id", id)
            .eq("salon_id", perfil.salon_id)
            .single(),

        supabase
            .from("clientes_ficha_belleza")
            .select("*")
            .eq("cliente_id", id)
            .eq("salon_id", perfil.salon_id)
            .maybeSingle(),

        supabase
            .from("clientes_formulas")
            .select(`
        id,
        trabajador_id,
        nombre,
        tipo,
        formula,
        resultado,
        observaciones,
        fecha_aplicacion,
        estado,
        fecha_registro,
        trabajadores (
          nombre_completo
        )
      `)
            .eq("cliente_id", id)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("fecha_registro", {
                ascending: false,
            }),

        supabase
            .from("clientes_notas")
            .select(`
        id,
        titulo,
        nota,
        tipo,
        es_importante,
        fecha_registro
      `)
            .eq("cliente_id", id)
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVA")
            .order("es_importante", {
                ascending: false,
            })
            .order("fecha_registro", {
                ascending: false,
            }),

        supabase
            .from("clientes_archivos")
            .select(`
        id,
        tipo,
        nombre_archivo,
        ruta_archivo,
        descripcion,
        fecha_servicio,
        fecha_registro
      `)
            .eq("cliente_id", id)
            .eq("salon_id", perfil.salon_id)
            .order("fecha_registro", {
                ascending: false,
            }),

        supabase
            .from("trabajadores")
            .select("id, nombre_completo")
            .eq("salon_id", perfil.salon_id)
            .eq("estado", "ACTIVO")
            .order("nombre_completo", {
                ascending: true,
            }),
    ]);

    if (
        resultadoCliente.error ||
        !resultadoCliente.data
    ) {
        notFound();
    }

    const archivosBase =
        (resultadoArchivos.data ?? []) as ArchivoCliente[];

    const archivosConUrl = await Promise.all(
        archivosBase.map(async (archivo) => {
            const { data } = await supabase.storage
                .from("clientes-archivos")
                .createSignedUrl(
                    archivo.ruta_archivo,
                    60 * 60,
                );

            return {
                ...archivo,
                urlFirmada: data?.signedUrl ?? null,
            };
        }),
    );

    return (
        <div className="mx-auto max-w-[1600px]">
            <ClientePerfilClient
                cliente={
                    resultadoCliente.data as unknown as ClientePerfil
                }
                ficha={
                    (resultadoFicha.data ??
                        null) as FichaBelleza | null
                }
                formulas={
                    (resultadoFormulas.data ??
                        []) as unknown as FormulaCliente[]
                }
                notas={
                    (resultadoNotas.data ??
                        []) as NotaCliente[]
                }
                archivos={archivosConUrl}
                trabajadores={
                    (resultadoTrabajadores.data ??
                        []) as TrabajadorSimple[]
                }
                puedeEditarFicha={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "RECEPCION",
                    "TRABAJADOR",
                ].includes(perfil.rol)}
                puedeCrearFormula={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "TRABAJADOR",
                ].includes(perfil.rol)}
                puedeSubirArchivos={[
                    "SUPER_ADMIN",
                    "ADMIN",
                    "RECEPCION",
                    "TRABAJADOR",
                ].includes(perfil.rol)}
            />
        </div>
    );
}