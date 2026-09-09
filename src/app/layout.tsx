import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Sistema Salón de Belleza",
    description:
        "Sistema administrativo para salones de belleza",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}