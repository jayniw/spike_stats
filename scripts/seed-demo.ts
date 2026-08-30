import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "./lib/load-env";

type Skill = "serve" | "reception" | "set_pass" | "attack" | "block" | "dig";
type Outcome = "point" | "error" | "rally_continues";
type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";
type Role = "club_admin" | "coach" | "analyst" | "player" | "spectator";

type ActionSeed = {
  playerId: string;
  setNumber: number;
  skill: Skill;
  outcome: Outcome;
};

type ActionRow = ActionSeed & {
  client_action_id: string;
  organization_id: string;
  match_id: string;
  recorded_at: string;
  recorded_offline: boolean;
};

type SimSet = {
  setNumber: number;
  complete: boolean;
  pointsFor: number;
  pointsAgainst: number;
  pointSkills: Skill[];
};

type Plan =
  | { kind: "golden" }
  | { kind: "generated"; status: MatchStatus; shareEnabled: boolean }
  | { kind: "result_only"; scores: Array<[number, number]> };

function makeDb(url: string, serviceKey: string) {
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type Db = ReturnType<typeof makeDb>;

const DEMO_PASSWORD = "demo1234!";
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
const RNG_SEED = 20260823;
const CHUNK_SIZE = 400;
const SEASON_LABEL = "2026-Apertura";
const COMPETITION = "Liga Metropolitana";

const ROLES_DEMO: Role[] = ["club_admin", "coach", "analyst", "player", "spectator"];
const ROLE_EMAIL_PREFIX: Record<Role, string> = {
  club_admin: "admin",
  coach: "coach",
  analyst: "analyst",
  player: "player",
  spectator: "spectator",
};

type PlayerPosition = "setter" | "opposite" | "middle" | "receiver" | "libero";

const PRIMERA_PLAYERS: Array<{ name: string; position: PlayerPosition }> = [
  { name: "Valentina Carrasco", position: "receiver" },
  { name: "Lucía Fernández", position: "receiver" },
  { name: "Martina Salgado", position: "middle" },
  { name: "Camila Herrera", position: "setter" },
  { name: "Sofía Ibáñez", position: "libero" },
  { name: "Renata Vargas", position: "opposite" },
  { name: "Daniela Ochoa", position: "middle" },
  { name: "Paulina Rivas", position: "receiver" },
  { name: "Ximena Beltrán", position: "setter" },
  { name: "Regina Duarte", position: "middle" },
  { name: "Abril Quintana", position: "receiver" },
  { name: "Fernanda Lozano", position: "opposite" },
];

const SUB16_PLAYERS: Array<{ name: string; position: PlayerPosition }> = [
  { name: "Jimena Ortiz", position: "setter" },
  { name: "Renata Campos", position: "receiver" },
  { name: "Alba Delgado", position: "middle" },
  { name: "Ivanna Reyes", position: "opposite" },
  { name: "Catalina Ruiz", position: "libero" },
  { name: "Mariana Silva", position: "receiver" },
  { name: "Julia Navarro", position: "setter" },
  { name: "Elena Guzmán", position: "middle" },
];

const RIO_PLAYERS: Array<{ name: string; position: PlayerPosition }> = [
  { name: "Adriana Fuentes", position: "receiver" },
  { name: "Bianca Molina", position: "setter" },
];

const RIVALS = [
  "Águilas Reforma",
  "Tigres Coyoacán",
  "Lobos Norte",
  "Panteras Azules",
  "Halcones Xalapa",
  "Rojos Peñón",
  "Jaguars CDMX",
  "Zorros UNAM",
  "Toros Neza",
  "Leones Anáhuac",
  "Osos Toluca",
  "Pumas Sur",
];

const GOLDEN_SET_SCORES: Array<{ set_number: number; points_for: number; points_against: number }> = [
  { set_number: 1, points_for: 25, points_against: 20 },
  { set_number: 2, points_for: 25, points_against: 22 },
  { set_number: 3, points_for: 25, points_against: 19 },
];

const GOLDEN_PER_SET: Array<{
  ace: number;
  serveError: number;
  serveContinue: number;
  receptionPerfect: number;
  receptionError: number;
  blockPoint: number;
  attackPoint: number;
  attackError: number;
  attackContinue: number;
}> = [
  { ace: 2, serveError: 3, serveContinue: 10, receptionPerfect: 7, receptionError: 1, blockPoint: 2, attackPoint: 6, attackError: 2, attackContinue: 5 },
  { ace: 2, serveError: 3, serveContinue: 10, receptionPerfect: 7, receptionError: 2, blockPoint: 2, attackPoint: 6, attackError: 3, attackContinue: 5 },
  { ace: 1, serveError: 3, serveContinue: 11, receptionPerfect: 7, receptionError: 1, blockPoint: 2, attackPoint: 6, attackError: 2, attackContinue: 5 },
];

const RESULT_ONLY_SCORES: Array<Array<[number, number]>> = [
  [
    [25, 19],
    [25, 21],
    [25, 17],
  ],
  [
    [25, 23],
    [21, 25],
    [19, 25],
    [18, 25],
  ],
  [
    [25, 21],
    [23, 25],
    [25, 20],
    [22, 25],
    [13, 15],
  ],
];

const FILLER_CYCLE: Array<[Skill, Outcome]> = [
  ["attack", "rally_continues"],
  ["reception", "rally_continues"],
  ["set_pass", "rally_continues"],
  ["dig", "rally_continues"],
  ["serve", "rally_continues"],
  ["attack", "error"],
  ["reception", "error"],
  ["serve", "error"],
  ["set_pass", "error"],
  ["dig", "error"],
  ["block", "rally_continues"],
  ["block", "error"],
];

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function at<T>(items: T[], index: number): T {
  return items[index % items.length] as T;
}

function chunk<T>(items: T[], size: number): T[][] {
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    parts.push(items.slice(i, i + size));
  }
  return parts;
}

