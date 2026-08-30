import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/db/client";
import type { Role } from "@/lib/validation/core";

type MembershipRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: Role;
  status: string;
};

type AuthGuardResult = {
  userId: string;
  membershipId: string;
  organizationId: string;
  role: Role;
};

/**
 * Server-side guard: ensures the current user is authenticated, belongs to
 * `organizationId`, and holds one of `allowedRoles`. Returns the membership
 * context on success; redirects to `/login` if unauthenticated or to `/` if
 * unauthorized.
 *
 * Usage in Server Actions / Route Handlers:
 * ```ts
 * const ctx = await requireRole(organizationId, "club_admin", "coach");
 * ```
 */
export async function requireRole(
  organizationId: string,
  ...allowedRoles: Role[]
): Promise<AuthGuardResult> {
  const client = await createServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error } = await client
    .from("memberships")
    .select("id, organization_id, user_id, role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (error || !membership) {
    redirect("/");
  }

  const row = membership as MembershipRow;

  if (allowedRoles.length > 0 && !allowedRoles.includes(row.role)) {
    redirect("/");
  }

  return {
    userId: user.id,
    membershipId: row.id,
    organizationId: row.organization_id,
    role: row.role,
  };
}

/**
 * Lightweight variant: returns the active membership for the current user in
 * the given organization, or `null` if none exists. Does NOT redirect.
 */
export async function getMembership(
  organizationId: string,
): Promise<AuthGuardResult | null> {
  const client = await createServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return null;

  const { data: membership } = await client
    .from("memberships")
    .select("id, organization_id, user_id, role, status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership) return null;

  const row = membership as MembershipRow;
  return {
    userId: user.id,
    membershipId: row.id,
    organizationId: row.organization_id,
    role: row.role,
  };
}
