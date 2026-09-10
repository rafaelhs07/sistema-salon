"use client";

import {
    Check,
    ChevronRight,
    LoaderCircle,
    Palette,
    RotateCcw,
    Sparkles,
    X,
} from "lucide-react";
import {
    useMemo,
    useState,
    useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
    guardarTemaSistema,
    type TemaColorSistema,
} from "./tema-actions";

type TemaVisual = {
    id: TemaColorSistema;
    nombre: string;
    descripcion: string;
    sidebar: string;
    principal: string;
    suave: string;
    secundario: string;
};

const TEMAS: TemaVisual[] = [
    {
        id: "SALVIA",
        nombre: "Salvia",
        descripcion: "Natural y sereno",
        sidebar: "#26332F",
        principal: "#6F8F83",
        suave: "#DCE7E2",
        secundario: "#C79AA1",
    },
    {
        id: "AZUL",
        nombre: "Azul niebla",
        descripcion: "Profesional y fresco",
        sidebar: "#243642",
        principal: "#66899B",
        suave: "#DDEAF0",
        secundario: "#A38FA6",
    },
    {
        id: "LILA",
        nombre: "Lila",
        descripcion: "Elegante y delicado",
        sidebar: "#382F44",
        principal: "#82709A",
        suave: "#E9E2F0",
        secundario: "#C597A8",
    },
    {
        id: "ROSA",
        nombre: "Rosa",
        descripcion: "Suave y moderno",
        sidebar: "#433138",
        principal: "#A77184",
        suave: "#F0DFE5",
        secundario: "#C4939D",
    },
    {
        id: "TERRACOTA",
        nombre: "Terracota",
        descripcion: "Cálido y con carácter",
        sidebar: "#49372F",
        principal: "#A56F59",
        suave: "#F0E1D9",
        secundario: "#B88991",
    },
    {
        id: "GRAFITO",
        nombre: "Grafito",
        descripcion: "Sobrio y minimalista",
        sidebar: "#292B2C",
        principal: "#6E7472",
        suave: "#E3E6E5",
        secundario: "#9A8C91",
    },
    {
        id: "ESMERALDA",
        nombre: "Esmeralda",
        descripcion: "Vibrante y elegante",
        sidebar: "#173A34",
        principal: "#2F8A72",
        suave: "#D8EFE8",
        secundario: "#D0A27B",
    },
    {
        id: "OLIVA",
        nombre: "Oliva",
        descripcion: "Orgánico y sofisticado",
        sidebar: "#34382A",
        principal: "#7A835B",
        suave: "#E8EAD9",
        secundario: "#B88D75",
    },
    {
        id: "ARENA",
        nombre: "Arena",
        descripcion: "Neutro, limpio y cálido",
        sidebar: "#403A34",
        principal: "#A48C73",
        suave: "#EFE8DF",
        secundario: "#B9978A",
    },
    {
        id: "VINO",
        nombre: "Vino",
        descripcion: "Profundo y distinguido",
        sidebar: "#412A30",
        principal: "#8B5361",
        suave: "#EEDFE3",
        secundario: "#B98B78",
    },
    {
        id: "LAVANDA",
        nombre: "Lavanda",
        descripcion: "Suave y relajante",
        sidebar: "#3D3548",
        principal: "#8B78A5",
        suave: "#ECE6F2",
        secundario: "#C78E9E",
    },
    {
        id: "CELESTE",
        nombre: "Celeste",
        descripcion: "Ligero y contemporáneo",
        sidebar: "#263A43",
        principal: "#6C98A8",
        suave: "#DFEEF2",
        secundario: "#B4939A",
    }
];