function makeShareToken(): string {
  return `${randomUUID().replace(/-/g, "")}${randomUUID().replace(/-/g, "")}`.slice(0, 40);
}

function resolveServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
}

async function insertRows(db: Db, table: string, rows: Array<Record<string, unknown>>): Promise<void> {
  for (const part of chunk(rows, CHUNK_SIZE)) {
    const { error } = await db.from(table).insert(part);
    if (error) throw new Error(`Insert en "${table}" falló: ${error.message}`);
  }
}

async function insertOrganization(db: Db, name: string): Promise<string> {
  const { data, error } = await db.from("organizations").insert({ name }).select("id").single();
  if (error) throw new Error(`No se pudo crear la organización "${name}": ${error.message}`);
  return (data as { id: string }).id;
}

async function createAuthUser(db: Db, email: string): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`No se pudo crear el usuario ${email}: ${error.message}`);
  const id = data?.user?.id;
  if (!id) throw new Error(`El usuario ${email} se creó sin id`);
  return id;
}

async function insertTeam(db: Db, values: { organization_id: string; name: string; category: string }): Promise<string> {
  const { data, error } = await db.from("teams").insert(values).select("id").single();
  if (error) throw new Error(`No se pudo crear el equipo "${values.name}": ${error.message}`);
  return (data as { id: string }).id;
}

async function insertPlayers(
  db: Db,
  teamId: string,
  organizationId: string,
  players: Array<{ name: string; position: PlayerPosition }>,
): Promise<string[]> {
  const rows = players.map((player, index) => ({
    organization_id: organizationId,
    team_id: teamId,
    full_name: player.name,
    number: index + 1,
    position: player.position,
    active: true,
  }));
  await insertRows(db, "players", rows);
  const { data, error } = await db.from("players").select("id, number").eq("team_id", teamId).order("number");
  if (error) throw new Error(`No se pudieron leer las jugadoras del equipo ${teamId}: ${error.message}`);
  return (data as Array<{ id: string }>).map((row) => row.id);
}

async function insertMatch(db: Db, values: Record<string, unknown>): Promise<string> {
  const { data, error } = await db.from("matches").insert(values).select("id").single();
  if (error) throw new Error(`No se pudo crear el partido: ${error.message}`);
  return (data as { id: string }).id;
}

async function setMatchStatus(db: Db, matchId: string, status: MatchStatus): Promise<void> {
  const { error } = await db.from("matches").update({ status }).eq("id", matchId);
  if (error) throw new Error(`No se pudo actualizar el partido ${matchId} a "${status}": ${error.message}`);
}

