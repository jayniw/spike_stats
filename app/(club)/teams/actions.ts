"use server";

import { requireRole } from "@/lib/auth/guards";
import {
  createTeam as dbCreateTeam,
  archiveTeam as dbArchiveTeam,
  createPlayer as dbCreatePlayer,
  updatePlayer as dbUpdatePlayer,
  deactivatePlayer as dbDeactivatePlayer,
  reactivatePlayer as dbReactivatePlayer,
} from "@/lib/db/teams";
import {
  createTeamSchema,
  createPlayerSchema,
  updatePlayerSchema,
} from "@/lib/validation/players";

type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function createTeamAction(
  orgId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole(orgId, "club_admin", "coach");

  const parsed = createTeamSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { error: msg };
  }

  try {
    await dbCreateTeam(orgId, parsed.data.name, parsed.data.category);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }

  return { success: true };
}

export async function archiveTeamAction(
  orgId: string,
  teamId: string,
): Promise<ActionResult> {
  await requireRole(orgId, "club_admin", "coach");

  try {
    await dbArchiveTeam(orgId, teamId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }

  return { success: true };
}

export async function addPlayerAction(
  orgId: string,
  teamId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole(orgId, "club_admin", "coach");

  const parsed = createPlayerSchema.safeParse({
    team_id: teamId,
    full_name: formData.get("full_name"),
    number: Number(formData.get("number")),
    position: formData.get("position"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { error: msg };
  }

  try {
    await dbCreatePlayer(
      orgId,
      teamId,
      parsed.data.full_name,
      parsed.data.number,
      parsed.data.position,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }

  return { success: true };
}

export async function updatePlayerAction(
  orgId: string,
  playerId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireRole(orgId, "club_admin", "coach");

  const patch: { full_name?: string; number?: number; position?: string } = {};
  const fullName = formData.get("full_name");
  const number = formData.get("number");
  const position = formData.get("position");

  if (fullName !== null) patch.full_name = String(fullName);
  if (number !== null) patch.number = Number(number);
  if (position !== null) patch.position = String(position);

  const parsed = updatePlayerSchema.safeParse(patch);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { error: msg };
  }

  try {
    await dbUpdatePlayer(orgId, playerId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }

  return { success: true };
}

export async function deactivatePlayerAction(
  orgId: string,
  playerId: string,
): Promise<ActionResult> {
  await requireRole(orgId, "club_admin", "coach");

  try {
    await dbDeactivatePlayer(orgId, playerId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }

  return { success: true };
}

export async function reactivatePlayerAction(
  orgId: string,
  playerId: string,
): Promise<ActionResult> {
  await requireRole(orgId, "club_admin", "coach");

  try {
    await dbReactivatePlayer(orgId, playerId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }

  return { success: true };
}
