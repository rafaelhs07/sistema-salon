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
            className="salon-action inline-flex items-center justify-center gap-2 bg-primary-soft px-5 text-sidebar transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
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