function toActionRows(seeds: ActionSeed[], organizationId: string, matchId: string, startMs: number): ActionRow[] {
  return seeds.map((seed, index) => ({
    ...seed,
    client_action_id: randomUUID(),
    organization_id: organizationId,
    match_id: matchId,
    recorded_at: new Date(startMs + index * 8_000).toISOString(),
    recorded_offline: false,
  }));
}

function buildGoldenActions(playerIds: string[]): ActionSeed[] {
  const seeds: ActionSeed[] = [];
  let cursor = 0;
  GOLDEN_PER_SET.forEach((spec, setIndex) => {
    const setNumber = setIndex + 1;
    const push = (skill: Skill, outcome: Outcome, count: number) => {
      for (let i = 0; i < count; i += 1) {
        seeds.push({ playerId: at(playerIds, cursor), setNumber, skill, outcome });
        cursor += 1;
      }
    };
    push("serve", "point", spec.ace);
    push("serve", "error", spec.serveError);
    push("serve", "rally_continues", spec.serveContinue);
    push("reception", "rally_continues", spec.receptionPerfect);
    push("reception", "error", spec.receptionError);
    push("block", "point", spec.blockPoint);
    push("attack", "point", spec.attackPoint);
    push("attack", "error", spec.attackError);
    push("attack", "rally_continues", spec.attackContinue);
  });
  return seeds;
}

function pickPointSkill(rng: () => number): Skill {
  const roll = rng();
  if (roll < 0.64) return "attack";
  if (roll < 0.8) return "serve";
  return "block";
}

function simulateFullSet(rng: () => number, setNumber: number): SimSet {
  let pointsFor = 0;
  let pointsAgainst = 0;
  const pointSkills: Skill[] = [];
  while ((pointsFor < 25 && pointsAgainst < 25) || Math.abs(pointsFor - pointsAgainst) < 2) {
    if (pointsFor + pointsAgainst > 120) break;
    if (rng() < 0.54) {
      pointsFor += 1;
      pointSkills.push(pickPointSkill(rng));
    } else {
      pointsAgainst += 1;
    }
  }
  return { setNumber, complete: true, pointsFor, pointsAgainst, pointSkills };
}

function simulateSets(rng: () => number, mode: "finished" | "live"): SimSet[] {
  const sets: SimSet[] = [];
  const rivalWins = mode === "finished" ? Math.floor(rng() * 3) : 1;
  const completeSets = mode === "finished" ? 3 + rivalWins : 1;
  for (let s = 1; s <= completeSets; s += 1) {
    sets.push(simulateFullSet(rng, s));
  }
  if (mode === "live") {
    const pointsFor = 10 + Math.floor(rng() * 9);
    const pointsAgainst = Math.max(4, pointsFor - 3 + Math.floor(rng() * 7));
    const pointSkills: Skill[] = [];
    for (let i = 0; i < pointsFor; i += 1) pointSkills.push(pickPointSkill(rng));
    sets.push({ setNumber: completeSets + 1, complete: false, pointsFor, pointsAgainst, pointSkills });
  }
  return sets;
}

function assembleSeeds(
  rng: () => number,
  playerIds: string[],
  sets: SimSet[],
  fillerTarget: number,
): ActionSeed[] {
  const seeds: ActionSeed[] = [];
  let tick = 0;
  for (const set of sets) {
    for (const skill of set.pointSkills) {
      seeds.push({ playerId: at(playerIds, tick), setNumber: set.setNumber, skill, outcome: "point" });
      tick += 1;
    }
  }
  const fillerCount = Math.max(0, fillerTarget - seeds.length);
  for (let f = 0; f < fillerCount; f += 1) {
    const [skill, outcome] = FILLER_CYCLE[f % FILLER_CYCLE.length] as [Skill, Outcome];
    const set = at(sets, f);
    seeds.push({ playerId: at(playerIds, tick), setNumber: set.setNumber, skill, outcome });
    tick += 1;
  }
  return seeds;
}

