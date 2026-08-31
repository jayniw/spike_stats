import * as React from "react";

import { requireRole } from "@/lib/auth/guards";
import { listTeamsWithRoster } from "@/lib/db/teams";
import { TeamsList } from "./teams-list";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const params = await searchParams;
  const orgId = params.org;

  if (!orgId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Equipos</h1>
        <p className="text-muted-foreground">
          No se especificó una organización.
        </p>
      </div>
    );
  }

  const ctx = await requireRole(orgId);
  const canManage = ctx.role === "club_admin" || ctx.role === "coach";

  const teams = await listTeamsWithRoster(orgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipos</h1>
          <p className="text-muted-foreground">
            Gestiona los equipos de tu club.
          </p>
        </div>
      </div>

      <TeamsList
        teams={teams}
        orgId={orgId}
        canManage={canManage}
      />
    </div>
  );
}
