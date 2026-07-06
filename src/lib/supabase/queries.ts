import type { Database } from "@/types/database";
import type { DriveFile, ActivityLogEntry, StorageUsage } from "@/types/domain";
import type { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type { createClient as createServerSupabase } from "@/lib/supabase/server";

/**
 * Derivamos el tipo del cliente directamente de nuestras propias factories
 * (browser y server) en vez de reconstruir `SupabaseClient<Database>` a
 * mano. @supabase/ssr resuelve sus generics de forma distinta a
 * @supabase/supabase-js al usar un único type-arg, y comparar ambos tipos
 * "desde fuera" produce falsos mismatches en TS estricto. Usar el tipo tal
 * cual sale de nuestras factories garantiza compatibilidad estructural real.
 */
type TypedClient =
  | ReturnType<typeof createBrowserSupabase>
  | Awaited<ReturnType<typeof createServerSupabase>>;

const DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB — coincide con el default de la tabla profiles

function mapFileRow(row: Database["public"]["Tables"]["files"]["Row"]): DriveFile {
  return {
    id: row.id,
    ownerId: row.owner_id,
    folderId: row.folder_id,
    name: row.name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    cid: row.cid,
    pinningProvider: row.pinning_provider as DriveFile["pinningProvider"],
    isEncrypted: row.is_encrypted,
    encryptionIv: row.encryption_iv,
    tags: row.tags,
    visibility: row.visibility,
    thumbnailCid: row.thumbnail_cid,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivityRow(row: Database["public"]["Tables"]["activity_log"]["Row"]): ActivityLogEntry {
  return {
    id: row.id,
    ownerId: row.owner_id,
    action: row.action as ActivityLogEntry["action"],
    fileId: row.file_id,
    folderId: row.folder_id,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

/** Uso de almacenamiento del usuario (vista `storage_usage` + cuota de `profiles`). */
export async function getStorageUsage(supabase: TypedClient, userId: string): Promise<StorageUsage> {
  const [{ data: usage }, { data: profile }] = await Promise.all([
    supabase.from("storage_usage").select("used_bytes, file_count").eq("owner_id", userId).maybeSingle(),
    supabase.from("profiles").select("storage_quota_bytes").eq("id", userId).single(),
  ]);

  return {
    usedBytes: usage?.used_bytes ?? 0,
    fileCount: usage?.file_count ?? 0,
    quotaBytes: profile?.storage_quota_bytes ?? DEFAULT_QUOTA_BYTES,
  };
}

/** Archivos más recientes del usuario (para la sección "Archivos recientes"). */
export async function getRecentFiles(supabase: TypedClient, userId: string, limit = 8): Promise<DriveFile[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapFileRow);
}

/** Feed de actividad reciente (uploads, shares, etc.) del usuario. */
export async function getRecentActivity(supabase: TypedClient, userId: string, limit = 15): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapActivityRow);
}

/** Conteo de shares activos (enlaces creados) del usuario, para las stats cards. */
export async function getActiveSharesCount(supabase: TypedClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("shares")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId);

  if (error) throw error;
  return count ?? 0;
}

/** Conteo de carpetas del usuario. */
export async function getFoldersCount(supabase: TypedClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("folders")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId);

  if (error) throw error;
  return count ?? 0;
}
