import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect } from "vitest";

export type MembershipRole = "club_admin" | "coach" | "analyst" | "player" | "spectator";

export type OrgSlot = "a" | "b";

export const ROLES: readonly MembershipRole[] = [
  "club_admin",
  "coach",
  "analyst",
  "player",
  "spectator",
];

export const FIXTURE_PASSWORD = "rlspass123!";

export type FixtureUser = {
  id: string;
  email: string;
  password: string;
};

export type OrgFixtures = {
  id: string;
  name: string;
  letter: OrgSlot;
  users: Record<MembershipRole, FixtureUser>;
};

export type RoleFixtures = {
  runId: string;
  orgA: OrgFixtures;
  orgB: OrgFixtures;
  cleanup(): Promise<void>;
};

export type DualMembershipUser = FixtureUser & {
  memberships: {
    orgAId: string;
    orgBId: string;
    orgARole: Extract<MembershipRole, "coach">;
    orgBRole: Extract<MembershipRole, "spectator">;
  };
};

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
  anonKey: string;
};

type CleanupRegistry = {
  orgIds: string[];
  userIds: string[];
  membershipIds: string[];
  inviteIds: string[];
};

type MinimalError = { message: string };

type QueryOutcome = {
  data: Array<Record<string, unknown>> | unknown[] | null;
  error: MinimalError | null;
};

const registries = new WeakMap<object, CleanupRegistry>();

let cachedConfig: SupabaseConfig | null = null;
let cachedAdminClient: SupabaseClient | null = null;
let cachedAnonClient: SupabaseClient | null = null;
const userClients = new Map<string, SupabaseClient>();

function resolveSupabaseUrl(): string {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
  if (!url) {
    throw new Error(
      "[RLS harness] Falta NEXT_PUBLIC_SUPABASE_URL.\n" +
        "Configura .env.local con los datos del proyecto Supabase hosteado:\n" +
        "  Dashboard → Project Settings → API\n" +
        "  (https://supabase.com/dashboard/project/<project-ref>/settings/api)",
    );
  }
  return url;
}

export function resolveSupabaseConfig(): SupabaseConfig {
  if (cachedConfig) return cachedConfig;
  const url = resolveSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  if (!serviceRoleKey) {
    throw new Error(
      "[RLS harness] Falta SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Los fixtures necesitan crear usuarios de auth (admin API).\n" +
        "Cópiala del dashboard del proyecto hosteado:\n" +
        "  Project Settings → API → service_role / secret key",
    );
  }
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";
  if (!anonKey) {
    throw new Error(
      "[RLS harness] Falta NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
        "Cópiala del dashboard del proyecto hosteado:\n" +
        "  Project Settings → API → anon public / publishable key",
    );
  }
  cachedConfig = { url, serviceRoleKey, anonKey };
  return cachedConfig;
}

export function getSupabaseUrl(): string {
  if (cachedConfig) return cachedConfig.url;
  return resolveSupabaseUrl();
}

export function getAdminClient(): SupabaseClient {
  const { url, serviceRoleKey } = resolveSupabaseConfig();
  cachedAdminClient ??= createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdminClient;
}

export function getAnonClient(): SupabaseClient {
  const { url, anonKey } = resolveSupabaseConfig();
  cachedAnonClient ??= createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAnonClient;
}

export async function pingSupabase(timeoutMs = 3_000): Promise<boolean> {
  const url = resolveSupabaseUrl();
  try {
    const response = await fetch(`${url}/rest/v1/`, { signal: AbortSignal.timeout(timeoutMs) });
    return response.status < 500;
  } catch {
    return false;
  }
}

export async function asUser(email: string, password: string = FIXTURE_PASSWORD): Promise<SupabaseClient> {
  const cacheKey = `${email}:${password}`;
  const cached = userClients.get(cacheKey);
  if (cached) return cached;
  const { url, anonKey } = resolveSupabaseConfig();
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`No se pudo iniciar sesión como ${email}: ${error.message}`);
  userClients.set(cacheKey, client);
  return client;
}

export function fixtureEmail(fixtures: RoleFixtures, slot: OrgSlot, role: MembershipRole): string {
  const org = slot === "a" ? fixtures.orgA : fixtures.orgB;
  return org.users[role].email;
}

export function asFixtureUser(
  fixtures: RoleFixtures,
  slot: OrgSlot,
  role: MembershipRole,
): Promise<SupabaseClient> {
  return asUser(fixtureEmail(fixtures, slot, role));
}

async function createOrganization(admin: SupabaseClient, name: string): Promise<string> {
  const { data, error } = await admin.from("organizations").insert({ name }).select("id").single();
  if (error) throw new Error(`No se pudo crear la organización "${name}": ${error.message}`);
  return (data as { id: string }).id;
}

async function createAuthUser(admin: SupabaseClient, email: string, password: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`No se pudo crear el usuario ${email}: ${error.message}`);
  const id = data.user?.id;
  if (!id) throw new Error(`El usuario ${email} se creó sin id`);
  return id;
}

async function insertActiveMembership(
  admin: SupabaseClient,
  organizationId: string,
  userId: string,
  role: MembershipRole,
  invitedBy?: string,
): Promise<string> {
  const { data, error } = await admin
    .from("memberships")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role,
      status: "active",
      invited_by: invitedBy ?? null,
    })
    .select("id")
    .single();
  if (error) {
    throw new Error(`No se pudo crear la membresía "${role}" en la organización ${organizationId}: ${error.message}`);
  }
  return (data as { id: string }).id;
}

