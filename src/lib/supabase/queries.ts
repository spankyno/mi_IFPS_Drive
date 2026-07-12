import type { Database } from "@/types/database";
import type { DriveFile, ActivityLogEntry, DriveFolder, FileShare, UserLimits } from "@/types/domain";
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

function mapFileRow(row: Database["public"]["Tables"]["files"]["Row"]): DriveFile {
  return {
    id: row.id,
    ownerId: row.owner_id,
    folderId: row.folder_id,
    name: row.name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    cid: row.cid,
    storageKey: row.storage_key,
    pinningProvider: row.pinning_provider as DriveFile["pinningProvider"],
    isEncrypted: row.is_encrypted,
    encryptionIv: row.encryption_iv,
    encryptionKey: row.encryption_key,
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

function mapFolderRow(row: Database["public"]["Tables"]["folders"]["Row"]): DriveFolder {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Carpetas y archivos directamente dentro de `folderId` (null = raíz). */
export async function getFolderContents(
  supabase: TypedClient,
  userId: string,
  folderId: string | null
): Promise<{ folders: DriveFolder[]; files: DriveFile[] }> {
  const [{ data: folderRows, error: foldersError }, { data: fileRows, error: filesError }] =
    await Promise.all([
      folderId
        ? supabase.from("folders").select("*").eq("owner_id", userId).eq("parent_id", folderId)
        : supabase.from("folders").select("*").eq("owner_id", userId).is("parent_id", null),
      folderId
        ? supabase.from("files").select("*").eq("owner_id", userId).eq("folder_id", folderId)
        : supabase.from("files").select("*").eq("owner_id", userId).is("folder_id", null),
    ]);

  if (foldersError) throw foldersError;
  if (filesError) throw filesError;

  return {
    folders: (folderRows ?? [])
      .map(mapFolderRow)
      .sort((a, b) => a.name.localeCompare(b.name)),
    files: (fileRows ?? []).map(mapFileRow).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

/** Ruta de breadcrumb desde la raíz hasta `folderId` (inclusive), subiendo por parent_id. */
export async function getFolderPath(supabase: TypedClient, folderId: string): Promise<DriveFolder[]> {
  const path: DriveFolder[] = [];
  let currentId: string | null = folderId;

  // Los árboles de carpetas de un usuario son pequeños en la práctica;
  // iterar uno a uno es más simple y suficientemente rápido que una CTE recursiva.
  while (currentId) {
    const { data, error } = await supabase.from("folders").select("*").eq("id", currentId).single();
    if (error || !data) break;
    const folder = mapFolderRow(data);
    path.unshift(folder);
    currentId = folder.parentId;
  }

  return path;
}

/**
 * Búsqueda avanzada: por nombre (ILIKE, en todo el drive, no solo la
 * carpeta actual) y/o por tags (coincide si el archivo tiene AL MENOS
 * una de las tags pedidas — operador `overlaps` de Postgres sobre arrays).
 */
export async function searchFiles(
  supabase: TypedClient,
  userId: string,
  filters: { query?: string; tags?: string[] }
): Promise<DriveFile[]> {
  let builder = supabase.from("files").select("*").eq("owner_id", userId);

  if (filters.query && filters.query.trim() !== "") {
    builder = builder.ilike("name", `%${filters.query.trim()}%`);
  }
  if (filters.tags && filters.tags.length > 0) {
    builder = builder.overlaps("tags", filters.tags);
  }

  const { data, error } = await builder.order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []).map(mapFileRow);
}

/** Todas las tags distintas que el usuario ha usado, para el filtro de tags. */
export async function getAllTags(supabase: TypedClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("files").select("tags").eq("owner_id", userId);
  if (error) throw error;

  const unique = new Set<string>();
  for (const row of data ?? []) {
    for (const tag of row.tags ?? []) unique.add(tag);
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

/** Enlaces privados activos de un archivo (para el diálogo de compartir). */
export async function getSharesForFile(supabase: TypedClient, fileId: string): Promise<FileShare[]> {
  const { data, error } = await supabase
    .from("shares")
    .select("*")
    .eq("file_id", fileId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    fileId: row.file_id,
    ownerId: row.owner_id,
    shareToken: row.share_token,
    permission: row.permission,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

/** Archivos que el usuario ha marcado como públicos (visibility = 'public'), para /dashboard/shared. */
export async function getPubliclySharedFiles(supabase: TypedClient, userId: string): Promise<DriveFile[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("owner_id", userId)
    .eq("visibility", "public")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFileRow);
}

/** Todos los enlaces privados del usuario, con el nombre del archivo al que pertenecen, para /dashboard/shared. */
export async function getAllSharesForUser(
  supabase: TypedClient,
  userId: string
): Promise<(FileShare & { fileName: string; fileCid: string })[]> {
  const { data, error } = await supabase
    .from("shares")
    .select("*, files(name, cid)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    fileId: row.file_id,
    ownerId: row.owner_id,
    shareToken: row.share_token,
    permission: row.permission,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    fileName: (row.files as unknown as { name: string; cid: string } | null)?.name ?? "Archivo eliminado",
    fileCid: (row.files as unknown as { name: string; cid: string } | null)?.cid ?? "",
  }));
}

/**
 * Límites del plan del usuario + su uso actual, en una sola llamada RPC
 * (ver migración 0005). Fuente de verdad única para toda la app —
 * dashboard, upload, sharing— sobre cuánto puede usar cada usuario.
 */
export async function getMyLimits(supabase: TypedClient): Promise<UserLimits> {
  const FALLBACK_LIMITS: UserLimits = {
    planId: "registered",
    planDisplayName: "Registrado",
    storageQuotaBytes: 524288000,
    maxFiles: 50,
    maxFileSizeBytes: 26214400,
    maxActiveShares: 3,
    usedBytes: 0,
    fileCount: 0,
    activeSharesCount: 0,
    isFallback: true,
  };

  const { data, error } = await supabase.rpc("get_my_limits");

  // Si el RPC falla (p.ej. la migración 0005 aún no se ha ejecutado en
  // este proyecto de Supabase, o cualquier otro error transitorio), NO
  // relanzamos el error: esta función se llama desde Server Components,
  // y un throw ahí tira toda la página con el error boundary genérico.
  // Preferimos degradar a los límites más restrictivos y dejar la app
  // usable, registrando el error en el servidor para poder diagnosticarlo.
  // `isFallback: true` permite además mostrar un aviso visible en la UI
  // en vez de fallar en silencio (ver StorageUsageBar / settings/page.tsx).
  if (error) {
    console.error("get_my_limits RPC falló (¿falta ejecutar la migración 0005_plans.sql?):", error.message);
    return FALLBACK_LIMITS;
  }

  const row = data?.[0];
  if (!row) {
    return FALLBACK_LIMITS;
  }

  return {
    planId: row.plan_id as UserLimits["planId"],
    planDisplayName: row.plan_display_name,
    storageQuotaBytes: row.storage_quota_bytes,
    maxFiles: row.max_files,
    maxFileSizeBytes: row.max_file_size_bytes,
    maxActiveShares: row.max_active_shares,
    usedBytes: row.used_bytes,
    fileCount: row.file_count,
    activeSharesCount: row.active_shares_count,
  };
}
