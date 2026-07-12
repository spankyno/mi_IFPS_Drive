/**
 * Tipos de dominio compartidos entre cliente y servidor.
 * `database.ts` (generado por `pnpm db:types`) contendrá los tipos exactos
 * de Supabase; estos son los tipos "de aplicación", más ergonómicos.
 */

export type PinningProvider =
  | "filebase"
  | "4everland"
  | "ipfs-ninja"
  | "lighthouse"
  | "pinata";

export type FileVisibility = "private" | "public" | "unlisted";

export interface DriveFolder {
  id: string;
  ownerId: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriveFile {
  id: string;
  ownerId: string;
  folderId: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  cid: string;
  storageKey: string;
  pinningProvider: PinningProvider;
  isEncrypted: boolean;
  encryptionIv: string | null;
  encryptionKey: string | null;
  tags: string[];
  visibility: FileVisibility;
  thumbnailCid: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ActivityAction =
  | "upload"
  | "delete"
  | "share"
  | "rename"
  | "move"
  | "folder_create"
  | "download";

export interface ActivityLogEntry {
  id: string;
  ownerId: string;
  action: ActivityAction;
  fileId: string | null;
  folderId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface FileShare {
  id: string;
  fileId: string;
  ownerId: string;
  shareToken: string;
  permission: "view" | "download";
  expiresAt: string | null;
  createdAt: string;
}

export interface StorageUsage {
  usedBytes: number;
  quotaBytes: number;
  fileCount: number;
}

export type PlanId = "registered" | "pro";

export interface UserLimits {
  planId: PlanId;
  planDisplayName: string;
  storageQuotaBytes: number;
  maxFiles: number;
  maxFileSizeBytes: number;
  maxActiveShares: number;
  usedBytes: number;
  fileCount: number;
  activeSharesCount: number;
  /** true si estos límites son el fallback de emergencia (el RPC get_my_limits falló) — ver getMyLimits(). */
  isFallback?: boolean;
}

/** Progreso de una subida en curso, usado por el store de uploads en cliente. */
export interface UploadTask {
  id: string;
  file: File;
  progress: number; // 0-100
  status: "queued" | "encrypting" | "uploading" | "pinning" | "done" | "error";
  cid?: string;
  error?: string;
}
