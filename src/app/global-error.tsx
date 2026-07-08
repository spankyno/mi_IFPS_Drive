"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import "./globals.css";

/**
 * global-error.tsx reemplaza el layout raíz entero cuando salta, por eso
 * (y solo aquí) necesita sus propias etiquetas <html>/<body> — a
 * diferencia de error.tsx normal, que se renderiza DENTRO del layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error no controlado (raíz):", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-7" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Algo salió mal</h1>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-muted-foreground/70">Ref: {error.digest}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => reset()}>
              <RotateCcw className="size-4" /> Reintentar
            </Button>
            <Button asChild>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- deliberado: si el error es a nivel raíz, el router de Next puede no ser fiable; un <a> fuerza una recarga completa limpia */}
              <a href="/">
                <Home className="size-4" /> Ir al inicio
              </a>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
