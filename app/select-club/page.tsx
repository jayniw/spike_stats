import * as React from "react";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/db/client";
import { ClubSelector } from "./club-selector";

const ROLE_LABELS: Record<string, string> = {
  club_admin: "Administrador",
  coach: "Entrenador",
  analyst: "Analista",
  player: "Jugadora",
  spectator: "Espectador",
};

export default async function SelectClubPage() {
  const client = await createServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await client
    .from("memberships" as never)
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (!memberships || (memberships as unknown[]).length === 0) {
    redirect("/onboarding/new-club");
  }

  const rows = memberships as Array<{
    organization_id: string;
    role: string;
    organizations: { name: string } | null;
  }>;

  // If only one club, redirect directly
  if (rows.length === 1) {
    const firstRow = rows[0];
    if (firstRow) {
      redirect(`/teams?org=${firstRow.organization_id}`);
    }
  }

  const clubs = rows.map((row) => ({
    organizationId: row.organization_id,
    clubName: row.organizations?.name ?? "Club sin nombre",
    role: row.role,
    roleLabel: ROLE_LABELS[row.role] ?? row.role,
  }));

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Selecciona un club</h1>
          <p className="text-muted-foreground">
            Tienes acceso a múltiples clubes. Elige uno para continuar.
          </p>
        </div>

        <ClubSelector clubs={clubs} />
      </div>
    </main>
  );
}
