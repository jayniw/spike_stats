import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ROLES,
  asFixtureUser,
  createRoleFixtures,
  expectDenied,
  getAdminClient,
  getSupabaseUrl,
  pingSupabase,
  trackForCleanup,
  type MembershipRole,
  type OrgSlot,
  type RoleFixtures,
} from "./rls-harness";

const LOW_INVITE_ROLES = ["analyst", "player", "spectator"] as const;

let fixtures!: RoleFixtures;
let admin!: SupabaseClient;

beforeAll(async () => {
  const disponible = await pingSupabase();
  if (!disponible) {
    throw new Error(
      `Supabase no responde en ${getSupabaseUrl()} — verifica NEXT_PUBLIC_SUPABASE_URL en .env.local`,
    );
  }
  admin = getAdminClient();
  fixtures = await createRoleFixtures();
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
  if (error) throw new Error(`No se encontró la membresía: ${error.message}`);
  return (data as { id: string }).id;
}

function inviteEmail(label: string): string {
  return `rls-mem-inv-${label}-${fixtures.runId}@t.local`;
}

// ────────────────────────────────────────────────────────────────────────────
// Memberships — SELECT
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Memberships · select", () => {
  it("all five roles can SELECT own memberships", async () => {
    for (const role of ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const { data, error } = await client
        .from("memberships")
        .select("id,role")
        .eq("organization_id", fixtures.orgA.id);
      expect(error?.message ?? null, `select memberships as ${role}`).toBeNull();
      expect((data ?? []).length, `memberships visible as ${role}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("cross-org: member of orgA cannot SELECT memberships of orgB", async () => {
    const spectatorA = await asFixtureUser(fixtures, "a", "spectator");
    const { data, error } = await spectatorA
      .from("memberships")
      .select("id")
      .eq("organization_id", fixtures.orgB.id);
    expectDenied({ data, error }, "spectatorA reading orgB memberships");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Memberships — INSERT (admin-only)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Memberships · insert (admin-only)", () => {
  it("club_admin can INSERT a membership for a real auth user", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const outsider = user("b", "coach");
    const { error } = await adminClient.from("memberships").insert({
      organization_id: fixtures.orgA.id,
      user_id: outsider.id,
      role: "spectator",
      status: "active",
    });
    expect(error?.message ?? null, "admin insert membership").toBeNull();
    // cleanup
    await admin
      .from("memberships")
      .delete()
      .eq("organization_id", fixtures.orgA.id)
      .eq("user_id", outsider.id);
  });

  it.each(["coach", "analyst", "player", "spectator"] as const)(
    "non-admin role %s CANNOT INSERT a membership",
    async (role) => {
      const client = await asFixtureUser(fixtures, "a", role);
      const outsider = user("b", "player");
      const { error } = await client.from("memberships").insert({
        organization_id: fixtures.orgA.id,
        user_id: outsider.id,
        role: "spectator",
        status: "active",
      });
      expect(error, `non-admin ${role} insert should fail`).not.toBeNull();
    },
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Memberships — UPDATE role (admin-only)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Memberships · update (admin-only)", () => {
  it("club_admin can UPDATE membership role", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const targetId = await membershipIdByUser(fixtures.orgA.id, user("a", "spectator").id);
    const original = await admin.from("memberships").select("role").eq("id", targetId).single();
    const originalRole = (original.data as { role: string }).role;

    const { error } = await adminClient
      .from("memberships")
      .update({ role: "player" })
      .eq("id", targetId);
    expect(error?.message ?? null, "admin update role").toBeNull();

    // revert
    await adminClient.from("memberships").update({ role: originalRole }).eq("id", targetId);
  });

  it.each(["coach", "analyst", "player", "spectator"] as const)(
    "non-admin role %s CANNOT UPDATE membership role (by id)",
    async (role) => {
      const client = await asFixtureUser(fixtures, "a", role);
      const targetId = await membershipIdByUser(fixtures.orgA.id, user("a", "player").id);
      const { data, error } = await client
        .from("memberships")
        .update({ role: "spectator" })
        .eq("id", targetId)
        .select("id");
      expectDenied({ data, error }, `non-admin ${role} update by id`);
    },
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Memberships — REVOKE (admin-only)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Memberships · revoke (admin-only)", () => {
  it("club_admin can REVOKE membership (status → revoked)", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    // create disposable membership
    const disposableEmail = `rls-revoke-${fixtures.runId}@t.local`;
    const { data: userData, error: createErr } = await admin.auth.admin.createUser({
      email: disposableEmail,
      password: "rlspass123!",
      email_confirm: true,
    });
    if (createErr || !userData.user) throw new Error(`fixture user: ${createErr?.message}`);
    const disposableId = userData.user.id;
    trackForCleanup(fixtures, { userId: disposableId });

    const { data: memData, error: memErr } = await admin
      .from("memberships")
      .insert({
        organization_id: fixtures.orgA.id,
        user_id: disposableId,
        role: "spectator",
        status: "active",
      })
      .select("id")
      .single();
    if (memErr || !memData) throw new Error(`fixture membership: ${memErr?.message}`);
    trackForCleanup(fixtures, { membershipId: (memData as { id: string }).id });

    const { error } = await adminClient
      .from("memberships")
      .update({ status: "revoked" })
      .eq("id", (memData as { id: string }).id);
    expect(error?.message ?? null, "admin revoke membership").toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Memberships — DELETE (admin-only)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Memberships · delete (admin-only)", () => {
  it("non-admin cannot DELETE membership", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const targetId = await membershipIdByUser(fixtures.orgA.id, user("a", "analyst").id);
    const { data, error } = await coachClient
      .from("memberships")
      .delete()
      .eq("id", targetId)
      .select("id");
    expectDenied({ data, error }, "coach delete membership by id");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Invites — coach role-scoping
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Invites · coach role-scoping", () => {
  it("coach can INSERT invite for low roles (analyst, player, spectator)", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    for (const role of LOW_INVITE_ROLES) {
      const email = inviteEmail(`coach-${role}`);
      const { error } = await coachClient.from("invites").insert({
        organization_id: fixtures.orgA.id,
        email,
        role,
        token: `tok-${randomUUID()}`,
      });
      expect(error?.message ?? null, `coach invite ${role}`).toBeNull();
    }
  });

  it("coach CANNOT INSERT invite for club_admin", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const { error } = await coachClient.from("invites").insert({
      organization_id: fixtures.orgA.id,
      email: inviteEmail("coach-admin"),
      role: "club_admin",
      token: `tok-${randomUUID()}`,
    });
    expect(error, "coach invite club_admin should be denied").not.toBeNull();
  });

  it("coach CANNOT INSERT invite for coach", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const { error } = await coachClient.from("invites").insert({
      organization_id: fixtures.orgA.id,
      email: inviteEmail("coach-coach"),
      role: "coach",
      token: `tok-${randomUUID()}`,
    });
    expect(error, "coach invite coach should be denied").not.toBeNull();
  });

  it("analyst CANNOT INSERT invite", async () => {
    const analystClient = await asFixtureUser(fixtures, "a", "analyst");
    const { error } = await analystClient.from("invites").insert({
      organization_id: fixtures.orgA.id,
      email: inviteEmail("analyst-invite"),
      role: "spectator",
      token: `tok-${randomUUID()}`,
    });
    expect(error, "analyst invite should be denied").not.toBeNull();
  });

  it("player CANNOT INSERT invite", async () => {
    const playerClient = await asFixtureUser(fixtures, "a", "player");
    const { error } = await playerClient.from("invites").insert({
      organization_id: fixtures.orgA.id,
      email: inviteEmail("player-invite"),
      role: "spectator",
      token: `tok-${randomUUID()}`,
    });
    expect(error, "player invite should be denied").not.toBeNull();
  });

  it("spectator CANNOT INSERT invite", async () => {
    const spectatorClient = await asFixtureUser(fixtures, "a", "spectator");
    const { error } = await spectatorClient.from("invites").insert({
      organization_id: fixtures.orgA.id,
      email: inviteEmail("spectator-invite"),
      role: "spectator",
      token: `tok-${randomUUID()}`,
    });
    expect(error, "spectator invite should be denied").not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Invites — cross-org isolation
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Invites · cross-org isolation", () => {
  it("member of orgA cannot SELECT invites of orgB", async () => {
    const coachA = await asFixtureUser(fixtures, "a", "coach");
    const { data, error } = await coachA
      .from("invites")
      .select("id")
      .eq("organization_id", fixtures.orgB.id);
    expectDenied({ data, error }, "coachA reading orgB invites");
  });

  it("member of orgA cannot INSERT invite into orgB", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const { error } = await adminA.from("invites").insert({
      organization_id: fixtures.orgB.id,
      email: inviteEmail("cross-org"),
      role: "spectator",
      token: `tok-${randomUUID()}`,
    });
    expect(error, "adminA insert invite into orgB should fail").not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Memberships — cross-org isolation
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Memberships · cross-org isolation", () => {
  it("member of orgA cannot SELECT memberships of orgB", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const { data, error } = await adminA
      .from("memberships")
      .select("id")
      .eq("organization_id", fixtures.orgB.id);
    expectDenied({ data, error }, "adminA reading orgB memberships");
  });

  it("member of orgA cannot UPDATE memberships of orgB (by id)", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const targetId = await membershipIdByUser(fixtures.orgB.id, user("b", "spectator").id);
    const { data, error } = await adminA
      .from("memberships")
      .update({ role: "player" })
      .eq("id", targetId)
      .select("id");
    expectDenied({ data, error }, "adminA update orgB membership by id");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Invites — admin full access
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Invites · admin full access", () => {
  it("club_admin can SELECT, INSERT, and DELETE invites", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");

    // SELECT
    const { data: listed } = await adminClient
      .from("invites")
      .select("id")
      .eq("organization_id", fixtures.orgA.id);
    expect(listed).toBeDefined();

    // INSERT
    const email = inviteEmail("admin-full");
    const { data: inserted, error: insertErr } = await adminClient
      .from("invites")
      .insert({
        organization_id: fixtures.orgA.id,
        email,
        role: "spectator",
        token: `tok-${randomUUID()}`,
      })
      .select("id")
      .single();
    expect(insertErr?.message ?? null, "admin insert invite").toBeNull();
    const inviteId = (inserted as { id: string })?.id;

    // DELETE (cancel)
    if (inviteId) {
      const { error: delErr } = await adminClient.from("invites").delete().eq("id", inviteId);
      expect(delErr?.message ?? null, "admin delete invite").toBeNull();
    }
  });
});
