"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client with service role - bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function getUserOrganization(userId: string) {
  console.log("[ServerAction] Getting org for user:", userId);

  // Step 1: Get membership
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  console.log("[ServerAction] Membership:", { membership, membershipError });

  if (membershipError || !membership) {
    return { org: null, error: membershipError?.message || "No membership found" };
  }

  // Step 2: Get organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("*")
    .eq("id", membership.organization_id)
    .maybeSingle();

  console.log("[ServerAction] Organization:", { org, orgError });

  if (orgError || !org) {
    return { org: null, error: orgError?.message || "Organization not found" };
  }

  return {
    org: {
      ...org,
      userRole: membership.role,
    },
    error: null,
  };
}

export async function getUserTeams(organizationId: string) {
  console.log("[ServerAction] Getting teams for org:", organizationId);

  const { data, error } = await supabaseAdmin
    .from("teams")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  console.log("[ServerAction] Teams:", { count: data?.length, error });

  if (error) {
    return { teams: [], error: error.message };
  }

  return { teams: data, error: null };
}

export async function checkUserMembership(userId: string) {
  console.log("[ServerAction] Checking membership for user:", userId);

  const { data, error } = await supabaseAdmin
    .from("organization_members")
    .select("*")
    .eq("user_id", userId);

  console.log("[ServerAction] All memberships:", { data, error });

  return { memberships: data, error };
}
