# Quickstart — SpikeStats MVP validation

**Feature**: `001-spikestats-mvp` | **Date**: 2026-08-23
End-to-end validation guide. Proves the spec's success criteria on a local
environment before any PR merge. References: [data-model.md](./data-model.md),
[contracts/](./contracts/).

## Prerequisites

- Node.js 20 LTS, npm
- Docker Desktop (for local Supabase)
- Supabase CLI ≥ latest stable

## Setup

```powershell
npm ci
supabase start                 # local Postgres+Auth+Realtime stack
supabase db reset              # applies supabase/migrations (schema + RLS)
npm run seed:demo              # fixture club, users per role, demo season data
npm run dev                    # http://localhost:3000
```

Fixture accounts (from seed): `admin@demo.club`, `coach@demo.club`,
`analyst@demo.club`, `player@demo.club` (password printed by seed script).

## Validation scenarios

### V1 — Multi-tenant isolation (SC-006, Principle I)
1. Log in as `coach@demo.club`; copy a match URL from club "Demo".
2. Log in as a seeded user of the second fixture club; open that URL.
3. **Expected**: access denied / zero Demo rows rendered.
4. Run `npm run test -- contract` → RLS matrix suites all green
   (cross-org denial cases included).

### V2 — Roster rules (FR-007/FR-008)
1. As coach: create team "Primera"; add player dorsal 7.
2. Attempt second dorsal 7 in same team.
3. **Expected**: rejected with clear message; other teams accept 7.

### V3 — Live scoring one-handed (SC-001/SC-005, Principle II)
1. As coach on a phone-sized viewport (Playwright config: 360×800) start a
   scheduled match → status `live`.
2. Record serve→reception→set_pass→attack(point). Verify running score
   increments and set logic at 24–24 (needs 2-point margin).
3. Undo last action; re-record with corrected player.
4. **Expected**: score/statistics consistent after undo/correct; all primary
   buttons reachable in thumb zone (manual check + E2E tap assertions).
5. Run `npm run test:e2e -- scoring.spec.ts`.

### V4 — Offline resilience (SC-002/SC-003, Principle III)
1. In live match, set browser offline (DevTools) or stop local Supabase.
2. Record 10 actions → each confirmed locally as `pending`.
3. Restore connectivity; keep tab open.
4. **Expected**: queue drains automatically; `npm run db:snapshot` shows
   exactly the recorded actions, contiguous `seq`, zero duplicates.
5. Contract test equivalent: `npm run test -- sync`.

### V5 — Public scoreboard <5 s (SC-004, Clarification Q1)
1. Copy share link of the live match; open in a private window (no auth).
2. Score an attack-point in the coach tab; stopwatch to spectator update.
3. **Expected**: visible ≤5 s p95; players shown as dorsal only by default;
   switch match identity_mode to `full_name` → names appear.
4. Toggle `share_enabled=false` → link answers 403.

### V6 — Dashboards & metrics correctness (SC-007/SC-008)
1. As analyst open team dashboard for seeded season (20 matches incl. 3
   result-only retrospective entries).
2. **Expected**: win% includes result-only matches; attack efficiency etc.
   computed only from scored matches and matching
   [contracts/metrics.md](./contracts/metrics.md) golden values exactly
   (`npm run test -- metrics` enforces same numbers).
3. Player comparison view renders side-by-side; trend respects season filter.

## Quality gates recap (per constitution)

```powershell
npm run lint && npm run typecheck
npm run test            # unit + contract (metrics golden + RLS + sync)
npm run test:e2e        # mobile-viewport smoke
```

All green required before merge; any schema/policy change must extend RLS
contract tests in the same PR.
