import * as React from "react";

import { createServerClient } from "@/lib/db/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AcceptInviteButton } from "./accept-button";

type InviteRow = {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  expires_at: string;
  accepted_at: string | null;
};

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const client = await createServerClient();

  // Look up the invite by token
  const { data: invite, error } = await client
    .from("invites" as never)
    .select("id, organization_id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .single();

  if (error || !invite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invitación no encontrada</CardTitle>
          <CardDescription>
            Este enlace de invitación no es válido o ya fue utilizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/login">Ir al inicio de sesión</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const row = invite as InviteRow;

  // Check if already accepted
  if (row.accepted_at) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invitación ya aceptada</CardTitle>
          <CardDescription>
            Esta invitación ya fue aceptada. Si necesitas acceder, inicia sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/login">Ir al inicio de sesión</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if expired
  if (new Date(row.expires_at) < new Date()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Invitación expirada</CardTitle>
          <CardDescription>
            Esta invitación expiró. Solicita una nueva al administrador del club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/login">Ir al inicio de sesión</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const ROLE_LABELS: Record<string, string> = {
    club_admin: "Administrador",
    coach: "Entrenador",
    analyst: "Analista",
    player: "Jugadora",
    spectator: "Espectador",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Aceptar invitación</CardTitle>
        <CardDescription>
          Has sido invitado a unirte a un club en SpikeStats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-4">
          <p className="text-sm">
            <span className="font-medium">Correo:</span> {row.email}
          </p>
          <p className="text-sm">
            <span className="font-medium">Rol:</span> {ROLE_LABELS[row.role] ?? row.role}
          </p>
        </div>

        <AcceptInviteButton
          token={token}
          organizationId={row.organization_id}
          role={row.role}
        />
      </CardContent>
    </Card>
  );
}
