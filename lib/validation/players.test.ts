import { describe, expect, it } from "vitest";
import {
  createPlayerSchema,
  createTeamSchema,
  dorsalSchema,
  positionSchema,
  updatePlayerSchema,
  updateTeamSchema,
} from "./players";

// ────────────────────────────────────────────────────────────────────────────
// Dorsal validation
// ────────────────────────────────────────────────────────────────────────────

describe("dorsalSchema", () => {
  it("accepts dorsal 1", () => {
    expect(dorsalSchema.safeParse(1).success).toBe(true);
  });

  it("accepts dorsal 99", () => {
    expect(dorsalSchema.safeParse(99).success).toBe(true);
  });

  it("accepts dorsal 50", () => {
    expect(dorsalSchema.safeParse(50).success).toBe(true);
  });

  it("rejects dorsal 0", () => {
    expect(dorsalSchema.safeParse(0).success).toBe(false);
  });

  it("rejects dorsal 100", () => {
    expect(dorsalSchema.safeParse(100).success).toBe(false);
  });

  it("rejects negative dorsal", () => {
    expect(dorsalSchema.safeParse(-1).success).toBe(false);
  });

  it("rejects non-integer dorsal", () => {
    expect(dorsalSchema.safeParse(7.5).success).toBe(false);
  });

  it("rejects string dorsal", () => {
    expect(dorsalSchema.safeParse("7").success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Position validation
// ────────────────────────────────────────────────────────────────────────────

describe("positionSchema", () => {
  it("accepts all valid positions", () => {
    const positions = ["setter", "opposite", "middle", "receiver", "libero"];
    for (const pos of positions) {
      expect(positionSchema.safeParse(pos).success, `position "${pos}" should be valid`).toBe(true);
    }
  });

  it("rejects invalid position", () => {
    expect(positionSchema.safeParse("invalid").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(positionSchema.safeParse("").success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Player name validation
// ────────────────────────────────────────────────────────────────────────────

describe("createPlayerSchema · full_name", () => {
  const validBase = {
    team_id: "550e8400-e29b-41d4-a716-446655440001",
    number: 7,
    position: "setter" as const,
  };

  it("accepts a valid name", () => {
    expect(
      createPlayerSchema.safeParse({ ...validBase, full_name: "Martina González" }).success,
    ).toBe(true);
  });

  it("trims whitespace", () => {
    const result = createPlayerSchema.safeParse({ ...validBase, full_name: "  Ana  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.full_name).toBe("Ana");
  });

  it("rejects empty name", () => {
    expect(
      createPlayerSchema.safeParse({ ...validBase, full_name: "" }).success,
    ).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    expect(
      createPlayerSchema.safeParse({ ...validBase, full_name: "   " }).success,
    ).toBe(false);
  });

  it("rejects name longer than 120 chars", () => {
    expect(
      createPlayerSchema.safeParse({ ...validBase, full_name: "A".repeat(121) }).success,
    ).toBe(false);
  });

  it("accepts name at exactly 120 chars", () => {
    expect(
      createPlayerSchema.safeParse({ ...validBase, full_name: "A".repeat(120) }).success,
    ).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// createPlayerSchema — full object
// ────────────────────────────────────────────────────────────────────────────

describe("createPlayerSchema", () => {
  it("accepts valid input", () => {
    const result = createPlayerSchema.safeParse({
      team_id: "550e8400-e29b-41d4-a716-446655440001",
      full_name: "Laura López",
      number: 5,
      position: "middle",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing team_id", () => {
    expect(
      createPlayerSchema.safeParse({ full_name: "Test", number: 1, position: "setter" }).success,
    ).toBe(false);
  });

  it("rejects invalid team_id format", () => {
    expect(
      createPlayerSchema.safeParse({
        team_id: "not-a-uuid",
        full_name: "Test",
        number: 1,
        position: "setter",
      }).success,
    ).toBe(false);
  });

  it("rejects missing full_name", () => {
    expect(
      createPlayerSchema.safeParse({
        team_id: "550e8400-e29b-41d4-a716-446655440001",
        number: 1,
        position: "setter",
      }).success,
    ).toBe(false);
  });

  it("rejects missing number", () => {
    expect(
      createPlayerSchema.safeParse({
        team_id: "550e8400-e29b-41d4-a716-446655440001",
        full_name: "Test",
        position: "setter",
      }).success,
    ).toBe(false);
  });

  it("rejects missing position", () => {
    expect(
      createPlayerSchema.safeParse({
        team_id: "550e8400-e29b-41d4-a716-446655440001",
        full_name: "Test",
        number: 1,
      }).success,
    ).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// updatePlayerSchema
// ────────────────────────────────────────────────────────────────────────────

describe("updatePlayerSchema", () => {
  it("accepts empty update (no fields)", () => {
    expect(updatePlayerSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with number only", () => {
    expect(updatePlayerSchema.safeParse({ number: 10 }).success).toBe(true);
  });

  it("accepts partial update with active only", () => {
    expect(updatePlayerSchema.safeParse({ active: false }).success).toBe(true);
  });

  it("rejects invalid dorsal in update", () => {
    expect(updatePlayerSchema.safeParse({ number: 100 }).success).toBe(false);
  });

  it("rejects invalid position in update", () => {
    expect(updatePlayerSchema.safeParse({ position: "invalid" }).success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// createTeamSchema
// ────────────────────────────────────────────────────────────────────────────

describe("createTeamSchema", () => {
  it("accepts valid team input", () => {
    expect(
      createTeamSchema.safeParse({ name: "Primera", category: "Primera" }).success,
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(createTeamSchema.safeParse({ name: "", category: "Primera" }).success).toBe(false);
  });

  it("rejects empty category", () => {
    expect(createTeamSchema.safeParse({ name: "Primera", category: "" }).success).toBe(false);
  });

  it("rejects name longer than 80 chars", () => {
    expect(
      createTeamSchema.safeParse({ name: "A".repeat(81), category: "Primera" }).success,
    ).toBe(false);
  });

  it("rejects category longer than 40 chars", () => {
    expect(
      createTeamSchema.safeParse({ name: "Primera", category: "A".repeat(41) }).success,
    ).toBe(false);
  });

  it("trims whitespace from name and category", () => {
    const result = createTeamSchema.safeParse({ name: "  Segunda  ", category: "  Sub-16  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Segunda");
      expect(result.data.category).toBe("Sub-16");
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// updateTeamSchema
// ────────────────────────────────────────────────────────────────────────────

describe("updateTeamSchema", () => {
  it("accepts empty update", () => {
    expect(updateTeamSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update with name only", () => {
    expect(updateTeamSchema.safeParse({ name: "Updated" }).success).toBe(true);
  });

  it("rejects empty name in update", () => {
    expect(updateTeamSchema.safeParse({ name: "" }).success).toBe(false);
  });
});
