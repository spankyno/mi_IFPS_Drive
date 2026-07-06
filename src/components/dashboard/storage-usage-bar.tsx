"use client";

import { useStorageUsage } from "@/hooks/use-storage-usage";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils/format";
import { HardDrive, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { StorageUsage } from "@/types/domain";

export function StorageUsageBar({ userId, initialData }: { userId: string; initialData: StorageUsage }) {
  const { data } = useStorageUsage(userId, initialData);
  const percentage = data.quotaBytes > 0 ? Math.min(100, (data.usedBytes / data.quotaBytes) * 100) : 0;
  const isNearLimit = percentage >= 90;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <HardDrive className="size-4 text-muted-foreground" />
          Almacenamiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress
          value={percentage}
          indicatorClassName={cn(isNearLimit && "bg-destructive")}
          aria-label="Uso de almacenamiento"
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatBytes(data.usedBytes)} de {formatBytes(data.quotaBytes)} usados
          </span>
          <span className={cn("font-medium", isNearLimit && "text-destructive")}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        {isNearLimit && (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" />
            Te estás quedando sin espacio. Elimina archivos o pinealos con otro proveedor.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Nota: este límite es orientativo a nivel de app — el almacenamiento real depende del free tier de tu pinning service.
        </p>
      </CardContent>
    </Card>
  );
}
