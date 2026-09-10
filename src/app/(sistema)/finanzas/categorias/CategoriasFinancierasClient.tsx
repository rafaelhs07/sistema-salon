"use client";

import Link from "next/link";
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    CheckCircle2,
    CircleDollarSign,
    FolderPlus,
    LoaderCircle,
    LockKeyhole,
    Power,
    PowerOff,
    Tags,
    XCircle,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";

import {
    cambiarEstadoCategoriaFinanciera,
    crearCategoriaFinanciera,
    type TipoCategoriaFinanciera,
} from "./actions";

export type CategoriaFinancieraListado = {
    id: string;
    nombre: string;
    tipo:
    | "INGRESO"
    | "GASTO";
    descripcion:
    | string
    | null;
    sistema: boolean;
    estado:
    | "ACTIVA"
    | "INACTIVA";
    creado_en: string;
};

type Mensaje = {
    tipo:
    | "EXITO"
    | "ERROR";
    texto: string;
} | null;

export default function CategoriasFinancierasClient({
    categorias,
}: {
    categorias: CategoriaFinancieraListado[];
}) {
    const [
        tipo,
        setTipo,
    ] =
        useState<TipoCategoriaFinanciera>(
            "INGRESO",
        );

    const [
        nombre,
        setNombre,
    ] = useState("");

    const [
        descripcion,
        setDescripcion,
    ] = useState("");

    const [
        mensaje,
        setMensaje,
    ] = useState<Mensaje>(
        null,
    );

    const [
        procesando,
        iniciarTransicion,
    ] = useTransition();

    const ingresos =
        useMemo(
            () =>
                categorias.filter(
                    (categoria) =>
                        categoria.tipo ===
                        "INGRESO",
                ),
            [categorias],
        );

    const gastos =
        useMemo(
            () =>
                categorias.filter(
                    (categoria) =>
                        categoria.tipo ===
                        "GASTO",
                ),
            [categorias],
        );

    function crear() {
        if (
            nombre.trim().length <
            2 ||
            procesando
        ) {
            return;
        }

        setMensaje(null);

        iniciarTransicion(
            async () => {
                const resultado =
                    await crearCategoriaFinanciera(
                        {
                            nombre,
                            tipo,
                            descripcion,
                        },
                    );

                if (
                    !resultado.exito
                ) {
                    setMensaje({
                        tipo: "ERROR",
                        texto:
                            resultado.mensaje,
                    });

                    return;
                }

                setNombre("");
                setDescripcion("");

                setMensaje({
                    tipo: "EXITO",
                    texto:
                        resultado.mensaje,
                });

                window.location.reload();
            },
        );
    }

    function cambiarEstado(
        categoria: CategoriaFinancieraListado,
    ) {
        if (
            categoria.sistema ||
            procesando
        ) {
            return;
        }

        const nuevoEstado =
            categoria.estado ===
                "ACTIVA"
                ? "INACTIVA"
                : "ACTIVA";

        setMensaje(null);

        iniciarTransicion(
            async () => {
                const resultado =
                    await cambiarEstadoCategoriaFinanciera(
                        categoria.id,
                        nuevoEstado,
                    );

                if (
                    !resultado.exito
                ) {
                    setMensaje({
                        tipo: "ERROR",
                        texto:
                            resultado.mensaje,
                    });

                    return;
                }

                window.location.reload();
            },
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <section className="salon-hero relative overflow-hidden bg-sidebar p-6 text-white sm:p-8">
                <Link
                    href="/finanzas"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] transition hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Finanzas
                </Link>

                <div className="mt-5 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-sidebar">
                        <Tags className="h-7 w-7" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-[#B9C8C1]">
                            Organización financiera
                        </p>

                        <h1 className="mt-1 text-3xl font-black sm:text-4xl tracking-tight">
                            Categorías
                        </h1>

                        <p className="mt-3 max-w-2xl leading-7 text-[#CFD9D4]">
                            Crea categorías propias para ordenar mejor
                            ingresos y gastos sin modificar las categorías
                            automáticas del sistema.
                        </p>
                    </div>
                </div>
            </section>

            {mensaje && (
                <div
                    className={[
                        "flex items-center gap-3 rounded-2xl border p-4",
                        mensaje.tipo ===
                            "EXITO"
                            ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]"
                            : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]",
                    ].join(" ")}
                >
                    {mensaje.tipo ===
                        "EXITO" ? (
                        <CheckCircle2 className="h-5 w-5" />
                    ) : (
                        <XCircle className="h-5 w-5" />
                    )}

                    <p className="text-sm font-semibold">
                        {mensaje.texto}
                    </p>
                </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <article className="salon-panel border border-border bg-white p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-soft text-[#587064]">
                        <FolderPlus className="h-5 w-5" />
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-sidebar tracking-tight">
                        Nueva categoría
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[#72827A]">
                        Úsala en registros manuales de Finanzas.
                    </p>

                    <div className="mt-5 space-y-4">
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-text-secondary">
                                Tipo
                            </span>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setTipo(
                                            "INGRESO",
                                        )
                                    }
                                    className={[
                                        "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition",
                                        tipo ===
                                            "INGRESO"
                                            ? "border-[#A8C2B6] bg-[#E5F0EB] text-[#456B5B]"
                                            : "border-border bg-white text-text-secondary",
                                    ].join(
                                        " ",
                                    )}
                                >
                                    <ArrowUpRight className="h-4 w-4" />
                                    Ingreso
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setTipo(
                                            "GASTO",
                                        )
                                    }
                                    className={[
                                        "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition",
                                        tipo ===
                                            "GASTO"
                                            ? "border-[#DFC0C7] bg-[#F5E8EB] text-[#986371]"
                                            : "border-border bg-white text-text-secondary",
                                    ].join(
                                        " ",
                                    )}
                                >
                                    <ArrowDownRight className="h-4 w-4" />
                                    Gasto
                                </button>
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-text-secondary">
                                Nombre
                            </span>

                            <input
                                value={nombre}
                                onChange={(event) =>
                                    setNombre(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder={
                                    tipo ===
                                        "INGRESO"
                                        ? "Ej. Alquiler de espacio"
                                        : "Ej. Productos de limpieza"
                                }
                                className="salon-control w-full border border-border bg-[#F9FBFA] px-4 outline-none focus:border-primary focus:bg-white"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-text-secondary">
                                Descripción
                            </span>

                            <textarea
                                rows={4}
                                value={
                                    descripcion
                                }
                                onChange={(event) =>
                                    setDescripcion(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="Opcional"
                                className="salon-control w-full border border-border bg-[#F9FBFA] px-4 py-3 outline-none focus:border-primary focus:bg-white"
                            />
                        </label>

                        <button
                            type="button"
                            onClick={crear}
                            disabled={
                                procesando ||
                                nombre
                                    .trim()
                                    .length < 2
                            }
                            className="salon-action inline-flex w-full items-center justify-center gap-2 bg-sidebar px-5 text-white transition hover:bg-[#34443E] disabled:opacity-50"
                        >
                            {procesando ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <CircleDollarSign className="h-4 w-4" />
                            )}

                            Crear categoría
                        </button>
                    </div>
                </article>

                <div className="grid gap-6 lg:grid-cols-2">
                    <ListaCategorias
                        titulo="Categorías de ingreso"
                        icono={ArrowUpRight}
                        categorias={ingresos}
                        procesando={procesando}
                        cambiarEstado={
                            cambiarEstado
                        }
                    />

                    <ListaCategorias
                        titulo="Categorías de gasto"
                        icono={ArrowDownRight}
                        categorias={gastos}
                        procesando={procesando}
                        cambiarEstado={
                            cambiarEstado
                        }
                    />
                </div>
            </section>
        </div>
    );
}

function ListaCategorias({
    titulo,
    icono: Icono,
    categorias,
    procesando,
    cambiarEstado,
}: {
    titulo: string;
    icono: React.ComponentType<{
        className?: string;
    }>;
    categorias: CategoriaFinancieraListado[];
    procesando: boolean;
    cambiarEstado: (
        categoria: CategoriaFinancieraListado,
    ) => void;
}) {
    return (
        <section className="salon-panel border border-border bg-white p-5">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft text-[#5A7065]">
                    <Icono className="h-5 w-5" />
                </div>

                <div>
                    <h2 className="font-bold text-sidebar tracking-tight">
                        {titulo}
                    </h2>

                    <p className="text-xs text-[#7A8982]">
                        {categorias.length} categorías
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {categorias.map(
                    (categoria) => (
                        <article
                            key={
                                categoria.id
                            }
                            className="rounded-2xl border border-[#E5EBE7] bg-[#FBFCFA] p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-bold text-[#33413B]">
                                            {
                                                categoria.nombre
                                            }
                                        </p>

                                        {categoria.sistema && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E6ECE9] px-2 py-0.5 text-xs font-bold uppercase text-[#607168]">
                                                <LockKeyhole className="h-3 w-3" />
                                                Sistema
                                            </span>
                                        )}

                                        <span
                                            className={[
                                                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                                                categoria.estado ===
                                                    "ACTIVA"
                                                    ? "bg-[#E3EEE8] text-[#4E7463]"
                                                    : "bg-[#F0EEEE] text-[#7D7474]",
                                            ].join(
                                                " ",
                                            )}
                                        >
                                            {
                                                categoria.estado
                                            }
                                        </span>
                                    </div>

                                    {categoria.descripcion && (
                                        <p className="mt-2 text-xs leading-5 text-[#74837C]">
                                            {
                                                categoria.descripcion
                                            }
                                        </p>
                                    )}
                                </div>

                                {!categoria.sistema && (
                                    <button
                                        type="button"
                                        title={
                                            categoria.estado ===
                                                "ACTIVA"
                                                ? "Desactivar"
                                                : "Activar"
                                        }
                                        disabled={
                                            procesando
                                        }
                                        onClick={() =>
                                            cambiarEstado(
                                                categoria,
                                            )
                                        }
                                        className="rounded-xl border border-border bg-white p-2 text-[#66756E] transition hover:bg-surface-soft disabled:opacity-40"
                                    >
                                        {categoria.estado ===
                                            "ACTIVA" ? (
                                            <PowerOff className="h-4 w-4" />
                                        ) : (
                                            <Power className="h-4 w-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </article>
                    ),
                )}
            </div>
        </section>
    );
}