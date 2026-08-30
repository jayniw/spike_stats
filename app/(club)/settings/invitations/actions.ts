"use server";

import { randomBytes } from "node:crypto";

import { createServerClient } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/guards";
import { inviteEmailSchema } from "@/lib/validation/core";
import type { Role } from "@/lib/validation/core";

type ActionResult = {
  error?: string;
  success?: boolean;
  inviteToken?: string;
};

export async function createInviteAction(
  organizationId: string,
  email: string,
  role: Role,
): Promise<ActionResult> {
  // Admin and coach can invite, but coach can only invite low roles
  const ctx = await requireRole(organizationId, "club_admin", "coach");

  // Validate email
  const parsed = inviteEmailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: "Correo electrónico inválido." };
  }

  // Coach role-scoping: can only invite analyst, player, spectator
  if (ctx.role === "coach" && !["analyst", "player", "spectator"].includes(role)) {
    return { error: "Como entrenador, solo puedes invitar a analistas, jugadoras o espectadores." };
  }

  const client = await createServerClient();

  // Check for existing active invite for this email in this org
  const { data: existing } = await client
    .from("invites" as never)
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email", parsed.data)
    .is("accepted_at", null)
    .limit(1);

  if (existing && (existing as unknown[]).length > 0) {
    return { error: "Ya existe una invitación pendiente para este correo." };
  }

  // Generate token
  const token = randomBytes(32).toString("base64url");

  const { error } = await client.from("invites" as never).insert({
    organization_id: organizationId,
    email: parsed.data,
    role,
    token,
  } as never);

  if (error) {
    return { error: `No se pudo crear la invitación: ${error.message}` };
  }

  return { success: true, inviteToken: token };
}

export async function cancelInviteAction(
  organizationId: string,
  inviteId: string,
): Promise<ActionResult> {
  await requireRole(organizationId, "club_admin", "coach");

  const client = await createServerClient();

  const { error } = await client
    .from("invites" as never)
    .delete()
    .eq("id", inviteId)
    .eq("organization_id", organizationId);

  if (error) {
    return { error: `No se pudo cancelar la invitación: ${error.message}` };
  }

  return { success: true };
}
