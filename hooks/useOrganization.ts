"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

// Query keys for cache management
export const orgKeys = {
  all: ["organization"] as const,
  detail: (userId: string) => [...orgKeys.all, userId] as const,
};

export const teamKeys = {
  all: ["teams"] as const,
  list: (orgId: string) => [...teamKeys.all, orgId] as const,
};

export const playerKeys = {
  all: ["players"] as const,
  list: (orgId: string) => [...playerKeys.all, orgId] as const,
};

export const rosterKeys = {
  all: ["rosters"] as const,
  list: (teamId: string) => [...rosterKeys.all, teamId] as const,
};

// StaleTime: 5 minutes - data is considered fresh for 5 minutes
const STALE_TIME = 5 * 60 * 1000;

// CacheTime: 30 minutes - data stays in cache for 30 minutes
const CACHE_TIME = 30 * 60 * 1000;

export function useOrganization() {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: orgKeys.detail(user?.id || ""),
    queryFn: async () => {
      if (!user) return null;

      // Get user's organization membership
      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError || !membership) return null;

      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .maybeSingle();

      if (orgError || !org) return null;

      return {
        ...org,
        userRole: membership.role,
      };
    },
    enabled: !!user,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useUserTeams() {
  const { data: org } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: teamKeys.list(org?.id || ""),
    queryFn: async () => {
      if (!org) return [];

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("organization_id", org.id)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!org,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useTeamPlayers(teamId: string | null) {
  const { data: org } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: rosterKeys.list(teamId || ""),
    queryFn: async () => {
      if (!org || !teamId) return [];

      const { data, error } = await supabase
        .from("team_rosters")
        .select("*, player:players(*)")
        .eq("team_id", teamId)
        .order("jersey_number");

      if (error) throw error;
      return data;
    },
    enabled: !!org && !!teamId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

// Hook to invalidate org cache (call after mutations)
export function useInvalidateOrg() {
  const queryClient = useQueryClient();

  return {
    invalidateOrg: () => queryClient.invalidateQueries({ queryKey: orgKeys.all }),
    invalidateTeams: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
    invalidatePlayers: () => queryClient.invalidateQueries({ queryKey: playerKeys.all }),
    invalidateRosters: () => queryClient.invalidateQueries({ queryKey: rosterKeys.all }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.invalidateQueries({ queryKey: playerKeys.all });
      queryClient.invalidateQueries({ queryKey: rosterKeys.all });
    },
  };
}
