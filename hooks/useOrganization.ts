"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

export function useOrganization() {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["organization", user?.id],
    queryFn: async () => {
      console.log("[useOrganization] user:", user?.id);
      if (!user) return null;

      // Get user's organization membership
      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      console.log("[useOrganization] membership:", membership, "error:", membershipError);
      if (membershipError || !membership) return null;

      // Get organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .single();

      console.log("[useOrganization] org:", org, "error:", orgError);
      if (orgError || !org) return null;

      return {
        ...org,
        userRole: membership.role,
      };
    },
    enabled: !!user,
  });
}

export function useUserTeams() {
  const { data: org } = useOrganization();
  const supabase = createClient();

  return useQuery({
    queryKey: ["teams", org?.id],
    queryFn: async () => {
      console.log("[useUserTeams] org:", org?.id);
      if (!org) return [];

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("organization_id", org.id)
        .order("name");

      console.log("[useUserTeams] data:", data, "error:", error);
      if (error) throw error;
      return data;
    },
    enabled: !!org,
  });
}
