import * as React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { ClubProvider } from "@/components/club-provider";
import { ClubNav } from "@/components/club-nav";
import { UserMenu } from "@/components/user-menu";
import { createServerClient } from "@/lib/db/client";
import type { Role } from "@/lib/validation/core";

type MembershipRow = {
  organization_id: string;
  id: string;
  role: Role;
  organizations: { name: string } | null;
};

export default async function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const client = await createServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Determine organization from cookie
  const orgFromCookie = cookieStore.get("selected_org")?.value;

  // Build query to find the right membership
  let query = client
    .from("memberships" as never)
    .select("organization_id, id, role, organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (orgFromCookie) {
    query = query.eq("organization_id", orgFromCookie);
  }

  const { data: memberships } = await query.limit(10);

  if (!memberships || (memberships as unknown[]).length === 0) {
    redirect("/onboarding/new-club");
  }

  const rows = memberships as MembershipRow[];

  let selectedMembership: MembershipRow;
  if (rows.length === 1) {
    selectedMembership = rows[0] as MembershipRow;
  } else if (orgFromCookie) {
    // Cookie specifies an org but it's not in memberships
    redirect("/select-club");
  } else {
    // Multiple clubs, no preference — show selector
    redirect("/select-club");
  }

  // Fetch all memberships for the role switcher
  const { data: allMemberships } = await client
    .from("memberships" as never)
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const allRows = (allMemberships as Array<{
    organization_id: string;
    role: string;
    organizations: { name: string } | null;
  }>) ?? [];

  const userClubs = allRows.map((row) => ({
    organizationId: row.organization_id,
    clubName: row.organizations?.name ?? "Club",
    role: row.role,
    roleLabel:
      ({
        club_admin: "Admin",
        coach: "Entrenador",
        analyst: "Analista",
        player: "Jugadora",
        spectator: "Espectador",
      } as Record<string, string>)[row.role] ?? row.role,
    isCurrent: row.organization_id === selectedMembership.organization_id,
  }));

  return (
    <ClubProvider
      value={{
        organizationId: selectedMembership.organization_id,
        membershipId: selectedMembership.id,
        role: selectedMembership.role,
      }}
    >
      <div className="flex min-h-svh flex-col">
        <header className="border-b bg-card">
          <div className="mx-auto flex min-h-12 w-full max-w-5xl items-center justify-between px-4">
            <span className="text-base font-semibold tracking-tight">
              SpikeStats
            </span>
            <UserMenu clubs={userClubs} userEmail={user.email ?? ""} />
          </div>
          <div className="mx-auto w-full max-w-5xl px-4">
            <ClubNav />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
      </div>
    </ClubProvider>
  );
}
