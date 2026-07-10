"use client";

import { useDecryptedMediaUrl } from "@/hooks/use-decrypted-media";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import {
  FileImage,
  FileVideo,
  FileText,
  File as FileIcon,
  Loader2,
  AlertCircle,
  Lock,
  Download,
  ExternalLink,
} from "lucide-react";

function iconForMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return FileText;
  return FileIcon;
}

interface PublicMediaPreviewProps {
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  cid: string;
  gatewayUrl: string;
  allowDownload: boolean;
  isEncrypted: boolean;
  encryptionKey: string | null;
  encryptionIv: string | null;
}

/**
 * Client Component completo: toda la lógica de descifrado Y los botones
 * de acción viven aquí (no como render-prop pasado desde un Server
 * Component padre — pasar una función de servidor a cliente rompe la
 * serialización de RSC con "Functions cannot be passed directly to
 * Client Components"). El padre (page.tsx) solo pasa datos serializables.
 */
export function PublicMediaPreview({
  name,
  mimeType,
  sizeBytes,
  createdAt,
  cid,
  gatewayUrl,
  allowDownload,
  isEncrypted,
  encryptionKey,
  encryptionIv,
}: PublicMediaPreviewProps) {
  const { url: mediaUrl, isLoading, error } = useDecryptedMediaUrl(
    { isEncrypted, encryptionKey, encryptionIv, mimeType },
    cid
  );
  const Icon = iconForMime(mimeType);

  return (
    <>
      <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Descifrando en tu navegador…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-destructive">
            <AlertCircle className="size-10" />
            <p className="text-sm">{error}</p>
          </div>
        ) : !mediaUrl ? null : mimeType.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element -- servida desde gateway IPFS externo o descifrada a blob: URL
          <img src={mediaUrl} alt={name} className="max-h-96 w-full object-contain" />
        ) : mimeType.startsWith("video/") ? (
          <video src={mediaUrl} controls className="max-h-96 w-full" />
        ) : mimeType === "application/pdf" ? (
          <iframe src={mediaUrl} title={name} className="h-96 w-full" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
            <Icon className="size-14" />
            <p className="text-sm">No hay vista previa disponible para este tipo de archivo.</p>
          </div>
        )}
      </div>

      {isEncrypted && (
        <p className="flex items-center gap-1.5 text-xs text-primary">
          <Lock className="size-3.5 shrink-0" />
          Este archivo se cifró en el navegador de quien lo subió. Se está descifrando en el tuyo — el contenido nunca viaja sin cifrar.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {formatBytes(sizeBytes)} · Compartido {formatRelativeTime(createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {allowDownload && mediaUrl && (
            <a
              href={mediaUrl}
              download={name}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Download className="size-4" /> Descargar
            </a>
          )}
          {!isEncrypted && (
            <a
              href={gatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <ExternalLink className="size-4" /> Abrir en IPFS
            </a>
          )}
        </div>
      </div>

      {!allowDownload && (
        <p className="text-xs text-muted-foreground">
          Este enlace es de solo visualización — quien lo compartió no habilitó la descarga directa.
        </p>
      )}
    </>
  );
}
