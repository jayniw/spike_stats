import * as React from "react";
import Link from "next/link";

import { requireRole } from "@/lib/auth/guards";
import { getTeam, listRoster } from "@/lib/db/teams";
import { RosterEditor } from "./roster-editor";

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const { teamId } = await params;
  const { org: orgId } = await searchParams;

  if (!orgId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Equipo</h1>
        <p className="text-muted-foreground">
          No se especificó una organización.
        </p>
      </div>
    );
  }

  const ctx = await requireRole(orgId);
  const canManage = ctx.role === "club_admin" || ctx.role === "coach";

  const team = await getTeam(orgId, teamId);
  if (!team) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Equipo no encontrado</h1>
        <Link href={`/teams?org=${orgId}`} className="text-primary hover:underline">
          Volver a equipos
        </Link>
      </div>
    );
  }

  const players = await listRoster(orgId, teamId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/teams?org=${orgId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          &larr; Equipos
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">{team.category}</p>
        </div>
      </div>

      <RosterEditor
        teamId={teamId}
        orgId={orgId}
        players={players}
        canManage={canManage}
      />
    </div>
  );
}