async function forgetStep(step: () => PromiseLike<{ error: MinimalError | null }>, label: string): Promise<void> {
  try {
    const { error } = await step();
    if (error) console.warn(`[RLS harness] Limpieza · ${label}: ${error.message}`);
  } catch (cause) {
    console.warn(`[RLS harness] Limpieza · ${label}:`, cause instanceof Error ? cause.message : cause);
  }
}

async function cleanupRegistry(registry: CleanupRegistry): Promise<void> {
  const admin = getAdminClient();
  const orgIds = [...registry.orgIds];
  if (orgIds.length > 0) {
    await forgetStep(() => admin.from("memberships").delete().in("organization_id", orgIds), "borrar memberships");
    await forgetStep(() => admin.from("invites").delete().in("organization_id", orgIds), "borrar invites");
    await forgetStep(() => admin.from("organizations").delete().in("id", orgIds), "borrar organizations");
  }
  for (const userId of [...registry.userIds]) {
    await forgetStep(() => admin.auth.admin.deleteUser(userId), `borrar usuario ${userId}`);
  }
  registry.orgIds.length = 0;
  registry.userIds.length = 0;
  registry.membershipIds.length = 0;
  registry.inviteIds.length = 0;
}

export async function createRoleFixtures(): Promise<RoleFixtures> {
  const admin = getAdminClient();
  const runId = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const registry: CleanupRegistry = { orgIds: [], userIds: [], membershipIds: [], inviteIds: [] };

  const buildOrg = async (letter: OrgSlot, name: string): Promise<OrgFixtures> => {
    const id = await createOrganization(admin, name);
    registry.orgIds.push(id);
    const users = {} as Record<MembershipRole, FixtureUser>;
    await Promise.all(
      ROLES.map(async (role) => {
        const email = `rls-${letter}-${role}-${runId}@t.local`;
        const userId = await createAuthUser(admin, email, FIXTURE_PASSWORD);
        registry.userIds.push(userId);
        users[role] = { id: userId, email, password: FIXTURE_PASSWORD };
      }),
    );
    await Promise.all(
      ROLES.map(async (role) => {
        const membershipId = await insertActiveMembership(admin, id, users[role].id, role, users.club_admin.id);
        registry.membershipIds.push(membershipId);
      }),
    );
    return { id, name, letter, users };
  };

  const [orgA, orgB] = await Promise.all([buildOrg("a", "RLS Test Club A"), buildOrg("b", "RLS Test Club B")]);

  const fixtures: RoleFixtures = {
    runId,
    orgA,
    orgB,
    cleanup: () => cleanupRegistry(registry),
  };
  registries.set(fixtures, registry);
  return fixtures;
}

export function trackForCleanup(
  fixtures: RoleFixtures,
  items: { orgId?: string; userId?: string; membershipId?: string; inviteId?: string },
): void {
  const registry = registries.get(fixtures);
  if (!registry) {
    throw new Error("[RLS harness] trackForCleanup requiere los fixtures devueltos por createRoleFixtures.");
  }
  if (items.orgId) registry.orgIds.push(items.orgId);
  if (items.userId) registry.userIds.push(items.userId);
  if (items.membershipId) registry.membershipIds.push(items.membershipId);
  if (items.inviteId) registry.inviteIds.push(items.inviteId);
}

export async function dualMembershipUser(fixtures: RoleFixtures): Promise<DualMembershipUser> {
  const admin = getAdminClient();
  const registry = registries.get(fixtures);
  if (!registry) {
    throw new Error("[RLS harness] dualMembershipUser requiere los fixtures devueltos por createRoleFixtures.");
  }
  const email = `rls-dual-${fixtures.runId}@t.local`;
  const userId = await createAuthUser(admin, email, FIXTURE_PASSWORD);
  registry.userIds.push(userId);
  const [orgAMembershipId, orgBMembershipId] = await Promise.all([
    insertActiveMembership(admin, fixtures.orgA.id, userId, "coach", fixtures.orgA.users.club_admin.id),
    insertActiveMembership(admin, fixtures.orgB.id, userId, "spectator", fixtures.orgB.users.club_admin.id),
  ]);
  registry.membershipIds.push(orgAMembershipId, orgBMembershipId);
  return {
    id: userId,
    email,
    password: FIXTURE_PASSWORD,
    memberships: {
      orgAId: fixtures.orgA.id,
      orgBId: fixtures.orgB.id,
      orgARole: "coach",
      orgBRole: "spectator",
    },
  };
}

export function expectDenied(result: QueryOutcome, context?: string): void {
  const label = context ? `${context}: debía ser DENEGADO por RLS` : "la operación debía ser denegada por RLS";
  const denied = result.error !== null || result.data === null || result.data.length === 0;
  const detail = result.error ? ` (detalle: ${result.error.message})` : "";
  expect(denied, `${label}${detail}`).toBe(true);
}

export function expectAffected(result: QueryOutcome, count: number, context?: string): void {
  const label = context ? `${context}: resultado inesperado` : "resultado inesperado";
  expect(result.error?.message ?? null, `${label}: la operación falló`).toBeNull();
  expect((result.data ?? []).length, `${label}: cantidad de filas afectadas`).toBe(count);
}
