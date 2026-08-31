import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ROLES,
  asFixtureUser,
  createRoleFixtures,
  expectDenied,
  getSupabaseUrl,
  pingSupabase,
  type RoleFixtures,
} from "./rls-harness";

let fixtures!: RoleFixtures;

beforeAll(async () => {
  const disponible = await pingSupabase();
  if (!disponible) {
    throw new Error(
      `Supabase no responde en ${getSupabaseUrl()} — verifica NEXT_PUBLIC_SUPABASE_URL en .env.local`,
    );
  }
  fixtures = await createRoleFixtures();
}, 30_000);

afterAll(async () => {
  if (fixtures) await fixtures.cleanup();
});

const TEAM_NAME = "Primera Fuerza";
const TEAM_CATEGORY = "Primera";

async function createTeamAs(
  client: SupabaseClient,
  orgId: string,
  name: string = TEAM_NAME,
  category: string = TEAM_CATEGORY,
): Promise<string> {
  const { data, error } = await client
    .from("teams")
    .insert({ organization_id: orgId, name, category })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear el equipo: ${error.message}`);
  return (data as { id: string }).id;
}

async function createPlayerAs(
  client: SupabaseClient,
  orgId: string,
  teamId: string,
  fullName: string,
  number: number,
  position: string = "setter",
): Promise<string> {
  const { data, error } = await client
    .from("players")
    .insert({
      organization_id: orgId,
      team_id: teamId,
      full_name: fullName,
      number,
      position,
    })
    .select("id")
    .single();
  if (error) throw new Error(`No se pudo crear el jugador: ${error.message}`);
  return (data as { id: string }).id;
}

// ────────────────────────────────────────────────────────────────────────────
// Teams — SELECT
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Teams · select", () => {
  it("all five roles can SELECT teams in own org", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    await createTeamAs(adminA, fixtures.orgA.id, "Select Test", "Sub-16");

    for (const role of ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const { data, error } = await client
        .from("teams")
        .select("id,name")
        .eq("organization_id", fixtures.orgA.id);
      expect(error?.message ?? null, `select teams as ${role}`).toBeNull();
      expect((data ?? []).length, `teams visible as ${role}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("cross-org: member of orgA cannot SELECT teams of orgB", async () => {
    const spectatorA = await asFixtureUser(fixtures, "a", "spectator");
    const { data, error } = await spectatorA
      .from("teams")
      .select("id")
      .eq("organization_id", fixtures.orgB.id);
    expectDenied({ data, error }, "spectatorA reading orgB teams");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Teams — INSERT (coach + admin only)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Teams · insert (coach + admin only)", () => {
  it("club_admin can INSERT a team", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const { error } = await adminClient.from("teams").insert({
      organization_id: fixtures.orgA.id,
      name: "Admin Team",
      category: "Sub-18",
    });
    expect(error?.message ?? null, "admin insert team").toBeNull();
  });

  it("coach can INSERT a team", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const { error } = await coachClient.from("teams").insert({
      organization_id: fixtures.orgA.id,
      name: "Coach Team",
      category: "Sub-16",
    });
    expect(error?.message ?? null, "coach insert team").toBeNull();
  });

  it.each(["analyst", "player", "spectator"] as const)(
    "non-authorized role %s CANNOT INSERT a team",
    async (role) => {
      const client = await asFixtureUser(fixtures, "a", role);
      const { error } = await client.from("teams").insert({
        organization_id: fixtures.orgA.id,
        name: `${role} Team`,
        category: "Sub-14",
      });
      expect(error, `non-authorized ${role} insert team should fail`).not.toBeNull();
    },
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Teams — UPDATE (coach + admin only)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Teams · update (coach + admin only)", () => {
  it("club_admin can UPDATE a team", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const teamId = await createTeamAs(adminClient, fixtures.orgA.id, "Update Test");
    const { error } = await adminClient
      .from("teams")
      .update({ name: "Updated Team" })
      .eq("id", teamId);
    expect(error?.message ?? null, "admin update team").toBeNull();
  });

  it("coach can UPDATE a team", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const teamId = await createTeamAs(coachClient, fixtures.orgA.id, "Coach Update");
    const { error } = await coachClient
      .from("teams")
      .update({ name: "Coach Updated" })
      .eq("id", teamId);
    expect(error?.message ?? null, "coach update team").toBeNull();
  });

  it.each(["analyst", "player", "spectator"] as const)(
    "non-authorized role %s CANNOT UPDATE a team",
    async (role) => {
      const client = await asFixtureUser(fixtures, "a", role);
      const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
      const teamId = await createTeamAs(adminClient, fixtures.orgA.id, `Perm Test ${role}`);
      const { data, error } = await client
        .from("teams")
        .update({ name: "Hacked" })
        .eq("id", teamId)
        .select("id");
      expectDenied({ data, error }, `non-authorized ${role} update team`);
    },
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Teams — ARCHIVE (coach + admin only, via archived_at)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Teams · archive (coach + admin only)", () => {
  it("club_admin can archive a team (set archived_at)", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const teamId = await createTeamAs(adminClient, fixtures.orgA.id, "Archive Test");
    const { error } = await adminClient
      .from("teams")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", teamId);
    expect(error?.message ?? null, "admin archive team").toBeNull();
  });

  it("coach can archive a team", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const teamId = await createTeamAs(coachClient, fixtures.orgA.id, "Coach Archive");
    const { error } = await coachClient
      .from("teams")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", teamId);
    expect(error?.message ?? null, "coach archive team").toBeNull();
  });

  it.each(["analyst", "player", "spectator"] as const)(
    "non-authorized role %s CANNOT archive a team",
    async (role) => {
      const client = await asFixtureUser(fixtures, "a", role);
      const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
      const teamId = await createTeamAs(adminClient, fixtures.orgA.id, `Archive Perm ${role}`);
      const { data, error } = await client
        .from("teams")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", teamId)
        .select("id");
      expectDenied({ data, error }, `non-authorized ${role} archive team`);
    },
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Players — SELECT
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Players · select", () => {
  it("all five roles can SELECT players in own org", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const teamId = await createTeamAs(adminA, fixtures.orgA.id, "Player Select Test");
    await createPlayerAs(adminA, fixtures.orgA.id, teamId, "Martina González", 7);

    for (const role of ROLES) {
      const client = await asFixtureUser(fixtures, "a", role);
      const { data, error } = await client
        .from("players")
        .select("id,full_name")
        .eq("organization_id", fixtures.orgA.id);
      expect(error?.message ?? null, `select players as ${role}`).toBeNull();
      expect((data ?? []).length, `players visible as ${role}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("cross-org: member of orgA cannot SELECT players of orgB", async () => {
    const spectatorA = await asFixtureUser(fixtures, "a", "spectator");
    const { data, error } = await spectatorA
      .from("players")
      .select("id")
      .eq("organization_id", fixtures.orgB.id);
    expectDenied({ data, error }, "spectatorA reading orgB players");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Players — INSERT (coach + admin only)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Players · insert (coach + admin only)", () => {
  it("club_admin can INSERT a player", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const teamId = await createTeamAs(adminClient, fixtures.orgA.id, "Admin Player Team");
    const { error } = await adminClient.from("players").insert({
      organization_id: fixtures.orgA.id,
      team_id: teamId,
      full_name: "Ana Pérez",
      number: 10,
      position: "opposite",
    });
    expect(error?.message ?? null, "admin insert player").toBeNull();
  });

  it("coach can INSERT a player", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const teamId = await createTeamAs(coachClient, fixtures.orgA.id, "Coach Player Team");
    const { error } = await coachClient.from("players").insert({
      organization_id: fixtures.orgA.id,
      team_id: teamId,
      full_name: "Laura López",
      number: 5,
      position: "middle",
    });
    expect(error?.message ?? null, "coach insert player").toBeNull();
  });

  it.each(["analyst", "player", "spectator"] as const)(
    "non-authorized role %s CANNOT INSERT a player",
    async (role) => {
      const client = await asFixtureUser(fixtures, "a", role);
      const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
      const teamId = await createTeamAs(adminClient, fixtures.orgA.id, `Perm Player Team ${role}`);
      const { error } = await client.from("players").insert({
        organization_id: fixtures.orgA.id,
        team_id: teamId,
        full_name: `${role} Player`,
        number: 99,
        position: "libero",
      });
      expect(error, `non-authorized ${role} insert player should fail`).not.toBeNull();
    },
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Players — UPDATE (coach + admin only)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Players · update (coach + admin only)", () => {
  it("club_admin can UPDATE a player", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const teamId = await createTeamAs(adminClient, fixtures.orgA.id, "Update Player Team");
    const playerId = await createPlayerAs(adminClient, fixtures.orgA.id, teamId, "Test Player", 1);
    const { error } = await adminClient
      .from("players")
      .update({ full_name: "Updated Player" })
      .eq("id", playerId);
    expect(error?.message ?? null, "admin update player").toBeNull();
  });

  it("coach can UPDATE a player", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const teamId = await createTeamAs(coachClient, fixtures.orgA.id, "Coach Update Player");
    const playerId = await createPlayerAs(coachClient, fixtures.orgA.id, teamId, "Coach Player", 2);
    const { error } = await coachClient
      .from("players")
      .update({ full_name: "Coach Updated" })
      .eq("id", playerId);
    expect(error?.message ?? null, "coach update player").toBeNull();
  });

  it.each(["analyst", "player", "spectator"] as const)(
    "non-authorized role %s CANNOT UPDATE a player",
    async (role) => {
      const client = await asFixtureUser(fixtures, "a", role);
      const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
      const teamId = await createTeamAs(adminClient, fixtures.orgA.id, `Perm Update ${role}`);
      const playerId = await createPlayerAs(adminClient, fixtures.orgA.id, teamId, `Perm ${role}`, 3);
      const { data, error } = await client
        .from("players")
        .update({ full_name: "Hacked" })
        .eq("id", playerId)
        .select("id");
      expectDenied({ data, error }, `non-authorized ${role} update player`);
    },
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Players — DEACTIVATE (coach + admin only, via active=false)
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Players · deactivate (coach + admin only)", () => {
  it("club_admin can deactivate a player", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const teamId = await createTeamAs(adminClient, fixtures.orgA.id, "Deactivate Team");
    const playerId = await createPlayerAs(adminClient, fixtures.orgA.id, teamId, "Deactivate Me", 8);
    const { error } = await adminClient
      .from("players")
      .update({ active: false })
      .eq("id", playerId);
    expect(error?.message ?? null, "admin deactivate player").toBeNull();
  });

  it("coach can deactivate a player", async () => {
    const coachClient = await asFixtureUser(fixtures, "a", "coach");
    const teamId = await createTeamAs(coachClient, fixtures.orgA.id, "Coach Deactivate Team");
    const playerId = await createPlayerAs(coachClient, fixtures.orgA.id, teamId, "Coach Deact", 9);
    const { error } = await coachClient
      .from("players")
      .update({ active: false })
      .eq("id", playerId);
    expect(error?.message ?? null, "coach deactivate player").toBeNull();
  });

  it.each(["analyst", "player", "spectator"] as const)(
    "non-authorized role %s CANNOT deactivate a player",
    async (role) => {
      const client = await asFixtureUser(fixtures, "a", role);
      const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
      const teamId = await createTeamAs(adminClient, fixtures.orgA.id, `Deact Perm ${role}`);
      const playerId = await createPlayerAs(adminClient, fixtures.orgA.id, teamId, `Perm ${role}`, 11);
      const { data, error } = await client
        .from("players")
        .update({ active: false })
        .eq("id", playerId)
        .select("id");
      expectDenied({ data, error }, `non-authorized ${role} deactivate player`);
    },
  );
});

// ────────────────────────────────────────────────────────────────────────────
// Duplicate dorsal — UNIQUE constraint
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Teams/Players · duplicate dorsal", () => {
  it("duplicate dorsal within same active team is rejected", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const teamId = await createTeamAs(adminClient, fixtures.orgA.id, "Dorsal Team");
    await createPlayerAs(adminClient, fixtures.orgA.id, teamId, "Primera 7", 7);

    const { error } = await adminClient.from("players").insert({
      organization_id: fixtures.orgA.id,
      team_id: teamId,
      full_name: "Segunda 7",
      number: 7,
      position: "receiver",
    });
    expect(error, "duplicate dorsal in same team should fail").not.toBeNull();
  });

  it("same dorsal in different team is allowed", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const team1 = await createTeamAs(adminClient, fixtures.orgA.id, "Dorsal Team A");
    const team2 = await createTeamAs(adminClient, fixtures.orgA.id, "Dorsal Team B");
    await createPlayerAs(adminClient, fixtures.orgA.id, team1, "Player A-7", 7);

    const { error } = await adminClient.from("players").insert({
      organization_id: fixtures.orgA.id,
      team_id: team2,
      full_name: "Player B-7",
      number: 7,
      position: "setter",
    });
    expect(error?.message ?? null, "same dorsal in different team").toBeNull();
  });

  it("same dorsal allowed after player is archived (active=false)", async () => {
    const adminClient = await asFixtureUser(fixtures, "a", "club_admin");
    const teamId = await createTeamAs(adminClient, fixtures.orgA.id, "Archive Dorsal");
    const playerId = await createPlayerAs(adminClient, fixtures.orgA.id, teamId, "Archived 7", 7);

    await adminClient.from("players").update({ active: false }).eq("id", playerId);

    const { error } = await adminClient.from("players").insert({
      organization_id: fixtures.orgA.id,
      team_id: teamId,
      full_name: "New 7",
      number: 7,
      position: "middle",
    });
    expect(error?.message ?? null, "dorsal reuse after archive").toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Cross-org isolation — teams & players
// ────────────────────────────────────────────────────────────────────────────

describe("RLS Teams/Players · cross-org isolation", () => {
  it("member of orgA cannot INSERT team into orgB", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const { error } = await adminA.from("teams").insert({
      organization_id: fixtures.orgB.id,
      name: "Cross Org Team",
      category: "Sub-16",
    });
    expect(error, "adminA insert team into orgB should fail").not.toBeNull();
  });

  it("member of orgA cannot INSERT player into orgB", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const { error } = await adminA.from("players").insert({
      organization_id: fixtures.orgB.id,
      team_id: "00000000-0000-0000-0000-000000000000",
      full_name: "Cross Org Player",
      number: 1,
      position: "setter",
    });
    expect(error, "adminA insert player into orgB should fail").not.toBeNull();
  });

  it("member of orgA cannot UPDATE team of orgB", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const adminB = await asFixtureUser(fixtures, "b", "club_admin");
    const teamId = await createTeamAs(adminB, fixtures.orgB.id, "OrgB Team");
    const { data, error } = await adminA
      .from("teams")
      .update({ name: "Hacked" })
      .eq("id", teamId)
      .select("id");
    expectDenied({ data, error }, "adminA update orgB team");
  });

  it("member of orgA cannot UPDATE player of orgB", async () => {
    const adminA = await asFixtureUser(fixtures, "a", "club_admin");
    const adminB = await asFixtureUser(fixtures, "b", "club_admin");
    const teamId = await createTeamAs(adminB, fixtures.orgB.id, "OrgB Player Team");
    const playerId = await createPlayerAs(adminB, fixtures.orgB.id, teamId, "OrgB Player", 1);
    const { data, error } = await adminA
      .from("players")
      .update({ full_name: "Hacked" })
      .eq("id", playerId)
      .select("id");
    expectDenied({ data, error }, "adminA update orgB player");
  });
});
