import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ROLES,
  asFixtureUser,
  asUser,
  createRoleFixtures,
  dualMembershipUser,
  expectAffected,
  expectDenied,
  getAdminClient,
  getAnonClient,
  getSupabaseUrl,
  pingSupabase,
  trackForCleanup,
  type DualMembershipUser,
  type MembershipRole,
  type OrgSlot,
  type RoleFixtures,
} from "./rls-harness";

const ORG_A_NAME = "RLS Test Club A";
const ORG_B_NAME = "RLS Test Club B";
const NON_ADMIN_ROLES: MembershipRole[] = ["coach", "analyst", "player", "spectator"];
const LOW_INVITE_ROLES = ["analyst", "player", "spectator"] as const;

let fixtures!: RoleFixtures;
let admin!: SupabaseClient;
let dual!: DualMembershipUser;
let orgBInviteId!: string;

beforeAll(async () => {
  const disponible = await pingSupabase();
  if (!disponible) {
    throw new Error(
      `Supabase no responde en ${getSupabaseUrl()} — verifica NEXT_PUBLIC_SUPABASE_URL en .env.local ` +
        `(proyecto hosteado activo; el free tier pausa proyectos tras ~1 semana de inactividad)`,
    );
  }
  admin = getAdminClient();
  fixtures = await createRoleFixtures();
  dual = await dualMembershipUser(fixtures);
  const seededInvite = await admin
    .from("invites")
    .insert({
      organization_id: fixtures.orgB.id,
      email: `rls-cross-${fixtures.runId}@t.local`,
      role: "spectator",
      token: `tok-cross-${randomUUID()}`,
    })
    .select("id")
    .single();
  if (seededInvite.error) {
    throw new Error(`No se pudo preparar la invitación de orgB para pruebas cruzadas: ${seededInvite.error.message}`);
  }
  orgBInviteId = (seededInvite.data as { id: string }).id;
}, 30_000);

afterAll(async () => {
  if (fixtures) await fixtures.cleanup();
});

function user(slot: OrgSlot, role: MembershipRole) {
  const org = slot === "a" ? fixtures.orgA : fixtures.orgB;
  return org.users[role];
}

async function membershipIdByUser(organizationId: string, userId: string): Promise<string> {
  const { data, error } = await admin
    .from("memberships")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .single();
  if (error) throw new Error(`No se encontró la membresía esperada: ${error.message}`);
  return (data as { id: string }).id;
}

function inviteEmail(fixtures_: RoleFixtures, label: string): string {
  return `rls-inv-${label}-${fixtures_.runId}@t.local`;
}

describe("RLS 0001 · organizations", () => {
  it("SELECT propia permitida para los cinco roles", async () => {
    for (const role of ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const { data, error } = await client.from("organizations").select("id,name").eq("id", fixtures.orgA.id);
      expect(error?.message ?? null, `select como ${role}`).toBeNull();
      const ids = ((data ?? []) as Array<{ id: string }>).map((row) => row.id);
      expect(ids, `filas visibles como ${role}`).toEqual([fixtures.orgA.id]);
    }
  });

  it("SELECT cruzada: un miembro de orgB no ve la organización de orgA", async () => {
    const spectatorB = await asFixtureUser(fixtures, "b", "spectator");
    const byId = await spectatorB.from("organizations").select("id").eq("id", fixtures.orgA.id);
    expectDenied(byId, "orgB listando la org de orgA por id");
    const listed = await spectatorB.from("organizations").select("id");
    const ids = ((listed.data ?? []) as Array<{ id: string }>).map((row) => row.id);
    expect(ids).not.toContain(fixtures.orgA.id);
    expect(ids).toContain(fixtures.orgB.id);
  });

  it("UPDATE y DELETE denegados para coach, analyst, player y spectator", async () => {
    for (const role of NON_ADMIN_ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const updated = await client
        .from("organizations")
        .update({ name: `Invadida por ${role}` })
        .eq("id", fixtures.orgA.id)
        .select("id");
      expectDenied(updated, `update como ${role}`);
      const deleted = await client.from("organizations").delete().eq("id", fixtures.orgA.id).select("id");
      expectDenied(deleted, `delete como ${role}`);
    }
    const intact = await admin.from("organizations").select("name").eq("id", fixtures.orgA.id).single();
    expect((intact.data as { name: string } | null)?.name).toBe(ORG_A_NAME);
  });

  it("UPDATE permitido para club_admin", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const renamed = await adminA
      .from("organizations")
      .update({ name: `${ORG_A_NAME} editado` })
      .eq("id", fixtures.orgA.id)
      .select("id");
    expectAffected(renamed, 1, "update por club_admin");
    await adminA.from("organizations").update({ name: ORG_A_NAME }).eq("id", fixtures.orgA.id);
  });

  it("DELETE permitido para club_admin sobre una organización desechable", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const createdOrg = await admin
      .from("organizations")
      .insert({ name: "RLS Test Club Desechable" })
      .select("id")
      .single();
    if (createdOrg.error) throw new Error(`No se pudo crear la organización desechable: ${createdOrg.error.message}`);
    const tmpOrgId = (createdOrg.data as { id: string }).id;
    trackForCleanup(fixtures, { orgId: tmpOrgId });
    const createdMembership = await admin
      .from("memberships")
      .insert({
        organization_id: tmpOrgId,
        user_id: user("a", "club_admin").id,
        role: "club_admin",
        status: "active",
      })
      .select("id")
      .single();
    if (createdMembership.error) {
      throw new Error(`No se pudo crear la membresía de la organización desechable: ${createdMembership.error.message}`);
    }
    const removed = await adminA.from("organizations").delete().eq("id", tmpOrgId).select("id");
    expectAffected(removed, 1, "delete por club_admin");
    const gone = await admin.from("organizations").select("id").eq("id", tmpOrgId);
    expect((gone.data ?? []) as unknown[]).toHaveLength(0);
  });
});

