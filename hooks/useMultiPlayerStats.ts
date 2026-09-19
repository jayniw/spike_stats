"use client";

import { useQueries } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { statsKeys } from "./usePlayersBySeason";
import type { PlayerMatchStats, PlayerSeasonStats } from "@/src/types/volleyball";

interface UseMultiPlayerStatsOptions {
  playerIds: string[];
  matchId?: string | null;
  season?: string | null;
}

export function useMultiPlayerStats({
  playerIds,
  matchId,
  season,
}: UseMultiPlayerStatsOptions) {
  const supabase = createClient();

  const isMatchMode = !!matchId;

  const results = useQueries({
    queries: playerIds.map((playerId) => ({
      queryKey: isMatchMode
        ? statsKeys.playerMatchStats(matchId, playerId)
        : statsKeys.playerSeasonStats(playerId, season || ""),
      queryFn: async () => {
        if (isMatchMode) {
          const { data, error } = await supabase.rpc(
            "get_player_match_stats",
            {
              p_match_id: matchId,
              p_player_id: playerId,
            }
          );
          if (error) throw error;
          return (data?.[0] || null) as PlayerMatchStats | null;
        } else {
          const { data, error } = await supabase.rpc(
            "get_player_season_stats",
            {
              p_player_id: playerId,
              p_season: season,
            }
          );
          if (error) throw error;
          return (data || []) as PlayerSeasonStats[];
        }
      },
      enabled:
        isMatchMode ? !!matchId && !!playerId : !!season && !!playerId,
      staleTime: 30 * 1000,
    })),
  });

  // Build map: playerId -> stats
  const statsMap = new Map<
    string,
    PlayerMatchStats | PlayerSeasonStats[] | null
  >();

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);
  const error = results.find((r) => r.error)?.error;

  results.forEach((result, index) => {
    const playerId = playerIds[index];
    if (result.data !== undefined) {
      statsMap.set(playerId, result.data);
    }
  });

  return {
    statsMap,
    isLoading,
    isError,
    error,
  };
}
