"use client";

import { useRealtimeActivity } from "@/hooks/use-realtime-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  Activity,
  Upload,
  Trash2,
  Share2,
  Pencil,
  FolderPlus,
  Download,
  FolderInput,
} from "lucide-react";
import type { ActivityAction, ActivityLogEntry } from "@/types/domain";

const ACTION_CONFIG: Record<ActivityAction, { icon: typeof Upload; label: string; accent: string }> = {
  upload: { icon: Upload, label: "subió", accent: "text-primary bg-primary/10" },
  delete: { icon: Trash2, label: "eliminó", accent: "text-destructive bg-destructive/10" },
  share: { icon: Share2, label: "compartió", accent: "text-violet-500 bg-violet-500/10" },
  rename: { icon: Pencil, label: "renombró", accent: "text-amber-500 bg-amber-500/10" },
  move: { icon: FolderInput, label: "movió", accent: "text-amber-500 bg-amber-500/10" },
  folder_create: { icon: FolderPlus, label: "creó la carpeta", accent: "text-amber-500 bg-amber-500/10" },
  download: { icon: Download, label: "descargó", accent: "text-blue-500 bg-blue-500/10" },
};

function describe(entry: ActivityLogEntry): string {
  const name = (entry.metadata.fileName as string) ?? (entry.metadata.folderName as string) ?? "un elemento";
  return name;
}

export function ActivityFeed({ userId, initialData }: { userId: string; initialData: ActivityLogEntry[] }) {
  const { data } = useRealtimeActivity(userId, initialData);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Activity className="size-4 text-muted-foreground" />
          Actividad reciente
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length === 0 ? (
          <EmptyActivity />
        ) : (
          <ul className="scrollbar-thin max-h-96 space-y-1 overflow-y-auto">
            {data.map((entry) => {
              const config = ACTION_CONFIG[entry.action];
              const Icon = config.icon;
              return (
                <li key={entry.id} className="flex items-start gap-3 rounded-md px-1 py-2 animate-fade-in">
                  <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", config.accent)}>
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {config.label} <span className="font-medium">{describe(entry)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(entry.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Activity className="size-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">Aún no hay actividad. Sube tu primer archivo para empezar.</p>
    </div>
  );
}
