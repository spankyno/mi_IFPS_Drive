import { FolderOpen } from "lucide-react";

export default function FilesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <FolderOpen className="size-10 text-muted-foreground/40" />
      <div>
        <p className="font-medium">Gestión de archivos — Paso 4</p>
        <p className="text-sm text-muted-foreground">
          Aquí llega el upload con drag & drop, carpetas, vista grid/lista, búsqueda y preview.
        </p>
      </div>
    </div>
  );
}
