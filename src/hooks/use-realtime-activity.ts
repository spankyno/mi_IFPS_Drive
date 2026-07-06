"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getRecentActivity } from "@/lib/supabase/queries";
import type { ActivityLogEntry } from "@/types/domain";

export const activityQueryKey = (userId: string) => ["activity", userId] as const;

/**
 * Combina un fetch inicial (hidratado con `initialData` desde el Server
 * Component) con una suscripción Realtime que prepende nuevas entradas
 * en cuanto Supabase notifica un INSERT en `activity_log`.
 */
export function useRealtimeActivity(userId: string, initialData: ActivityLogEntry[]) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const query = useQuery({
    queryKey: activityQueryKey(userId),
    queryFn: () => getRecentActivity(supabase, userId),
    initialData,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`activity-log-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log", filter: `owner_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const entry: ActivityLogEntry = {
            id: row.id as string,
            ownerId: row.owner_id as string,
            action: row.action as ActivityLogEntry["action"],
            fileId: (row.file_id as string) ?? null,
            folderId: (row.folder_id as string) ?? null,
            metadata: (row.metadata as Record<string, unknown>) ?? {},
            createdAt: row.created_at as string,
          };

          queryClient.setQueryData<ActivityLogEntry[]>(activityQueryKey(userId), (old = []) => [
            entry,
            ...old.filter((e) => e.id !== entry.id),
          ].slice(0, 15));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return query;
}
