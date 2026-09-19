"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { statsKeys } from "./usePlayersBySeason";

export function usePlayerSeasonStats(
  playerId: string | null,
  season: string | null
) {
  const supabase = createClient();

  return useQuery({
    queryKey: statsKeys.playerSeasonStats(playerId || "", season || ""),
    queryFn: async () => {
      if (!playerId || !season) return null;

      const { data, error } = await supabase.rpc("get_player_season_stats", {
        p_player_id: playerId,
        p_season: season,
      });

      if (error) throw error;

      return data || [];
    },
    enabled: !!playerId && !!season,
    staleTime: 30 * 1000,
  });
}
