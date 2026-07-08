"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { useFolderContents, useInvalidateFolderContents } from "@/hooks/use-folder-contents";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useSearchFiles, useAllTags } from "@/hooks/use-search-files";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { UploadProgressPanel } from "@/components/files/upload-progress-panel";
import { CreateFolderDialog } from "@/components/files/create-folder-dialog";
import { FileBreadcrumb } from "@/components/files/file-breadcrumb";
import { FileActionsMenu } from "@/components/files/file-actions-menu";
import { FolderActionsMenu } from "@/components/files/folder-actions-menu";
import { FilePreviewDialog } from "@/components/files/file-preview-dialog";
import { ShareDialog } from "@/components/files/share-dialog";
import { TagFilter } from "@/components/files/tag-filter";
import { moveFileAction } from "@/lib/actions/files";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  Upload,
  Folder,
  FileImage,
  FileVideo,
  FileText,
  File as FileIcon,
  LayoutGrid,
  List,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import type { DriveFile, DriveFolder } from "@/types/domain";

const GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL ?? "https://ipfs.filebase.io/ipfs";

function iconForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return FileText;
  return FileIcon;
}

interface FileExplorerProps {
  userId: string;
  folderId: string | null;
  path: DriveFolder[];
  initialData: { folders: DriveFolder[]; files: DriveFile[] };
}

