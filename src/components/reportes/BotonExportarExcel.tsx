"use client";

import {
    Download,
    LoaderCircle,
} from "lucide-react";

export default function BotonExportarExcel({
    exportando,
    onClick,
    texto = "Exportar a Excel",
}: {
    exportando: boolean;
    onClick: () => void | Promise<void>;
    texto?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={exportando}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#DCE7E2] px-5 text-sm font-bold text-[#26332F] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
            {exportando ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
                <Download className="h-5 w-5" />
            )}

            {exportando
                ? "Generando Excel..."
                : texto}
        </button>
    );
}
