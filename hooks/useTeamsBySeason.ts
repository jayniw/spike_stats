"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "./useOrganization";
import { statsKeys } from "./usePlayersBySeason";
import type { TeamRow } from "@/src/types/volleyball";

const STALE_TIME = 5 * 60 * 1000;

export function useTeamsBySeason(season: string | null) {
  const { data: org } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: [...statsKeys.all, "teamsBySeason", org?.id || "", season || ""],
    queryFn: async (): Promise<TeamRow[]> => {
      if (!org || !season) return [];

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("organization_id", org.id)
        .eq("season", season)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!org && !!season,
    staleTime: STALE_TIME,
  });
}
