"use client";

import Link from "next/link";
import { useRecentFiles } from "@/hooks/use-recent-files";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import { FileImage, FileVideo, FileText, File as FileIcon, Upload, ArrowRight } from "lucide-react";
import type { DriveFile } from "@/types/domain";

function iconForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return FileText;
  return FileIcon;
}

export function RecentFiles({ userId, initialData }: { userId: string; initialData: DriveFile[] }) {
  const { data } = useRecentFiles(userId, initialData);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-medium">Archivos recientes</CardTitle>
        <Link
          href="/dashboard/files"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Ver todos <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyFiles />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.map((file) => {
              const Icon = iconForMime(file.mimeType);
              return (
                <Link
                  key={file.id}
                  href={`/dashboard/files?open=${file.id}`}
                  className="group flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.sizeBytes)} · {formatRelativeTime(file.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyFiles() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Upload className="size-6" />
      </div>
      <div>
        <p className="text-sm font-medium">Todavía no subiste nada</p>
        <p className="text-sm text-muted-foreground">Tus archivos aparecerán aquí en cuanto subas el primero.</p>
      </div>
      <Link
        href="/dashboard/files"
        className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Subir un archivo
      </Link>
    </div>
  );
}