describe("RLS 0001 · memberships", () => {
  it("SELECT visible para todos los roles de la organización", async () => {
    for (const role of ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const { data, error } = await client
        .from("memberships")
        .select("organization_id,user_id")
        .eq("organization_id", fixtures.orgA.id);
      expect(error?.message ?? null, `select como ${role}`).toBeNull();
      const rows = (data ?? []) as Array<{ organization_id: string; user_id: string }>;
      expect(rows.length, `membresías visibles como ${role}`).toBeGreaterThanOrEqual(ROLES.length + 1);
      for (const row of rows) {
        expect(row.organization_id, `fila vista por ${role}`).toBe(fixtures.orgA.id);
      }
      expect(
        rows.some((row) => row.user_id === user("a", role).id),
        `propia membresía visible como ${role}`,
      ).toBe(true);
    }
  });

  it("INSERT denegado para coach, analyst, player y spectator", async () => {
    const outsider = user("b", "coach");
    for (const role of NON_ADMIN_ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const inserted = await client
        .from("memberships")
        .insert({
          organization_id: fixtures.orgA.id,
          user_id: outsider.id,
          role: "spectator",
          status: "invited",
        })
        .select("id");
      expectDenied(inserted, `insert como ${role}`);
    }
    const leak = await admin
      .from("memberships")
      .select("id")
      .eq("organization_id", fixtures.orgA.id)
      .eq("user_id", outsider.id);
    expect((leak.data ?? []) as unknown[]).toHaveLength(0);
  });

  it("UPDATE denegado para coach, analyst, player y spectator", async () => {
    const targetId = await membershipIdByUser(fixtures.orgA.id, user("a", "spectator").id);
    for (const role of NON_ADMIN_ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const updated = await client
        .from("memberships")
        .update({ role: "club_admin" })
        .eq("id", targetId)
        .select("id");
      expectDenied(updated, `update de membresía como ${role}`);
    }
    const intact = await admin.from("memberships").select("role").eq("id", targetId).single();
    expect((intact.data as { role: string } | null)?.role).toBe("spectator");
  });

  it("DELETE denegado para coach, analyst, player y spectator", async () => {
    const targetId = await membershipIdByUser(fixtures.orgA.id, user("a", "analyst").id);
    for (const role of NON_ADMIN_ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const deleted = await client.from("memberships").delete().eq("id", targetId).select("id");
      expectDenied(deleted, `delete de membresía como ${role}`);
    }
    const stillThere = await admin.from("memberships").select("id").eq("id", targetId).single();
    expect(stillThere.error?.message ?? null).toBeNull();
  });

  it("INSERT/UPDATE/DELETE permitidos para club_admin", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const outsider = user("b", "analyst");
    const inserted = await adminA
      .from("memberships")
      .insert({
        organization_id: fixtures.orgA.id,
        user_id: outsider.id,
        role: "analyst",
        status: "invited",
      })
      .select("id")
      .single();
    expect(inserted.error?.message ?? null, "insert por club_admin").toBeNull();
    const rowId = (inserted.data as { id: string }).id;
    const promoted = await adminA.from("memberships").update({ role: "player" }).eq("id", rowId).select("id");
    expectAffected(promoted, 1, "update por club_admin");
    const removed = await adminA.from("memberships").delete().eq("id", rowId).select("id");
    expectAffected(removed, 1, "delete por club_admin");
  });
});

