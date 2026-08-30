import * as React from "react";

import { requireRole } from "@/lib/auth/guards";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipos</h1>
        <p className="text-muted-foreground">
          Gestiona los equipos de tu club.
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Próximamente: crear equipos y gestionar jugadoras.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu rol actual: <span className="font-medium">{ctx.role}</span>
        </p>
      </div>
    </div>
  );
}
