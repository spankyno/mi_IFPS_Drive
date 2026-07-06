import { Card, CardContent } from "@/components/ui/card";
import { Files, Folder, Share2, HardDrive } from "lucide-react";
import { formatBytes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface StatsCardsProps {
  fileCount: number;
  usedBytes: number;
  sharesCount: number;
  foldersCount: number;
}

export function StatsCards({ fileCount, usedBytes, sharesCount, foldersCount }: StatsCardsProps) {
  const stats = [
    { label: "Archivos", value: fileCount.toLocaleString("es-ES"), icon: Files, accent: "text-blue-500 bg-blue-500/10" },
    { label: "Espacio usado", value: formatBytes(usedBytes), icon: HardDrive, accent: "text-primary bg-primary/10" },
    { label: "Carpetas", value: foldersCount.toLocaleString("es-ES"), icon: Folder, accent: "text-amber-500 bg-amber-500/10" },
    { label: "Enlaces compartidos", value: sharesCount.toLocaleString("es-ES"), icon: Share2, accent: "text-violet-500 bg-violet-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, accent }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", accent)}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold leading-none">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
