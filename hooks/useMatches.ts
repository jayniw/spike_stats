"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "./useOrganization";
import type { MatchFilters } from "@/src/types/volleyball";

const matchKeys = {
  all: ["matches"] as const,
  lists: (filters: MatchFilters) => ["matches", "list", filters] as const,
  detail: (matchId: string) => ["matches", "detail", matchId] as const,
  sets: (matchId: string) => ["matches", "sets", matchId] as const,
  events: (matchId: string, setNumber?: number) =>
    ["matches", "events", matchId, setNumber] as const,
};

export function useMatches(filters: MatchFilters = {}) {
  const { data: org } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: [...matchKeys.lists(filters), org?.id],
    queryFn: async () => {
      if (!org) return [];

      let query = supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
        .eq("organization_id", org.id)
        .order("match_date", { ascending: false });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.team_id) {
        query = query.or(`home_team_id.eq.${filters.team_id},away_team_id.eq.${filters.team_id}`);
      }
      if (filters.date_from) {
        query = query.gte("match_date", filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte("match_date", filters.date_to);
      }
      if (filters.tournament) {
        query = query.eq("tournament", filters.tournament);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!org,
  });
}

export { matchKeys };
