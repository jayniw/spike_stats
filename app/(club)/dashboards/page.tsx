import * as React from "react";

import { requireRole } from "@/lib/auth/guards";

export default async function DashboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const params = await searchParams;
  const orgId = params.org;

  if (!orgId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Tableros</h1>
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
        <h1 className="text-2xl font-bold">Tableros</h1>
        <p className="text-muted-foreground">
          Analiza el rendimiento de tu equipo y jugadoras.
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          Próximamente: dashboards de equipo y jugadora.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu rol actual: <span className="font-medium">{ctx.role}</span>
        </p>
      </div>
    </div>
  );
}
