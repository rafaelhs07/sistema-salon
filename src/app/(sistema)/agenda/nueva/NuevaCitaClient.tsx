"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    LoaderCircle,
    MapPin,
    MessageSquareText,
    Plus,
    Search,
    Scissors,
    Trash2,
    UserRound,
    X,
    XCircle,
} from "lucide-react";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearCita, type DatosNuevaCita, type ServicioCitaEntrada } from "./actions";

export type ClienteDisponible = {
    id: string;
    codigo_cliente: string | null;
    nombre_completo: string;
    telefono: string | null;
    whatsapp: string | null;
};

export type SucursalDisponible = {
    id: string;
    nombre: string;
    es_principal: boolean;
};

export type ServicioDisponible = {
    id: string;
    nombre: string;
    precio: number;
    duracion_minutos: number;
    color: string;
    requiere_anticipo: boolean;
    monto_anticipo: number;
    categorias_servicios: { nombre: string } | null;
    trabajador_servicios: { trabajador_id: string; estado: string }[];
};

export type TrabajadorDisponible = {
    id: string;
    nombre_completo: string;
    color_calendario: string;
    permite_citas: boolean;
};

type Mensaje = { tipo: "EXITO" | "ERROR"; texto: string } | null;

export default function NuevaCitaClient({
    clientes,
    sucursales,
    servicios,
    trabajadores,
    sucursalInicialId,
    simboloMoneda,
    horaApertura,
    horaCierre,
}: {
    clientes: ClienteDisponible[];
    sucursales: SucursalDisponible[];
    servicios: ServicioDisponible[];
    trabajadores: TrabajadorDisponible[];
    sucursalInicialId: string;
    simboloMoneda: string;
    horaApertura: string;
    horaCierre: string;
}) {
    const router = useRouter();
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [mostrarClientes, setMostrarClientes] = useState(false);
    const [mensaje, setMensaje] = useState<Mensaje>(null);
    const [guardando, iniciarGuardado] = useTransition();

    const [formulario, setFormulario] = useState<DatosNuevaCita>({
        clienteId: "",
        sucursalId: sucursalInicialId,
        fecha: new Date().toISOString().slice(0, 10),
        horaInicio: horaApertura,
        origen: "SALON",
        notas: "",
        notasInternas: "",
        servicios: [],
    });

    const clienteSeleccionado = clientes.find((cliente) => cliente.id === formulario.clienteId);

    const clientesFiltrados = useMemo(() => {
        const texto = busquedaCliente.trim().toLowerCase();
        return clientes
            .filter((cliente) =>
                !texto ||
                cliente.nombre_completo.toLowerCase().includes(texto) ||
                cliente.codigo_cliente?.toLowerCase().includes(texto) ||
                cliente.telefono?.toLowerCase().includes(texto) ||
                cliente.whatsapp?.toLowerCase().includes(texto),
            )
            .slice(0, 12);
    }, [busquedaCliente, clientes]);

    const resumen = useMemo(() => {
        const subtotal = formulario.servicios.reduce((t, s) => t + s.precio, 0);
        const descuento = formulario.servicios.reduce((t, s) => t + s.descuento, 0);
        const duracion = formulario.servicios.reduce((t, s) => t + s.duracionMinutos, 0);
        return {
            subtotal,
            descuento,
            total: subtotal - descuento,
            duracion,
            horaFin: minutosAHora(horaAMinutos(formulario.horaInicio) + duracion),
        };
    }, [formulario]);

    function actualizar<K extends keyof DatosNuevaCita>(campo: K, valor: DatosNuevaCita[K]) {
        setFormulario((actual) => ({ ...actual, [campo]: valor }));
        setMensaje(null);
    }

    function agregarServicio() {
        actualizar("servicios", [
            ...formulario.servicios,
            { servicioId: "", trabajadorId: "", precio: 0, duracionMinutos: 30, descuento: 0, notas: "" },
        ]);
    }

    function actualizarServicio(indice: number, cambios: Partial<ServicioCitaEntrada>) {
        actualizar(
            "servicios",
            formulario.servicios.map((servicio, i) => (i === indice ? { ...servicio, ...cambios } : servicio)),
        );
    }

    function seleccionarServicio(indice: number, servicioId: string) {
        const servicio = servicios.find((item) => item.id === servicioId);
        if (!servicio) {
            actualizarServicio(indice, { servicioId: "", trabajadorId: "", precio: 0, duracionMinutos: 30 });
            return;
        }

        actualizarServicio(indice, {
            servicioId,
            trabajadorId: "",
            precio: Number(servicio.precio),
            duracionMinutos: servicio.duracion_minutos,
            descuento: 0,
        });
    }

    function trabajadoresPermitidos(servicioId: string) {
        const servicio = servicios.find((item) => item.id === servicioId);
        if (!servicio) return [];
        const ids = new Set(
            servicio.trabajador_servicios
                .filter((relacion) => relacion.estado === "ACTIVO")
                .map((relacion) => relacion.trabajador_id),
        );
        return trabajadores.filter((trabajador) => ids.has(trabajador.id));
    }

    function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        iniciarGuardado(async () => {
            const resultado = await crearCita(formulario);
            if (!resultado.exito) {
                setMensaje({ tipo: "ERROR", texto: resultado.mensaje });
                return;
            }
            router.push("/agenda");
            router.refresh();
        });
    }

    return (
        <div className="space-y-6">
            <section className="rounded-3xl bg-[#26332F] p-6 text-white shadow-[0_18px_50px_rgba(36,48,44,0.16)] sm:p-8">
                <Link href="/agenda" className="inline-flex items-center gap-2 text-sm font-semibold text-[#C7D4CE] hover:text-white">
                    <ArrowLeft className="h-4 w-4" /> Volver a la agenda
                </Link>

                <div className="mt-6 flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCE7E2] text-[#26332F]">
                        <CalendarDays className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#B9C8C1]">Reservación</p>
                        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Nueva cita</h1>
                        <p className="mt-3 text-[#CFD9D4]">Agrega servicios en el orden en que serán realizados.</p>
                    </div>
                </div>
            </section>

            {mensaje && <MensajeEstado mensaje={mensaje} cerrar={() => setMensaje(null)} />}

            <form onSubmit={enviar}>
                <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                    <div className="space-y-6">
                        <Seccion titulo="Cliente" icono={UserRound}>
                            <div className="relative">
                                <label className="mb-2 block text-sm font-semibold text-[#3D4A45]">Buscar cliente</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#829089]" />
                                    <input
                                        value={busquedaCliente}
                                        onFocus={() => setMostrarClientes(true)}
                                        onChange={(event) => {
                                            setBusquedaCliente(event.target.value);
                                            actualizar("clienteId", "");
                                            setMostrarClientes(true);
                                        }}
                                        placeholder="Nombre, teléfono o código..."
                                        className="h-12 w-full rounded-xl border border-[#D4DAD6] bg-white pl-12 pr-4 outline-none focus:border-[#6F8F83]"
                                    />
                                </div>

                                {mostrarClientes && (
                                    <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-72 overflow-y-auto rounded-2xl border border-[#DCE3DF] bg-white p-2 shadow-[0_18px_45px_rgba(36,48,44,0.20)]">
                                        {clientesFiltrados.length === 0 ? (
                                            <p className="p-4 text-sm text-[#6B756F]">
                                                No encontramos clientes.
                                            </p>
                                        ) : clientesFiltrados.map((cliente) => (
                                            <button
                                                key={cliente.id}
                                                type="button"
                                                onClick={() => {
                                                    actualizar("clienteId", cliente.id);
                                                    setBusquedaCliente(cliente.nombre_completo);
                                                    setMostrarClientes(false);
                                                }}
                                                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[#EEF2EF]"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DCE7E2] text-sm font-bold text-[#43524B]">
                                                    {obtenerIniciales(cliente.nombre_completo)}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold text-[#33413B]">
                                                        {cliente.nombre_completo}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-[#76817B]">
                                                        {cliente.codigo_cliente ?? "Sin código"} · {cliente.telefono || cliente.whatsapp || "Sin número"}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {clienteSeleccionado && (
                                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#C8D9D1] bg-[#F0F5F2] p-4">
                                    <CheckCircle2 className="h-5 w-5 text-[#5E7D71]" />
                                    <p className="font-semibold text-[#33413B]">{clienteSeleccionado.nombre_completo}</p>
                                </div>
                            )}
                        </Seccion>

                        <Seccion titulo="Fecha y ubicación" icono={MapPin}>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <CampoSelect
                                    etiqueta="Sucursal"
                                    valor={formulario.sucursalId}
                                    opciones={sucursales.map((s) => ({ valor: s.id, texto: s.nombre }))}
                                    cambiar={(valor) => actualizar("sucursalId", valor)}
                                />
                                <CampoFecha etiqueta="Fecha" valor={formulario.fecha} cambiar={(valor) => actualizar("fecha", valor)} />
                                <CampoHora
                                    etiqueta="Hora inicial"
                                    valor={formulario.horaInicio}
                                    minimo={horaApertura}
                                    maximo={horaCierre}
                                    cambiar={(valor) => actualizar("horaInicio", valor)}
                                />
                                <CampoSelect
                                    etiqueta="Origen"
                                    valor={formulario.origen}
                                    opciones={[
                                        { valor: "SALON", texto: "En el salón" },
                                        { valor: "TELEFONO", texto: "Teléfono" },
                                        { valor: "WHATSAPP", texto: "WhatsApp" },
                                        { valor: "REDES_SOCIALES", texto: "Redes sociales" },
                                        { valor: "WEB", texto: "Página web" },
                                        { valor: "OTRO", texto: "Otro" },
                                    ]}
                                    cambiar={(valor) => actualizar("origen", valor as DatosNuevaCita["origen"])}
                                />
                            </div>
                        </Seccion>

                        <Seccion titulo="Servicios" icono={Scissors}>
                            <div className="flex justify-end">
                                <button type="button" onClick={agregarServicio} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#DCE7E2] px-4 text-sm font-bold text-[#43524B]">
                                    <Plus className="h-4 w-4" /> Agregar servicio
                                </button>
                            </div>

                            <div className="mt-4 space-y-4">
                                {formulario.servicios.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-[#D4DAD6] bg-[#FBFCFA] p-8 text-center text-sm text-[#6B756F]">
                                        Todavía no hay servicios agregados.
                                    </div>
                                )}

                                {formulario.servicios.map((entrada, indice) => {
                                    const inicio = calcularHoraInicioServicio(formulario.horaInicio, formulario.servicios, indice);
                                    const fin = minutosAHora(horaAMinutos(inicio) + entrada.duracionMinutos);
                                    return (
                                        <article key={indice} className="rounded-2xl border border-[#E3E7E4] bg-[#FBFCFA] p-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-[#24302C]">Servicio {indice + 1}</p>
                                                    <p className="mt-1 text-xs font-semibold text-[#6F8F83]">{formatearHora(inicio)} – {formatearHora(fin)}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => actualizar("servicios", formulario.servicios.filter((_, i) => i !== indice))}
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8E5E5] text-[#A25E5E]"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                <CampoSelect
                                                    etiqueta="Servicio"
                                                    valor={entrada.servicioId}
                                                    opciones={[
                                                        { valor: "", texto: "Seleccionar servicio" },
                                                        ...servicios.map((servicio) => ({
                                                            valor: servicio.id,
                                                            texto: `${servicio.nombre} · ${simboloMoneda} ${Number(servicio.precio).toLocaleString("es-NI")}`,
                                                        })),
                                                    ]}
                                                    cambiar={(valor) => seleccionarServicio(indice, valor)}
                                                />

                                                <CampoSelect
                                                    etiqueta="Trabajador"
                                                    valor={entrada.trabajadorId}
                                                    opciones={[
                                                        { valor: "", texto: entrada.servicioId ? "Seleccionar trabajador" : "Primero selecciona un servicio" },
                                                        ...trabajadoresPermitidos(entrada.servicioId).map((trabajador) => ({
                                                            valor: trabajador.id,
                                                            texto: trabajador.nombre_completo,
                                                        })),
                                                    ]}
                                                    cambiar={(valor) => actualizarServicio(indice, { trabajadorId: valor })}
                                                />

                                                <CampoNumero etiqueta="Precio" valor={entrada.precio} simbolo={simboloMoneda} minimo={0} paso={0.01} cambiar={(valor) => actualizarServicio(indice, { precio: valor })} />
                                                <CampoNumero etiqueta="Descuento" valor={entrada.descuento} simbolo={simboloMoneda} minimo={0} maximo={entrada.precio} paso={0.01} cambiar={(valor) => actualizarServicio(indice, { descuento: valor })} />
                                                <CampoNumero etiqueta="Duración" valor={entrada.duracionMinutos} simbolo="min" minimo={5} maximo={1440} paso={5} cambiar={(valor) => actualizarServicio(indice, { duracionMinutos: valor })} />
                                                <CampoTexto etiqueta="Nota del servicio" valor={entrada.notas} cambiar={(valor) => actualizarServicio(indice, { notas: valor })} />
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </Seccion>

                        <Seccion titulo="Notas" icono={MessageSquareText}>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <CampoArea etiqueta="Nota para el cliente" valor={formulario.notas} cambiar={(valor) => actualizar("notas", valor)} />
                                <CampoArea etiqueta="Nota interna" valor={formulario.notasInternas} cambiar={(valor) => actualizar("notasInternas", valor)} />
                            </div>
                        </Seccion>
                    </div>

                    <aside className="xl:sticky xl:top-6 xl:self-start">
                        <div className="rounded-3xl border border-[#E3E7E4] bg-white p-6 shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
                            <h2 className="text-xl font-bold text-[#24302C]">Resumen</h2>
                            <div className="mt-5 space-y-4">
                                <ResumenDato titulo="Fecha" valor={formulario.fecha ? formatearFecha(formulario.fecha) : "Sin fecha"} />
                                <ResumenDato titulo="Horario" valor={`${formatearHora(formulario.horaInicio)} – ${formatearHora(resumen.horaFin)}`} />
                                <ResumenDato titulo="Duración" valor={formatearDuracion(resumen.duracion)} />
                                <ResumenDato titulo="Servicios" valor={String(formulario.servicios.length)} />
                            </div>

                            <div className="my-5 border-t border-[#E3E7E4]" />
                            <FilaDinero titulo="Subtotal" valor={resumen.subtotal} simbolo={simboloMoneda} />
                            <FilaDinero titulo="Descuento" valor={resumen.descuento} simbolo={simboloMoneda} />
                            <FilaDinero titulo="Total" valor={resumen.total} simbolo={simboloMoneda} destacado />

                            <button
                                type="submit"
                                disabled={guardando}
                                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6F8F83] px-5 font-bold text-white disabled:bg-[#AAB9B3]"
                            >
                                {guardando ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                {guardando ? "Validando..." : "Crear cita"}
                            </button>
                        </div>
                    </aside>
                </div>
            </form>
        </div>
    );
}

function Seccion({ titulo, icono: Icono, children }: { titulo: string; icono: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
    return (
        <section className="relative overflow-visible rounded-3xl border border-[#E3E7E4] bg-white shadow-[0_8px_24px_rgba(36,48,44,0.05)]">
            <header className="flex items-center gap-3 border-b border-[#E8ECE9] bg-[#FBFCFA] px-5 py-4 sm:px-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCE7E2] text-[#527064]"><Icono className="h-5 w-5" /></div>
                <h2 className="font-bold text-[#24302C]">{titulo}</h2>
            </header>
            <div className="p-5 sm:p-6">{children}</div>
        </section>
    );
}

function CampoSelect({ etiqueta, valor, opciones, cambiar }: { etiqueta: string; valor: string; opciones: { valor: string; texto: string }[]; cambiar: (valor: string) => void }) {
    return <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3D4A45]">{etiqueta}</span><select value={valor} required onChange={(e) => cambiar(e.target.value)} className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 outline-none focus:border-[#6F8F83]">{opciones.map((opcion) => <option key={`${opcion.valor}-${opcion.texto}`} value={opcion.valor}>{opcion.texto}</option>)}</select></label>;
}

function CampoFecha({ etiqueta, valor, cambiar }: { etiqueta: string; valor: string; cambiar: (valor: string) => void }) {
    return <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3D4A45]">{etiqueta}</span><input type="date" value={valor} required onChange={(e) => cambiar(e.target.value)} className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4" /></label>;
}

function CampoHora({
    etiqueta,
    valor,
    minimo,
    maximo,
    cambiar,
}: {
    etiqueta: string;
    valor: string;
    minimo: string;
    maximo: string;
    cambiar: (valor: string) => void;
}) {
    const partes = hora24APartes12(valor);
    const horasPermitidas = Array.from({ length: 12 }, (_, indice) => indice + 1);
    const minutosPermitidos = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

    function actualizarHora(cambios: Partial<{ hora: number; minuto: string; periodo: "AM" | "PM" }>) {
        const siguiente = {
            ...partes,
            ...cambios,
        };

        const hora24 = partes12AHora24(
            siguiente.hora,
            siguiente.minuto,
            siguiente.periodo,
        );

        if (horaAMinutos(hora24) < horaAMinutos(minimo)) {
            cambiar(minimo.slice(0, 5));
            return;
        }

        if (horaAMinutos(hora24) > horaAMinutos(maximo)) {
            cambiar(maximo.slice(0, 5));
            return;
        }

        cambiar(hora24);
    }

    return (
        <div className="block">
            <span className="mb-2 block text-sm font-semibold text-[#3D4A45]">
                {etiqueta}
            </span>

            <div className="grid grid-cols-[1fr_1fr_0.9fr] gap-2">
                <select
                    value={partes.hora}
                    onChange={(event) =>
                        actualizarHora({ hora: Number(event.target.value) })
                    }
                    className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 outline-none focus:border-[#6F8F83]"
                    aria-label="Hora"
                >
                    {horasPermitidas.map((hora) => (
                        <option key={hora} value={hora}>
                            {hora}
                        </option>
                    ))}
                </select>

                <select
                    value={partes.minuto}
                    onChange={(event) =>
                        actualizarHora({ minuto: event.target.value })
                    }
                    className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 outline-none focus:border-[#6F8F83]"
                    aria-label="Minutos"
                >
                    {minutosPermitidos.map((minuto) => (
                        <option key={minuto} value={minuto}>
                            :{minuto}
                        </option>
                    ))}
                </select>

                <select
                    value={partes.periodo}
                    onChange={(event) =>
                        actualizarHora({
                            periodo: event.target.value as "AM" | "PM",
                        })
                    }
                    className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-3 font-semibold outline-none focus:border-[#6F8F83]"
                    aria-label="AM o PM"
                >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                </select>
            </div>

            <p className="mt-2 text-xs text-[#76817B]">
                Horario permitido: {formatearHora(minimo)} – {formatearHora(maximo)}
            </p>
        </div>
    );
}

function CampoNumero({ etiqueta, valor, simbolo, minimo, maximo, paso, cambiar }: { etiqueta: string; valor: number; simbolo: string; minimo: number; maximo?: number; paso: number; cambiar: (valor: number) => void }) {
    return <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3D4A45]">{etiqueta}</span><div className="relative"><input type="number" value={valor} min={minimo} max={maximo} step={paso} onChange={(e) => cambiar(Number(e.target.value))} className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4 pr-16" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#76817B]">{simbolo}</span></div></label>;
}

function CampoTexto({ etiqueta, valor, cambiar }: { etiqueta: string; valor: string; cambiar: (valor: string) => void }) {
    return <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3D4A45]">{etiqueta}</span><input value={valor} onChange={(e) => cambiar(e.target.value)} className="h-11 w-full rounded-xl border border-[#D4DAD6] bg-white px-4" /></label>;
}

function CampoArea({ etiqueta, valor, cambiar }: { etiqueta: string; valor: string; cambiar: (valor: string) => void }) {
    return <label className="block"><span className="mb-2 block text-sm font-semibold text-[#3D4A45]">{etiqueta}</span><textarea rows={4} value={valor} onChange={(e) => cambiar(e.target.value)} className="w-full rounded-xl border border-[#D4DAD6] bg-white px-4 py-3" /></label>;
}

function ResumenDato({ titulo, valor }: { titulo: string; valor: string }) {
    return <div className="flex items-center justify-between gap-4"><span className="text-sm text-[#6B756F]">{titulo}</span><strong className="text-right text-sm text-[#33413B]">{valor}</strong></div>;
}

function FilaDinero({ titulo, valor, simbolo, destacado = false }: { titulo: string; valor: number; simbolo: string; destacado?: boolean }) {
    return <div className="mt-3 flex items-center justify-between"><span className={destacado ? "font-bold text-[#24302C]" : "text-sm text-[#6B756F]"}>{titulo}</span><strong className={destacado ? "text-xl text-[#24302C]" : "text-sm text-[#33413B]"}>{simbolo} {valor.toLocaleString("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>;
}

function MensajeEstado({ mensaje, cerrar }: { mensaje: Exclude<Mensaje, null>; cerrar: () => void }) {
    return <div className={["flex items-start gap-3 rounded-2xl border px-4 py-4", mensaje.tipo === "EXITO" ? "border-[#CFE0D8] bg-[#E3EEE8] text-[#3F6657]" : "border-[#EBCBCB] bg-[#F8E5E5] text-[#985858]"].join(" ")}>{mensaje.tipo === "EXITO" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}<p className="flex-1 text-sm font-semibold">{mensaje.texto}</p><button type="button" onClick={cerrar}><X className="h-5 w-5" /></button></div>;
}

function obtenerIniciales(nombre: string) {
    return nombre
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join("");
}

function calcularHoraInicioServicio(horaInicial: string, servicios: ServicioCitaEntrada[], indice: number) {
    return minutosAHora(horaAMinutos(horaInicial) + servicios.slice(0, indice).reduce((total, servicio) => total + servicio.duracionMinutos, 0));
}

function horaAMinutos(hora: string) {
    const [h, m] = hora.slice(0, 5).split(":").map(Number);
    return h * 60 + m;
}

function minutosAHora(total: number) {
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function hora24APartes12(hora: string) {
    const [hora24, minuto = "00"] = hora.slice(0, 5).split(":");
    const numeroHora = Number(hora24);
    const periodo: "AM" | "PM" = numeroHora >= 12 ? "PM" : "AM";
    const hora12 = numeroHora % 12 || 12;

    return {
        hora: hora12,
        minuto,
        periodo,
    };
}

function partes12AHora24(
    hora: number,
    minuto: string,
    periodo: "AM" | "PM",
) {
    let hora24 = hora % 12;

    if (periodo === "PM") {
        hora24 += 12;
    }

    return `${String(hora24).padStart(2, "0")}:${minuto}`;
}

function formatearHora(hora: string) {
    const [hora24, minuto = "00"] = hora.slice(0, 5).split(":").map(Number);
    const periodo = hora24 >= 12 ? "p. m." : "a. m.";
    const hora12 = hora24 % 12 || 12;

    return `${hora12}:${String(minuto).padStart(2, "0")} ${periodo}`;
}

function formatearDuracion(minutos: number) {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

function formatearFecha(fecha: string) {
    return new Intl.DateTimeFormat("es-NI", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${fecha}T00:00:00`));
}