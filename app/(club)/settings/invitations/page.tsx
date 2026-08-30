import * as React from "react";

import { requireRole } from "@/lib/auth/guards";
import { InvitationsManager } from "./invitations-manager";

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const params = await searchParams;
  const orgId = params.org;

  if (!orgId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Invitaciones</h1>
        <p className="text-muted-foreground">
          No se especificó una organización.
        </p>
      </div>
    );
  }

  const ctx = await requireRole(orgId, "club_admin", "coach");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invitaciones</h1>
        <p className="text-muted-foreground">
          Administra las invitaciones pendientes de tu club.
        </p>
      </div>

      <InvitationsManager
        organizationId={orgId}
        userRole={ctx.role}
      />
    </div>
  );
}
