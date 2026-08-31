import { createServerClient } from "./client";

export type TeamRow = {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  archived_at: string | null;
  created_at: string;
};

export type PlayerRow = {
  id: string;
  organization_id: string;
  team_id: string;
  full_name: string;
  number: number;
  position: string;
  active: boolean;
  created_at: string;
};

export type TeamWithRoster = TeamRow & {
  players: PlayerRow[];
};

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export async function listTeams(orgId: string): Promise<TeamRow[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("teams" as never)
    .select("*")
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .order("name");
  if (error) throw new Error(`Error listando equipos: ${error.message}`);
  return (data ?? []) as TeamRow[];
}

export async function listTeamsWithRoster(orgId: string): Promise<TeamWithRoster[]> {
  const client = await createServerClient();
  const { data: teams, error: teamErr } = await client
    .from("teams" as never)
    .select("*")
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .order("name");
  if (teamErr) throw new Error(`Error listando equipos: ${teamErr.message}`);

  const { data: players, error: playerErr } = await client
    .from("players" as never)
    .select("*")
    .eq("organization_id", orgId)
    .order("number");
  if (playerErr) throw new Error(`Error listando jugadores: ${playerErr.message}`);

  const playersByTeam = new Map<string, PlayerRow[]>();
  for (const p of (players ?? []) as PlayerRow[]) {
    const list = playersByTeam.get(p.team_id) ?? [];
    list.push(p);
    playersByTeam.set(p.team_id, list);
  }

  return ((teams ?? []) as TeamRow[]).map((t) => ({
    ...t,
    players: playersByTeam.get(t.id) ?? [],
  }));
}

export async function getTeam(orgId: string, teamId: string): Promise<TeamRow | null> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("teams" as never)
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", teamId)
    .single();
  if (error) return null;
  return (data as TeamRow) ?? null;
}

export async function createTeam(
  orgId: string,
  name: string,
  category: string,
): Promise<TeamRow> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("teams" as never)
    .insert({ organization_id: orgId, name, category } as never)
    .select("*")
    .single();
  if (error) throw new Error(`Error creando equipo: ${error.message}`);
  return data as TeamRow;
}

export async function updateTeam(
  orgId: string,
  teamId: string,
  patch: { name?: string; category?: string },
): Promise<TeamRow> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("teams" as never)
    .update(patch as never)
    .eq("organization_id", orgId)
    .eq("id", teamId)
    .select("*")
    .single();
  if (error) throw new Error(`Error actualizando equipo: ${error.message}`);
  return data as TeamRow;
}

export async function archiveTeam(orgId: string, teamId: string): Promise<void> {
  const client = await createServerClient();
  const { error } = await client
    .from("teams" as never)
    .update({ archived_at: new Date().toISOString() } as never)
    .eq("organization_id", orgId)
    .eq("id", teamId);
  if (error) throw new Error(`Error archivando equipo: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export async function listRoster(orgId: string, teamId: string): Promise<PlayerRow[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("players" as never)
    .select("*")
    .eq("organization_id", orgId)
    .eq("team_id", teamId)
    .order("number");
  if (error) throw new Error(`Error listando roster: ${error.message}`);
  return (data ?? []) as PlayerRow[];
}

export async function createPlayer(
  orgId: string,
  teamId: string,
  fullName: string,
  number: number,
  position: string,
): Promise<PlayerRow> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("players" as never)
    .insert({
      organization_id: orgId,
      team_id: teamId,
      full_name: fullName,
      number,
      position,
    } as never)
    .select("*")
    .single();
  if (error) {
    if (error.message.includes("idx_players_active_dorsal")) {
      throw new Error("Ya existe una jugador con ese dorsal en este equipo");
    }
    throw new Error(`Error creando jugador: ${error.message}`);
  }
  return data as PlayerRow;
}

export async function updatePlayer(
  orgId: string,
  playerId: string,
  patch: { full_name?: string; number?: number; position?: string },
): Promise<PlayerRow> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("players" as never)
    .update(patch as never)
    .eq("organization_id", orgId)
    .eq("id", playerId)
    .select("*")
    .single();
  if (error) {
    if (error.message.includes("idx_players_active_dorsal")) {
      throw new Error("Ya existe una jugador con ese dorsal en este equipo");
    }
    throw new Error(`Error actualizando jugador: ${error.message}`);
  }
  return data as PlayerRow;
}

export async function deactivatePlayer(orgId: string, playerId: string): Promise<void> {
  const client = await createServerClient();
  const { error } = await client
    .from("players" as never)
    .update({ active: false } as never)
    .eq("organization_id", orgId)
    .eq("id", playerId);
  if (error) throw new Error(`Error desactivando jugador: ${error.message}`);
}

export async function reactivatePlayer(orgId: string, playerId: string): Promise<void> {
  const client = await createServerClient();
  const { data: player, error: fetchErr } = await client
    .from("players" as never)
    .select("number, team_id")
    .eq("organization_id", orgId)
    .eq("id", playerId)
    .single();
  if (fetchErr || !player) throw new Error("Jugador no encontrado");

  const { data: conflict } = await client
    .from("players" as never)
    .select("id")
    .eq("organization_id", orgId)
    .eq("team_id", (player as { team_id: string }).team_id)
    .eq("number", (player as { number: number }).number)
    .eq("active", true)
    .neq("id", playerId)
    .limit(1);

  if (conflict && conflict.length > 0) {
    throw new Error("No se puede reactivar: ya hay otra jugador activo con ese dorsal");
  }

  const { error } = await client
    .from("players" as never)
    .update({ active: true } as never)
    .eq("organization_id", orgId)
    .eq("id", playerId);
  if (error) throw new Error(`Error reactivando jugador: ${error.message}`);
}
