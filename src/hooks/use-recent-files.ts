"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getRecentFiles } from "@/lib/supabase/queries";
import type { DriveFile } from "@/types/domain";

export function useRecentFiles(userId: string, initialData: DriveFile[]) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recent-files", userId],
    queryFn: () => getRecentFiles(supabase, userId),
    initialData,
  });
}
