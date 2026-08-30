import * as React from "react";

import { createServerClient } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/guards";
import { MembersTable } from "./members-table";
import { getUserEmails } from "./actions";

type MembershipWithProfile = {
  id: string;
  role: string;
  status: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  created_at: string;
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const params = await searchParams;
  const orgId = params.org;

  if (!orgId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Miembros</h1>
        <p className="text-muted-foreground">
          No se especificó una organización.
        </p>
      </div>
    );
  }

  const ctx = await requireRole(orgId, "club_admin");
  const client = await createServerClient();

  // Fetch memberships
  const { data: memberships } = await client
    .from("memberships" as never)
    .select("id, role, status, user_id, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (!memberships || (memberships as unknown[]).length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Miembros</h1>
        <p className="text-muted-foreground">
          No hay miembros en este club.
        </p>
      </div>
    );
  }

  const rows = memberships as Array<{
    id: string;
    role: string;
    status: string;
    user_id: string;
    created_at: string;
  }>;

  // Fetch profiles
  const userIds = rows.map((r) => r.user_id);
  const { data: profiles } = await client
    .from("profiles" as never)
    .select("id, full_name, phone")
    .in("id", userIds);

  const profileMap = new Map<string, { full_name: string; phone: string }>();
  for (const p of (profiles as Array<{ id: string; full_name: string; phone: string }>) ?? []) {
    profileMap.set(p.id, { full_name: p.full_name, phone: p.phone });
  }

  // Fetch emails
  const emailMap = await getUserEmails(userIds);

  const membersWithInfo: MembershipWithProfile[] = rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      role: row.role,
      status: row.status,
      user_id: row.user_id,
      user_name: profile?.full_name ?? "",
      user_email: emailMap.get(row.user_id) ?? "",
      user_phone: profile?.phone ?? "",
      created_at: row.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Miembros</h1>
        <p className="text-muted-foreground">
          Gestiona los miembros y roles de tu club.
        </p>
      </div>

      <MembersTable
        members={membersWithInfo}
        organizationId={orgId}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
