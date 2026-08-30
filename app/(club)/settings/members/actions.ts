"use server";

import { createClient } from "@supabase/supabase-js";

import { createServerClient } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/guards";
import type { Role } from "@/lib/validation/core";

type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function changeRoleAction(
  organizationId: string,
  membershipId: string,
  newRole: Role,
): Promise<ActionResult> {
  await requireRole(organizationId, "club_admin");

  const client = await createServerClient();

  const { error } = await client
    .from("memberships" as never)
    .update({ role: newRole } as never)
    .eq("id", membershipId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: `No se pudo cambiar el rol: ${error.message}` };
  }

  return { success: true };
}

export async function revokeMembershipAction(
  organizationId: string,
  membershipId: string,
): Promise<ActionResult> {
  await requireRole(organizationId, "club_admin");

  const client = await createServerClient();

  const { error } = await client
    .from("memberships" as never)
    .update({ status: "revoked" } as never)
    .eq("id", membershipId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: `No se pudo revocar la membresía: ${error.message}` };
  }

  return { success: true };
}

export async function getUserEmails(
  userIds: string[],
): Promise<Map<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || userIds.length === 0) {
    return new Map();
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await admin.auth.admin.listUsers();
  const map = new Map<string, string>();

  for (const u of data?.users ?? []) {
    if (u.email && userIds.includes(u.id)) {
      map.set(u.id, u.email);
    }
  }

  return map;
}
