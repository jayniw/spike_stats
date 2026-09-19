"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "./useOrganization";
import type { PlayerRow } from "@/src/types/volleyball";

export const statsKeys = {
  all: ["stats"] as const,
  seasons: (orgId: string) => [...statsKeys.all, "seasons", orgId] as const,
  playersByTeam: (orgId: string, teamId: string) =>
    [...statsKeys.all, "playersByTeam", orgId, teamId] as const,
  playerMatchStats: (matchId: string, playerId: string) =>
    [...statsKeys.all, "playerMatchStats", matchId, playerId] as const,
  playerSeasonStats: (playerId: string, season: string) =>
    [...statsKeys.all, "playerSeasonStats", playerId, season] as const,
};

const STALE_TIME = 5 * 60 * 1000;

export function usePlayersByTeam(teamId: string | null) {
  const { data: org } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: statsKeys.playersByTeam(org?.id || "", teamId || ""),
    queryFn: async (): Promise<(PlayerRow & { jersey_number?: number })[]> => {
      if (!org || !teamId) return [];

      const { data: rosters, error } = await supabase
        .from("team_rosters")
        .select("player_id, jersey_number, player:players(*)")
        .eq("team_id", teamId)
        .order("jersey_number");

      if (error || !rosters) return [];

      return rosters.map((r) => {
        const player = Array.isArray(r.player) ? r.player[0] : r.player;
        return { ...player, jersey_number: r.jersey_number };
      });
    },
    enabled: !!org && !!teamId,
    staleTime: STALE_TIME,
  });
}