describe("RLS 0001 · invites", () => {
  it("SELECT denegado para analyst, player y spectator", async () => {
    for (const role of LOW_INVITE_ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const listed = await client.from("invites").select("*").eq("organization_id", fixtures.orgA.id);
      expectDenied(listed, `select como ${role}`);
    }
  });

  it("INSERT denegado para analyst, player y spectator", async () => {
    for (const role of LOW_INVITE_ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const inserted = await client
        .from("invites")
        .insert({
          organization_id: fixtures.orgA.id,
          email: inviteEmail(fixtures, `deny-${role}`),
          role: "spectator",
          token: `tok-${randomUUID()}`,
        })
        .select("id");
      expectDenied(inserted, `insert como ${role}`);
    }
  });

  it("Coach puede invitar a analyst, player y spectator", async () => {
    const coach = await asFixtureUser(fixtures, "a", "coach");
    for (const target of LOW_INVITE_ROLES) {
      const inserted = await coach
        .from("invites")
        .insert({
          organization_id: fixtures.orgA.id,
          email: inviteEmail(fixtures, `coach-${target}`),
          role: target,
          token: `tok-${randomUUID()}`,
        })
        .select("id");
      expect(inserted.error?.message ?? null, `invitación a ${target} por coach`).toBeNull();
      expect((inserted.data ?? []) as unknown[]).toHaveLength(1);
    }
  });

  it("Coach NO puede invitar club_admin ni otro coach (nota ¹)", async () => {
    const coach = await asFixtureUser(fixtures, "a", "coach");
    for (const target of ["club_admin", "coach"] as const) {
      const inserted = await coach
        .from("invites")
        .insert({
          organization_id: fixtures.orgA.id,
          email: inviteEmail(fixtures, `coach-forbidden-${target}`),
          role: target,
          token: `tok-${randomUUID()}`,
        })
        .select("id");
      expect(inserted.error, `invitar a ${target} debe violar la política RLS`).not.toBeNull();
    }
  });

  it("Coach ve las invitaciones de su organización", async () => {
    const coach = await asFixtureUser(fixtures, "a", "coach");
    const listed = await coach.from("invites").select("*").eq("organization_id", fixtures.orgA.id);
    expect(listed.error?.message ?? null).toBeNull();
    const rows = (listed.data ?? []) as Array<{ organization_id: string; email: string }>;
    expect(rows.length).toBeGreaterThanOrEqual(LOW_INVITE_ROLES.length);
    for (const row of rows) expect(row.organization_id).toBe(fixtures.orgA.id);
  });

  it("Coach puede cancelar (DELETE) una invitación", async () => {
    const coach = await asFixtureUser(fixtures, "a", "coach");
    const inserted = await coach
      .from("invites")
      .insert({
        organization_id: fixtures.orgA.id,
        email: inviteEmail(fixtures, "cancel"),
        role: "spectator",
        token: `tok-${randomUUID()}`,
      })
      .select("id")
      .single();
    expect(inserted.error?.message ?? null).toBeNull();
    const inviteId = (inserted.data as { id: string }).id;
    const cancelled = await coach.from("invites").delete().eq("id", inviteId).select("id");
    expectAffected(cancelled, 1, "cancelación por coach");
  });

  it("Analyst NO puede cancelar invitaciones", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const inserted = await adminA
      .from("invites")
      .insert({
        organization_id: fixtures.orgA.id,
        email: inviteEmail(fixtures, "survivor"),
        role: "player",
        token: `tok-${randomUUID()}`,
      })
      .select("id")
      .single();
    expect(inserted.error?.message ?? null).toBeNull();
    const inviteId = (inserted.data as { id: string }).id;
    trackForCleanup(fixtures, { inviteId });
    const analyst = await asFixtureUser(fixtures, "a", "analyst");
    const cancelled = await analyst.from("invites").delete().eq("id", inviteId).select("id");
    expectDenied(cancelled, "cancelación como analyst");
    const stillThere = await admin.from("invites").select("id").eq("id", inviteId).single();
    expect(stillThere.error?.message ?? null).toBeNull();
  });

  it("club_admin puede invitar cualquier rol, incluido club_admin", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    for (const role of ROLES) {
      const inserted = await adminA
        .from("invites")
        .insert({
          organization_id: fixtures.orgA.id,
          email: inviteEmail(fixtures, `admin-${role}`),
          role,
          token: `tok-${randomUUID()}`,
        })
        .select("id");
      expect(inserted.error?.message ?? null, `invitación a ${role} por club_admin`).toBeNull();
      expect((inserted.data ?? []) as unknown[]).toHaveLength(1);
    }
    const listed = await adminA.from("invites").select("id").eq("organization_id", fixtures.orgA.id);
    expect(listed.error?.message ?? null, "select de invites por club_admin").toBeNull();
    expect(((listed.data ?? []) as unknown[]).length).toBeGreaterThanOrEqual(ROLES.length);
  });
});

