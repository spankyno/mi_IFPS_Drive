"use client";

import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils/format";
import { CheckCircle2, AlertCircle, X, UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { UploadTask } from "@/types/domain";

const STATUS_LABEL: Record<UploadTask["status"], string> = {
  queued: "En cola…",
  encrypting: "Cifrando…",
  uploading: "Subiendo…",
  pinning: "Confirmando en IPFS…",
  done: "Completado",
  error: "Error",
};

export function UploadProgressPanel({
  tasks,
  onDismiss,
}: {
  tasks: UploadTask[];
  onDismiss: (id: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 w-80 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg animate-fade-in lg:bottom-4">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <UploadCloud className="size-4 text-primary" />
        <p className="text-sm font-medium">
          {tasks.filter((t) => t.status !== "done" && t.status !== "error").length > 0
            ? "Subiendo archivos…"
            : "Subidas"}
        </p>
      </div>
      <ul className="scrollbar-thin max-h-72 divide-y overflow-y-auto">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-start gap-2 px-4 py-2.5">
            <div className="mt-0.5 shrink-0">
              {task.status === "done" && <CheckCircle2 className="size-4 text-primary" />}
              {task.status === "error" && <AlertCircle className="size-4 text-destructive" />}
              {(task.status === "uploading" || task.status === "pinning" || task.status === "queued") && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{task.file.name}</p>
              {task.status === "uploading" && <Progress value={task.progress} className="mt-1.5 h-1.5" />}
              <p
                className={cn(
                  "mt-1 text-xs text-muted-foreground",
                  task.status === "error" && "text-destructive"
                )}
              >
                {task.status === "error" ? task.error : STATUS_LABEL[task.status]}
                {task.status !== "error" && ` · ${formatBytes(task.file.size)}`}
              </p>
            </div>
            {(task.status === "done" || task.status === "error") && (
              <button
                onClick={() => onDismiss(task.id)}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Descartar"
              >
                <X className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
