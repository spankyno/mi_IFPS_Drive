"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción esto podría enviarse a un servicio de logging (Sentry, etc).
    console.error("Error en el dashboard:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <p className="font-medium">Algo se rompió cargando esto</p>
        <p className="text-sm text-muted-foreground">
          Puede ser algo puntual. Intenta de nuevo, o vuelve a intentarlo en unos minutos.
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-muted-foreground/60">Ref: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
