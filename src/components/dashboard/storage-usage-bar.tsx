"use client";

import { useMyLimits } from "@/hooks/use-my-limits";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils/format";
import { HardDrive, AlertTriangle, Sparkles, Files } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UserLimits } from "@/types/domain";

export function StorageUsageBar({ userId, initialData }: { userId: string; initialData: UserLimits }) {
  const { data } = useMyLimits(userId, initialData);

  const storagePct = data.storageQuotaBytes > 0 ? Math.min(100, (data.usedBytes / data.storageQuotaBytes) * 100) : 0;
  const filesPct = data.maxFiles > 0 ? Math.min(100, (data.fileCount / data.maxFiles) * 100) : 0;
  const isNearStorageLimit = storagePct >= 90;
  const isNearFilesLimit = filesPct >= 90;
  const isPro = data.planId === "pro";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <HardDrive className="size-4 text-muted-foreground" />
          Almacenamiento
        </CardTitle>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            isPro ? "bg-amber-400/15 text-amber-600" : "bg-muted text-muted-foreground"
          )}
        >
          {isPro && <Sparkles className="size-3" />}
          Plan {data.planDisplayName}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.isFallback && (
          <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            No pudimos cargar tus límites reales — mostrando valores por defecto de "Registrado" hasta que se resuelva. Si tienes plan Pro, puede tardar en reflejarse; recarga en un momento.
          </p>
        )}

        <div className="space-y-2">
          <Progress
            value={storagePct}
            indicatorClassName={cn(isNearStorageLimit && "bg-destructive")}
            aria-label="Uso de almacenamiento"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatBytes(data.usedBytes)} de {formatBytes(data.storageQuotaBytes)} usados
            </span>
            <span className={cn("font-medium", isNearStorageLimit && "text-destructive")}>
              {storagePct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Files className="size-3.5" /> Archivos
            </span>
            <span className={cn("font-medium", isNearFilesLimit && "text-destructive")}>
              {data.fileCount} / {data.maxFiles}
            </span>
          </div>
        </div>

        {(isNearStorageLimit || isNearFilesLimit) && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" />
            Te estás quedando sin margen en tu plan {data.planDisplayName}.
            {!isPro && " Mejora a Pro para ampliar tus límites."}
          </p>
        )}

        {!isPro && (
          <div className="rounded-md bg-amber-400/10 p-3 text-xs">
            <p className="font-medium text-amber-700 dark:text-amber-500">Pro — 19€/año</p>
            <p className="mt-0.5 text-muted-foreground">
              5 GB, 5.000 archivos, 500 MB por archivo, 100 enlaces de compartición. Escríbenos para mejorar tu cuenta.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