describe("Aislamiento cruzado explícito (FR-005)", () => {
  it("Usuario dual: contexto orgA ve solo orgA, contexto orgB ve solo orgB", async () => {
    const dualClient = await asUser(dual.email);
    const inA = await dualClient
      .from("memberships")
      .select("organization_id,user_id")
      .eq("organization_id", dual.memberships.orgAId);
    expect(inA.error?.message ?? null).toBeNull();
    const rowsA = (inA.data ?? []) as Array<{ organization_id: string; user_id: string }>;
    expect(rowsA.length).toBeGreaterThan(0);
    for (const row of rowsA) {
      expect(row.organization_id).toBe(fixtures.orgA.id);
    }
    expect(rowsA.some((row) => row.user_id === dual.id)).toBe(true);

    const inB = await dualClient
      .from("memberships")
      .select("organization_id,user_id")
      .eq("organization_id", dual.memberships.orgBId);
    expect(inB.error?.message ?? null).toBeNull();
    const rowsB = (inB.data ?? []) as Array<{ organization_id: string; user_id: string }>;
    expect(rowsB.length).toBeGreaterThan(0);
    for (const row of rowsB) {
      expect(row.organization_id).toBe(fixtures.orgB.id);
    }

    const orgs = await dualClient.from("organizations").select("id");
    const orgIds = ((orgs.data ?? []) as Array<{ id: string }>).map((row) => row.id).sort();
    expect(orgIds).toEqual([fixtures.orgA.id, fixtures.orgB.id].sort());
  });

  it("Consultas sin filtro nunca mezclan organizaciones (ambas direcciones)", async () => {
    const coachA = await asFixtureUser(fixtures, "a", "coach");
    const orgsA = await coachA.from("organizations").select("id");
    expect(((orgsA.data ?? []) as Array<{ id: string }>).map((row) => row.id)).toEqual([fixtures.orgA.id]);
    const memsA = await coachA.from("memberships").select("organization_id");
    const memARows = (memsA.data ?? []) as Array<{ organization_id: string }>;
    expect(memARows.length).toBeGreaterThan(0);
    for (const row of memARows) {
      expect(row.organization_id).toBe(fixtures.orgA.id);
      expect(row.organization_id).not.toBe(fixtures.orgB.id);
    }

    const spectatorB = await asFixtureUser(fixtures, "b", "spectator");
    const orgsB = await spectatorB.from("organizations").select("id");
    expect(((orgsB.data ?? []) as Array<{ id: string }>).map((row) => row.id)).toEqual([fixtures.orgB.id]);
    const memsB = await spectatorB.from("memberships").select("organization_id");
    const memBRows = (memsB.data ?? []) as Array<{ organization_id: string }>;
    expect(memBRows.length).toBeGreaterThan(0);
    for (const row of memBRows) {
      expect(row.organization_id).toBe(fixtures.orgB.id);
      expect(row.organization_id).not.toBe(fixtures.orgA.id);
    }
  });

  it("Lectura explícita por uuid de otra organización devuelve 0 filas", async () => {
    const playerA = await asFixtureUser(fixtures, "a", "player");
    const orgRead = await playerA.from("organizations").select("id").eq("id", fixtures.orgB.id);
    expectDenied(orgRead, "leer la fila de orgB por uuid");
    const memRead = await playerA
      .from("memberships")
      .select("id")
      .eq("user_id", user("b", "club_admin").id);
    expectDenied(memRead, "leer membresías de orgB");
    const inviteRead = await playerA.from("invites").select("id").eq("id", orgBInviteId);
    expectDenied(inviteRead, "leer invitación de orgB por uuid");
  });

  it("Escritura cruzada denegada: club_admin de orgA no muta orgB", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const updated = await adminA
      .from("organizations")
      .update({ name: "Secuestrada" })
      .eq("id", fixtures.orgB.id)
      .select("id");
    expectDenied(updated, "update cruzado sobre orgB");
    const deleted = await adminA.from("organizations").delete().eq("id", fixtures.orgB.id).select("id");
    expectDenied(deleted, "delete cruzado sobre orgB");
    const intact = await admin.from("organizations").select("name").eq("id", fixtures.orgB.id).single();
    expect((intact.data as { name: string } | null)?.name).toBe(ORG_B_NAME);
  });
});

describe("Anónimo denegado (invariante 4)", () => {
  let anon!: SupabaseClient;

  beforeAll(() => {
    anon = getAnonClient();
  });

  it.each(["organizations", "memberships", "invites"] as const)(
    "SELECT anónimo sobre %s devuelve 0 filas o error",
    async (table) => {
      const listed = await anon.from(table).select("id");
      expectDenied(listed, `select anónimo sobre ${table}`);
    },
  );

  it("INSERT anónimo en organizations es denegado", async () => {
    const inserted = await anon.from("organizations").insert({ name: "Anónimo FC" }).select("id");
    expectDenied(inserted, "insert anónimo en organizations");
  });
});
