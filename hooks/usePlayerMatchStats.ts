"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { statsKeys } from "./usePlayersBySeason";
import type { PlayerMatchStats } from "@/src/types/volleyball";

export function usePlayerMatchStats(
  matchId: string | null,
  playerId: string | null
) {
  const supabase = createClient();

  return useQuery({
    queryKey: statsKeys.playerMatchStats(matchId || "", playerId || ""),
    queryFn: async (): Promise<PlayerMatchStats | null> => {
      if (!matchId || !playerId) return null;

      const { data, error } = await supabase.rpc("get_player_match_stats", {
        p_match_id: matchId,
        p_player_id: playerId,
      });

      if (error) throw error;

      // RPC returns array, take first element
      return data?.[0] || null;
    },
    enabled: !!matchId && !!playerId,
    staleTime: 30 * 1000,
  });
}