async function wipePublicTables(db: Db): Promise<void> {
  // Limpia en orden inverso de dependencias. Las tablas de migraciones aún no
  // aplicadas (p.ej. matches/teams hasta T022+) se omiten sin fallar (PGRST205),
  // para poder usar el seed progresivamente conforme exista cada migración.
  const tables = [
    "match_actions",
    "set_scores",
    "matches",
    "players",
    "teams",
    "invites",
    "memberships",
    "organizations",
  ];
  for (const table of tables) {
    const { error } = await db.from(table).delete().neq("id", ZERO_UUID);
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "PGRST205" || /could not find the table/i.test(error.message)) {
        console.warn(`[AVISO] "${table}" aún no existe (migración pendiente); se omite.`);
        continue;
      }
      throw new Error(`No se pudo limpiar "${table}": ${error.message}`);
    }
  }
}

async function wipeAuthUsers(db: Db): Promise<number> {
  let deleted = 0;
  for (let guard = 0; guard < 100; guard += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(`No se pudo listar usuarios de auth: ${error.message}`);
    if (!data.users || data.users.length === 0) break;
    for (const user of data.users) {
      const { error: deleteError } = await db.auth.admin.deleteUser(user.id);
      if (deleteError) throw new Error(`No se pudo borrar el usuario ${user.id}: ${deleteError.message}`);
      deleted += 1;
    }
  }
  return deleted;
}

function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => row[i]?.length ?? 0)),
  );
  const render = (cells: string[]) =>
    cells.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  ");
  console.log(render(headers));
  for (const row of rows) console.log(render(row));
}

