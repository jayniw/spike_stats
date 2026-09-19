"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "./useOrganization";
import { statsKeys } from "./usePlayersBySeason";

export function useSeasons() {
  const { data: org } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: statsKeys.seasons(org?.id || ""),
    queryFn: async (): Promise<string[]> => {
      if (!org) return [];

      const { data, error } = await supabase
        .from("teams")
        .select("season")
        .eq("organization_id", org.id)
        .not("season", "is", null);

      if (error || !data) return [];

      const seasons = [...new Set(data.map((t) => t.season).filter(Boolean))];
      return seasons.sort((a, b) => b.localeCompare(a));
    },
    enabled: !!org,
    staleTime: 5 * 60 * 1000,
  });
}
