"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getStorageUsage } from "@/lib/supabase/queries";
import type { StorageUsage } from "@/types/domain";

export function useStorageUsage(userId: string, initialData: StorageUsage) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["storage-usage", userId],
    queryFn: () => getStorageUsage(supabase, userId),
    initialData,
    refetchInterval: 60_000, // refresco pasivo cada minuto; los uploads invalidan esta key manualmente
  });
}
