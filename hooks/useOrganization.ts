"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";
import { getUserOrganization, getUserTeams } from "@/app/actions/organization";

export function useOrganization() {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["organization", user?.id],
    queryFn: async () => {
      console.log("[useOrganization] Starting query for user:", user?.id);
      
      if (!user) {
        console.log("[useOrganization] No user, returning null");
        return null;
      }

      // Try server action first (bypasses RLS)
      console.log("[useOrganization] Using server action...");
      const result = await getUserOrganization(user.id);
      
      console.log("[useOrganization] Server action result:", result);
      
      if (result.org) {
        return result.org;
      }

      // Fallback to client query (with RLS)
      console.log("[useOrganization] Server action failed, trying client query...");
      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      console.log("[useOrganization] Client membership result:", { membership, membershipError });
      
      if (membershipError || !membership) {
        console.log("[useOrganization] No membership found");
        return null;
      }

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .maybeSingle();

      console.log("[useOrganization] Client org result:", { org, orgError });
      
      if (orgError || !org) {
        return null;
      }

      return {
        ...org,
        userRole: membership.role,
      };
    },
    enabled: !!user,
  });
}

export function useUserTeams() {
  const { data: org, isLoading: orgLoading } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: ["teams", org?.id],
    queryFn: async () => {
      console.log("[useUserTeams] Starting query for org:", org?.id);
      
      if (!org) {
        console.log("[useUserTeams] No org, returning empty array");
        return [];
      }

      // Try server action first (bypasses RLS)
      console.log("[useUserTeams] Using server action...");
      const result = await getUserTeams(org.id);
      
      console.log("[useUserTeams] Server action result:", result);
      
      if (result.teams) {
        return result.teams;
      }

      // Fallback to client query (with RLS)
      console.log("[useUserTeams] Server action failed, trying client query...");
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("organization_id", org.id)
        .order("name");

      console.log("[useUserTeams] Client result:", { data, error });
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    enabled: !!org && !orgLoading,
  });
}