export default function TemaSistemaClient({
    temaInicial,
}: {
    temaInicial: TemaColorSistema;
}) {
    const router = useRouter();

    const [abierto, setAbierto] =
        useState(false);

    const [
        temaSeleccionado,
        setTemaSeleccionado,
    ] =
        useState<TemaColorSistema>(
            temaInicial,
        );

    const [
        temaGuardado,
        setTemaGuardado,
    ] =
        useState<TemaColorSistema>(
            temaInicial,
        );

    const [mensaje, setMensaje] =
        useState("");

    const [
        guardando,
        iniciarGuardado,
    ] =
        useTransition();

    const temaActual =
        useMemo(
            () =>
                TEMAS.find(
                    (tema) =>
                        tema.id ===
                        temaSeleccionado,
                ) ?? TEMAS[0],
            [temaSeleccionado],
        );

    const temaPersistido =
        TEMAS.find(
            (tema) =>
                tema.id === temaGuardado,
        ) ?? TEMAS[0];

    const hayCambio =
        temaSeleccionado !== temaGuardado;

    function cerrar() {
        setTemaSeleccionado(
            temaGuardado,
        );
        setMensaje("");
        setAbierto(false);
    }

    function guardar() {
        if (!hayCambio) {
            setAbierto(false);
            return;
        }

        setMensaje("");

        iniciarGuardado(
            async () => {
                const resultado =
                    await guardarTemaSistema(
                        temaSeleccionado,
                    );

                setMensaje(
                    resultado.mensaje,
                );

                if (resultado.exito) {
                    setTemaGuardado(
                        temaSeleccionado,
                    );
                    setAbierto(false);
                    router.refresh();
                }
            },
        );
    }

    return (
        <>
            <section className="overflow-hidden rounded-[28px] border border-[#E0E6E2] bg-white shadow-[0_10px_28px_rgba(36,48,44,0.05)]">
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-start gap-4">
                        <div
                            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border border-black/5"
                            style={{
                                backgroundColor:
                                    temaPersistido.suave,
                                color:
                                    temaPersistido.sidebar,
                            }}
                        >
                            <Palette className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#87958D]">
                                Apariencia
                            </p>

                            <h2 className="mt-1 text-lg font-black text-[#26332F]">
                                Apariencia del sistema
                            </h2>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-[#6F7D76]">
                                    Tema actual:
                                </span>

                                <span className="rounded-full border border-[#DDE5E1] bg-[#F8FAF8] px-3 py-1 text-xs font-black text-[#3F4D47]">
                                    {temaPersistido.nombre}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-1.5 sm:flex">
                            {[
                                temaPersistido.sidebar,
                                temaPersistido.principal,
                                temaPersistido.suave,
                                temaPersistido.secundario,
                            ].map((color, indice) => (
                                <span
                                    key={`${color}-${indice}`}
                                    className="h-8 w-8 rounded-xl border border-black/5"
                                    style={{
                                        backgroundColor:
                                            color,
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setAbierto(true)
                            }
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#26332F] px-5 text-sm font-black text-white transition hover:bg-[#34463F]"
                        >
                            <Palette className="h-4 w-4" />
                            Cambiar apariencia
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </section>

            {abierto && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            cerrar();
                        }
                    }}
                >
                    <section className="max-h-[92vh] w-full overflow-hidden rounded-t-[30px] bg-[#F6F7F4] shadow-2xl sm:max-w-5xl sm:rounded-[30px]">
                        <header className="flex items-start justify-between gap-4 border-b border-[#E2E8E4] bg-white px-5 py-5 sm:px-6">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#527064]">
                                    <Sparkles className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#87958D]">
                                        Personalización
                                    </p>

                                    <h3 className="mt-1 text-xl font-black text-[#26332F]">
                                        Elige una apariencia
                                    </h3>

                                    <p className="mt-1 text-sm text-[#738078]">
                                        Selecciona una paleta y revisa la vista previa antes de aplicarla.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={cerrar}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#E0E6E2] bg-[#F8FAF8] text-[#65736C]"
                                aria-label="Cerrar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="max-h-[calc(92vh-160px)] overflow-y-auto">
                            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px] sm:p-6">
                                <div>
                                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#87958D]">
                                        Temas disponibles
                                    </p>

                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {TEMAS.map((tema) => {
                                            const activo =
                                                temaSeleccionado ===
                                                tema.id;

                                            return (
                                                <button
                                                    key={tema.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setTemaSeleccionado(
                                                            tema.id,
                                                        );
                                                        setMensaje("");
                                                    }}
                                                    className={[
                                                        "relative rounded-[22px] border p-4 text-left transition",
                                                        activo
                                                            ? "border-[#8FA99D] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.09)] ring-2 ring-[#6F8F83]/10"
                                                            : "border-[#E0E6E2] bg-white/70 hover:-translate-y-0.5 hover:border-[#BCCBC4] hover:bg-white",
                                                    ].join(" ")}
                                                >
                                                    {activo && (
                                                        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#26332F] text-white">
                                                            <Check className="h-4 w-4" />
                                                        </span>
                                                    )}

                                                    <div className="flex gap-2">
                                                        {[
                                                            tema.sidebar,
                                                            tema.principal,
                                                            tema.suave,
                                                            tema.secundario,
                                                        ].map((color, indice) => (
                                                            <span
                                                                key={`${tema.id}-${indice}`}
                                                                className="h-9 flex-1 rounded-xl border border-black/5"
                                                                style={{
                                                                    backgroundColor:
                                                                        color,
                                                                }}
                                                            />
                                                        ))}
                                                    </div>

                                                    <p className="mt-4 font-black text-[#2F3C36]">
                                                        {tema.nombre}
                                                    </p>

                                                    <p className="mt-1 text-xs leading-5 text-[#7A8781]">
                                                        {tema.descripcion}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <aside className="lg:sticky lg:top-0 lg:self-start">
                                    <div className="overflow-hidden rounded-[26px] border border-[#DCE4DF] bg-white shadow-[0_10px_30px_rgba(36,48,44,0.07)]">
                                        <div
                                            className="p-5 text-white"
                                            style={{
                                                backgroundColor:
                                                    temaActual.sidebar,
                                            }}
                                        >
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/65">
                                                Vista previa
                                            </p>

                                            <h4 className="mt-2 text-xl font-black">
                                                {temaActual.nombre}
                                            </h4>

                                            <p className="mt-1 text-xs text-white/70">
                                                Así se verá la identidad principal del sistema.
                                            </p>
                                        </div>

                                        <div className="space-y-3 p-5">
                                            <div
                                                className="rounded-2xl p-4"
                                                style={{
                                                    backgroundColor:
                                                        temaActual.suave,
                                                }}
                                            >
                                                <p
                                                    className="text-sm font-black"
                                                    style={{
                                                        color:
                                                            temaActual.sidebar,
                                                    }}
                                                >
                                                    Tarjeta destacada
                                                </p>

                                                <p className="mt-1 text-xs text-[#6F7D76]">
                                                    Información secundaria del módulo.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="h-11 w-full rounded-2xl text-sm font-black text-white"
                                                style={{
                                                    backgroundColor:
                                                        temaActual.principal,
                                                }}
                                            >
                                                Botón principal
                                            </button>

                                            <button
                                                type="button"
                                                className="h-11 w-full rounded-2xl text-sm font-black text-white"
                                                style={{
                                                    backgroundColor:
                                                        temaActual.secundario,
                                                }}
                                            >
                                                Acción secundaria
                                            </button>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </div>

                        <footer className="flex flex-col gap-3 border-t border-[#E2E8E4] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div>
                                <p className="text-sm font-black text-[#34423C]">
                                    {hayCambio
                                        ? `Seleccionado: ${temaActual.nombre}`
                                        : `Tema actual: ${temaPersistido.nombre}`}
                                </p>

                                <p className="mt-0.5 text-xs text-[#7B8781]">
                                    El cambio se aplicará a todos los usuarios del salón.
                                </p>

                                {mensaje && (
                                    <p className="mt-1 text-xs font-bold text-[#9A6267]">
                                        {mensaje}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {hayCambio && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setTemaSeleccionado(
                                                temaGuardado,
                                            )
                                        }
                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCE3DF] bg-[#F8FAF8] px-4 text-sm font-black text-[#56645D]"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Restablecer
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={guardando}
                                    onClick={guardar}
                                    className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-2xl bg-[#26332F] px-5 text-sm font-black text-white transition hover:bg-[#34463F] disabled:opacity-50"
                                >
                                    {guardando ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}

                                    {guardando
                                        ? "Aplicando..."
                                        : "Aplicar tema"}
                                </button>
                            </div>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
}
