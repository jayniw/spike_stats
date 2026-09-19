"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "./useOrganization";
import { statsKeys } from "./usePlayersBySeason";
import type { MatchRow } from "@/src/types/volleyball";

const STALE_TIME = 5 * 60 * 1000;

export interface MatchWithOpponent extends MatchRow {
  opponent_name_resolved: string;
}

export function useMatchesByTeam(teamId: string | null) {
  const { data: org } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: [...statsKeys.all, "matchesByTeam", org?.id || "", teamId || ""],
    queryFn: async (): Promise<MatchWithOpponent[]> => {
      if (!org || !teamId) return [];

      // Get matches where this team is home or away
      const { data: matches, error } = await supabase
        .from("matches")
        .select(
          "*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)"
        )
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order("match_date", { ascending: false });

      if (error || !matches) return [];

      // Resolve opponent name: if away_team_id is null, use opponent_name
      return matches.map((m) => {
        const isHome = m.home_team_id === teamId;
        let opponent: string;

        if (isHome) {
          // We are home → opponent is away team or opponent_name
          opponent =
            m.away_team?.name || m.opponent_name || "Sin rival";
        } else {
          // We are away → opponent is home team
          opponent = m.home_team?.name || "Sin rival";
        }

        return {
          ...m,
          opponent_name_resolved: opponent,
        };
      }) as MatchWithOpponent[];
    },
    enabled: !!org && !!teamId,
    staleTime: STALE_TIME,
  });
}
