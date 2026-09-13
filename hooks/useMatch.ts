"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { matchKeys } from "./useMatches";

// StaleTime for match data
const MATCH_DETAIL_STALE_TIME = 10 * 1000; // 10 seconds
const MATCH_EVENTS_STALE_TIME = 5 * 1000; // 5 seconds (real-time feel)

export function useMatch(matchId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: matchKeys.detail(matchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)")
        .eq("id", matchId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
    staleTime: MATCH_DETAIL_STALE_TIME,
  });
}

export function useMatchSets(matchId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: matchKeys.sets(matchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_sets")
        .select("*")
        .eq("match_id", matchId)
        .order("set_number");

      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
    staleTime: MATCH_DETAIL_STALE_TIME,
  });
}

export function useMatchEvents(matchId: string, setNumber: number) {
  const supabase = createClient();

  return useQuery({
    queryKey: matchKeys.events(matchId, setNumber),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("play_events")
        .select("*, player:players(first_name, last_name, team_rosters(jersey_number))")
        .eq("match_id", matchId)
        .eq("set_number", setNumber)
        .order("created_at");

      if (error) throw error;
      return data;
    },
    enabled: !!matchId && setNumber > 0,
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
    staleTime: MATCH_EVENTS_STALE_TIME,
  });
}