async function main(): Promise<void> {
  loadEnvFile([".env.local", ".env"]);
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
  const serviceKey = resolveServiceRoleKey();
  if (!url || !serviceKey) {
    console.error("[ERROR] Faltan variables de entorno para el seed.");
    console.error("Configura .env.local (copia de .env.local.example) con los datos del");
    console.error("proyecto Supabase hosteado — Dashboard → Project Settings → API:");
    if (!url) {
      console.error("  - NEXT_PUBLIC_SUPABASE_URL      (ej. https://abcd1234.supabase.co)");
    }
    if (!serviceKey) {
      console.error("  - SUPABASE_SERVICE_ROLE_KEY     (bypasea RLS; solo scripts de servidor)");
    }
    process.exit(1);
  }

  const db = makeDb(url, serviceKey);

  console.log(`Limpiando datos previos en ${url} ...`);
  await wipePublicTables(db);
  const wipedUsers = await wipeAuthUsers(db);
  console.log(`Limpieza lista (${wipedUsers} usuarios de auth borrados).`);

  const rng = createRng(RNG_SEED);
  const counts = {
    organizations: 0,
    users: 0,
    memberships: 0,
    teams: 0,
    players: 0,
    matches: 0,
    setScores: 0,
    actions: 0,
  };

  const demoOrgId = await insertOrganization(db, "Club Demo");
  const rioOrgId = await insertOrganization(db, "Club Atlético Río");
  counts.organizations = 2;

  const credentialRows: string[][] = [];

  async function createMember(orgId: string, clubLabel: string, emailDomain: string, roles: Role[]): Promise<Map<Role, string>> {
    const ids = new Map<Role, string>();
    let adminId: string | undefined;
    for (const role of roles) {
      const email = `${ROLE_EMAIL_PREFIX[role]}@${emailDomain}`;
      const userId = await createAuthUser(db, email);
      counts.users += 1;
      if (role === "club_admin") adminId = userId;
      ids.set(role, userId);
      credentialRows.push([clubLabel, role, email, DEMO_PASSWORD]);
    }
    for (const role of roles) {
      const userId = ids.get(role);
      if (!userId || !adminId) continue;
      const { error } = await db.from("memberships").insert({
        organization_id: orgId,
        user_id: userId,
        role,
        status: "active",
        invited_by: adminId,
      });
      if (error) throw new Error(`No se pudo crear la membresía ${role}: ${error.message}`);
      counts.memberships += 1;
    }
    return ids;
  }

  const demoMembers = await createMember(demoOrgId, "Club Demo", "demo.club", ROLES_DEMO);
  const rioMembers = await createMember(rioOrgId, "Club Atlético Río", "rio.club", ["club_admin"]);
  const demoAdminId = demoMembers.get("club_admin");
  const rioAdminId = rioMembers.get("club_admin");
  if (!demoAdminId || !rioAdminId) throw new Error("Faltan administradores para crear partidos.");

  const primeraTeamId = await insertTeam(db, { organization_id: demoOrgId, name: "Primera", category: "Primera" });
  const sub16TeamId = await insertTeam(db, { organization_id: demoOrgId, name: "Sub-16", category: "Sub-16" });
  const rioTeamId = await insertTeam(db, { organization_id: rioOrgId, name: "Primera", category: "Mayor" });
  counts.teams = 3;

  const primeraPlayerIds = await insertPlayers(db, primeraTeamId, demoOrgId, PRIMERA_PLAYERS);
  await insertPlayers(db, sub16TeamId, demoOrgId, SUB16_PLAYERS);
  await insertPlayers(db, rioTeamId, rioOrgId, RIO_PLAYERS);
  counts.players = PRIMERA_PLAYERS.length + SUB16_PLAYERS.length + RIO_PLAYERS.length;

  const statusBag: MatchStatus[] = [
    "finished", "finished", "finished", "finished", "finished",
    "finished", "finished", "finished", "finished", "finished",
    "live", "live",
    "scheduled", "scheduled", "scheduled",
    "cancelled",
  ];
  for (let i = statusBag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = statusBag[i] as MatchStatus;
    statusBag[i] = statusBag[j] as MatchStatus;
    statusBag[j] = tmp;
  }
  const revokedSlot = statusBag.lastIndexOf("finished");

  const plans: Plan[] = [{ kind: "golden" }];
  statusBag.forEach((status, slot) => {
    plans.push({ kind: "generated", status, shareEnabled: slot !== revokedSlot });
  });
  plans.push(
    { kind: "result_only", scores: RESULT_ONLY_SCORES[0] as Array<[number, number]> },
    { kind: "result_only", scores: RESULT_ONLY_SCORES[1] as Array<[number, number]> },
    { kind: "result_only", scores: RESULT_ONLY_SCORES[2] as Array<[number, number]> },
  );

  const seasonStartMs = Date.UTC(2026, 1, 7);
  const goldenBaseMs = Date.UTC(2026, 2, 7, 16, 0, 0);
  let goldenMatchId: string | undefined;
  let liveShareUrl: string | undefined;

  for (let i = 0; i < plans.length; i += 1) {
    const plan = plans[i] as Plan;
    const playedOnMs = plan.kind === "golden" ? goldenBaseMs : seasonStartMs + (i + 1) * 7 * 86_400_000;
    const playedOn = new Date(playedOnMs).toISOString().slice(0, 10);
    const rival = plan.kind === "golden" ? (RIVALS[0] as string) : at(RIVALS, i * 5 + Math.floor(rng() * 3));
    const isHome = plan.kind === "golden" ? true : rng() < 0.5;
    const shareToken = makeShareToken();
    const shareEnabled = plan.kind === "generated" ? plan.shareEnabled : true;

    const baseValues: Record<string, unknown> = {
      organization_id: demoOrgId,
      team_id: primeraTeamId,
      rival,
      played_on: playedOn,
      competition: COMPETITION,
      season_label: SEASON_LABEL,
      is_home: isHome,
      identity_mode: "dorsal_only",
      share_enabled: shareEnabled,
      share_token: shareToken,
      created_by: demoAdminId,
    };

    if (plan.kind === "golden") {
      const matchId = await insertMatch(db, { ...baseValues, status: "live" });
      counts.matches += 1;
      const seeds = buildGoldenActions(primeraPlayerIds);
      const rows = toActionRows(seeds, demoOrgId, matchId, goldenBaseMs);
      await insertRows(db, "match_actions", rows);
      counts.actions += rows.length;
      await insertRows(db, "set_scores", GOLDEN_SET_SCORES.map((s) => ({ match_id: matchId, ...s })));
      counts.setScores += GOLDEN_SET_SCORES.length;
      await setMatchStatus(db, matchId, "finished");
      goldenMatchId = matchId;
      continue;
    }

    if (plan.kind === "result_only") {
      const matchId = await insertMatch(db, { ...baseValues, status: "finished" });
      counts.matches += 1;
      const scoreRows = plan.scores.map(([pointsFor, pointsAgainst], setIndex) => ({
        match_id: matchId,
        set_number: setIndex + 1,
        points_for: pointsFor,
        points_against: pointsAgainst,
      }));
      await insertRows(db, "set_scores", scoreRows);
      counts.setScores += scoreRows.length;
      continue;
    }

    if (plan.status === "finished" || plan.status === "live") {
      const matchId = await insertMatch(db, { ...baseValues, status: "live" });
      counts.matches += 1;
      const sets = simulateSets(rng, plan.status === "finished" ? "finished" : "live");
      const fillerTarget = plan.status === "finished" ? 180 + Math.floor(rng() * 220) : 40 + Math.floor(rng() * 40);
      const seeds = assembleSeeds(rng, primeraPlayerIds, sets, fillerTarget);
      const rows = toActionRows(seeds, demoOrgId, matchId, playedOnMs + 16 * 3_600_000);
      await insertRows(db, "match_actions", rows);
      counts.actions += rows.length;
      const scoreRows = sets
        .filter((set) => set.complete)
        .map((set) => ({
          match_id: matchId,
          set_number: set.setNumber,
          points_for: set.pointsFor,
          points_against: set.pointsAgainst,
        }));
      await insertRows(db, "set_scores", scoreRows);
      counts.setScores += scoreRows.length;
      if (plan.status === "finished") {
        await setMatchStatus(db, matchId, "finished");
      } else if (!liveShareUrl) {
        liveShareUrl = `/m/${shareToken}`;
      }
      continue;
    }

    await insertMatch(db, { ...baseValues, status: plan.status });
    counts.matches += 1;
  }

  const rioMatchToken = makeShareToken();
  const rioMatchId = await insertMatch(db, {
    organization_id: rioOrgId,
    team_id: rioTeamId,
    rival: "Club Olympo",
    played_on: "2026-04-11",
    competition: "Liga Plata",
    season_label: SEASON_LABEL,
    is_home: true,
    status: "finished",
    identity_mode: "dorsal_only",
    share_enabled: true,
    share_token: rioMatchToken,
    created_by: rioAdminId,
  });
  counts.matches += 1;
  const rioScores: Array<[number, number]> = [
    [25, 20],
    [23, 25],
    [25, 18],
    [25, 21],
  ];
  await insertRows(
    db,
    "set_scores",
    rioScores.map(([pointsFor, pointsAgainst], setIndex) => ({
      match_id: rioMatchId,
      set_number: setIndex + 1,
      points_for: pointsFor,
      points_against: pointsAgainst,
    })),
  );
  counts.setScores += rioScores.length;

  console.log("");
  console.log("== SpikeStats · datos demo cargados ==");
  console.log("");
  console.log("Credenciales (contraseña única para todas):");
  printTable(["CLUB", "ROL", "EMAIL", "CONTRASEÑA"], credentialRows);
  console.log("");
  console.log("Resumen:");
  printTable(
    ["ENTIDAD", "CANTIDAD"],
    [
      ["Organizaciones", String(counts.organizations)],
      ["Usuarios auth", String(counts.users)],
      ["Membresías", String(counts.memberships)],
      ["Equipos", String(counts.teams)],
      ["Jugadoras", String(counts.players)],
      ["Partidos", String(counts.matches)],
      ["Marcadores por set", String(counts.setScores)],
      ["Acciones registradas", String(counts.actions)],
    ],
  );
  console.log("");
  console.log(`Partido dorado (fixture de métricas, id): ${goldenMatchId ?? "no creado"}`);
  console.log(`Partido en vivo, link público: ${liveShareUrl ?? "no creado"}`);
  console.log(`Partido Río (aislamiento), id: ${rioMatchId}`);
  console.log(`Instancia Supabase: ${url}`);
}

// Sin `await` de nivel superior: tsx trata los .ts como CommonJS y no soporta
// top-level await. exitCode (no exit) evita el assertion de libuv en Windows.
void main().catch((error: unknown) => {
  console.error("[ERROR] Seed demo falló:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