export function FileExplorer({ userId, folderId, path, initialData }: FileExplorerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [shareFile, setShareFile] = useState<DriveFile | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggingFileId, setDraggingFileId] = useState<string | null>(null);

  const { data } = useFolderContents(userId, folderId, initialData);
  const invalidate = useInvalidateFolderContents(userId);
  const { tasks, uploadFiles, dismissTask } = useFileUpload(userId, folderId);
  const { data: allTags = [] } = useAllTags(userId);

  const isSearching = search.trim() !== "" || activeTags.length > 0;
  const debouncedSearch = useDebouncedValue(search, 350);
  const { data: searchResults = [], isFetching: isSearchLoading } = useSearchFiles(
    userId,
    debouncedSearch,
    activeTags
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted) => {
      if (accepted.length > 0) uploadFiles(accepted);
    },
  });

  // Fuera de modo búsqueda, el buscador solo filtra dentro de la carpeta actual (comportamiento local, instantáneo).
  const localFilteredFolders = useMemo(
    () => data.folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [data.folders, search]
  );
  const localFilteredFiles = useMemo(
    () => data.files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [data.files, search]
  );

  const displayedFolders = isSearching ? [] : localFilteredFolders;
  const displayedFiles = isSearching ? searchResults : localFilteredFiles;
  const isEmpty = displayedFolders.length === 0 && displayedFiles.length === 0 && !isSearchLoading;

  function goToFolder(id: string | null) {
    router.push(id ? `/dashboard/files?folder=${id}` : "/dashboard/files");
  }

  function clearSearch() {
    setSearch("");
    setActiveTags([]);
  }

  function handleFileChanged() {
    invalidate(folderId);
    queryClient.invalidateQueries({ queryKey: ["search-files", userId] });
    queryClient.invalidateQueries({ queryKey: ["all-tags", userId] });
  }

  function handleFileDeleted() {
    setPreviewFile(null);
    handleFileChanged();
  }

  // --- Drag & drop para MOVER archivos existentes a una carpeta (distinto
  // del dropzone de arriba, que sirve para SUBIR archivos nuevos del SO) ---
  const FILE_DRAG_MIME = "application/x-mi-ipfs-drive-file-id";

  function handleFileDragStart(e: React.DragEvent, file: DriveFile) {
    e.dataTransfer.setData(FILE_DRAG_MIME, file.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingFileId(file.id);
  }

  function handleFileDragEnd() {
    setDraggingFileId(null);
    setDragOverFolderId(null);
  }

  function handleFolderDragOver(e: React.DragEvent, targetFolderId: string) {
    if (!e.dataTransfer.types.includes(FILE_DRAG_MIME)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(targetFolderId);
  }

  function handleFolderDragLeave(targetFolderId: string) {
    setDragOverFolderId((current) => (current === targetFolderId ? null : current));
  }

  async function handleMoveFile(fileId: string, targetFolderId: string | null) {
    const result = await moveFileAction({ fileId, folderId: targetFolderId });
    if (result.error) {
      toast.error("No se pudo mover el archivo", { description: result.error });
    } else {
      toast.success("Archivo movido");
      handleFileChanged();
    }
  }

  async function handleFolderDrop(e: React.DragEvent, targetFolderId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    setDraggingFileId(null);

    const fileId = e.dataTransfer.getData(FILE_DRAG_MIME);
    if (!fileId) return;
    await handleMoveFile(fileId, targetFolderId);
  }

  return (
    <div {...getRootProps()} className="relative flex h-full flex-col p-4 lg:p-8">
      <input {...getInputProps()} />

      {/* Overlay de drag & drop */}
      {isDragActive && (
        <div className="pointer-events-none absolute inset-4 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5 lg:inset-8">
          <div className="flex flex-col items-center gap-2 text-primary">
            <UploadCloud className="size-10" />
            <p className="font-medium">Suelta los archivos para subirlos a IPFS</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3">
        <FileBreadcrumb path={path} onDropFile={handleMoveFile} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en todo tu drive…"
              className="pl-8"
            />
          </div>

          <TagFilter allTags={allTags} selected={activeTags} onChange={setActiveTags} />

          {isSearching && (
            <Button variant="ghost" onClick={clearSearch}>
              <X className="size-4" /> Limpiar
            </Button>
          )}

          <CreateFolderDialog parentId={folderId} />

          <Button onClick={open}>
            <Upload className="size-4" />
            Subir archivos
          </Button>

          <div className="flex overflow-hidden rounded-md border">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "flex size-10 items-center justify-center",
                view === "grid" ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent"
              )}
              aria-label="Vista de cuadrícula"
              aria-pressed={view === "grid"}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex size-10 items-center justify-center border-l",
                view === "list" ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent"
              )}
              aria-label="Vista de lista"
              aria-pressed={view === "list"}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {isSearching && (
          <p className="text-sm text-muted-foreground">
            {isSearchLoading
              ? "Buscando en todo tu drive…"
              : `${searchResults.length} resultado${searchResults.length === 1 ? "" : "s"} en todo tu drive`}
          </p>
        )}
      </div>

      {isEmpty ? (
        <EmptyState hasSearch={isSearching} onUploadClick={open} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {displayedFolders.map((folder) => (
            <div
              key={folder.id}
              onDragOver={(e) => handleFolderDragOver(e, folder.id)}
              onDragLeave={() => handleFolderDragLeave(folder.id)}
              onDrop={(e) => handleFolderDrop(e, folder.id)}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:border-primary/40 hover:bg-accent",
                dragOverFolderId === folder.id && "border-primary bg-primary/10 ring-2 ring-primary"
              )}
            >
              <div className="absolute right-1.5 top-1.5">
                <FolderActionsMenu folder={folder} onChanged={() => invalidate(folderId)} />
              </div>
              <button onClick={() => goToFolder(folder.id)} className="flex flex-col items-center gap-2">
                <Folder className="size-9 fill-amber-400/20 text-amber-500" />
                <p className="w-full max-w-32 truncate text-sm font-medium">{folder.name}</p>
              </button>
            </div>
          ))}
          {displayedFiles.map((file) => {
            const Icon = iconForMime(file.mimeType);
            return (
              <div
                key={file.id}
                draggable={!isSearching}
                onDragStart={(e) => handleFileDragStart(e, file)}
                onDragEnd={handleFileDragEnd}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:border-primary/40 hover:bg-accent",
                  draggingFileId === file.id && "opacity-40"
                )}
              >
                <div className="absolute right-1.5 top-1.5">
                  <FileActionsMenu
                    file={file}
                    gatewayUrl={`${GATEWAY}/${file.cid}`}
                    onDeleted={handleFileChanged}
                    onShare={() => setShareFile(file)}
                  />
                </div>
                <button onClick={() => setPreviewFile(file)} className="flex flex-col items-center gap-2">
                  <Icon className="size-9 text-muted-foreground group-hover:text-primary" />
                  <p className="w-full max-w-32 truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</p>
                  {file.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {file.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Tamaño</th>
                <th className="hidden px-4 py-2 font-medium sm:table-cell">Modificado</th>
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedFolders.map((folder) => (
                <tr
                  key={folder.id}
                  onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                  onDragLeave={() => handleFolderDragLeave(folder.id)}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                  className={cn(
                    "group hover:bg-accent",
                    dragOverFolderId === folder.id && "bg-primary/10 ring-2 ring-inset ring-primary"
                  )}
                >
                  <td
                    onClick={() => goToFolder(folder.id)}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2.5 font-medium"
                  >
                    <Folder className="size-4 fill-amber-400/20 text-amber-500" /> {folder.name}
                  </td>
                  <td
                    onClick={() => goToFolder(folder.id)}
                    className="hidden cursor-pointer px-4 py-2.5 text-muted-foreground sm:table-cell"
                  >
                    —
                  </td>
                  <td
                    onClick={() => goToFolder(folder.id)}
                    className="hidden cursor-pointer px-4 py-2.5 text-muted-foreground sm:table-cell"
                  >
                    {formatRelativeTime(folder.updatedAt)}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <FolderActionsMenu folder={folder} onChanged={() => invalidate(folderId)} />
                  </td>
                </tr>
              ))}
              {displayedFiles.map((file) => {
                const Icon = iconForMime(file.mimeType);
                return (
                  <tr
                    key={file.id}
                    draggable={!isSearching}
                    onDragStart={(e) => handleFileDragStart(e, file)}
                    onDragEnd={handleFileDragEnd}
                    className={cn("group hover:bg-accent", draggingFileId === file.id && "opacity-40")}
                  >
                    <td className="px-4 py-2.5">
                      <button onClick={() => setPreviewFile(file)} className="flex items-center gap-2 font-medium">
                        <Icon className="size-4 text-muted-foreground" /> {file.name}
                        {file.tags.length > 0 && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                            {file.tags[0]}
                            {file.tags.length > 1 ? ` +${file.tags.length - 1}` : ""}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                      {formatBytes(file.sizeBytes)}
                    </td>
                    <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                      {formatRelativeTime(file.createdAt)}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <FileActionsMenu
                        file={file}
                        gatewayUrl={`${GATEWAY}/${file.cid}`}
                        onDeleted={handleFileChanged}
                        onShare={() => setShareFile(file)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <UploadProgressPanel tasks={tasks} onDismiss={dismissTask} />

      <FilePreviewDialog
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onChanged={handleFileChanged}
        onDeleted={handleFileDeleted}
        onShare={(file) => {
          setPreviewFile(null);
          setShareFile(file);
        }}
      />

      <ShareDialog
        file={shareFile}
        onClose={() => setShareFile(null)}
        onVisibilityChanged={(visibility) => {
          setShareFile((prev) => (prev ? { ...prev, visibility } : prev));
          handleFileChanged();
        }}
      />
    </div>
  );
}

function EmptyState({ hasSearch, onUploadClick }: { hasSearch: boolean; onUploadClick: () => void }) {
  if (hasSearch) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <Search className="size-8 text-muted-foreground/40" />
        <p>No hay nada que coincida con tu búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UploadCloud className="size-7" />
      </div>
      <div>
        <p className="font-medium">Esta carpeta está vacía</p>
        <p className="text-sm text-muted-foreground">Arrastra archivos aquí o usa el botón de subir.</p>
      </div>
      <Button onClick={onUploadClick}>
        <Upload className="size-4" /> Subir archivos
      </Button>
    </div>
  );
}
