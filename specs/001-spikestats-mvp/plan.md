# Implementation Plan: SpikeStats MVP — Plataforma de estadísticas de voleibol en vivo

**Branch**: `001-spikestats-mvp` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-spikestats-mvp/spec.md`

## Summary

Build the SpikeStats MVP: a multi-tenant web platform where volleyball clubs
manage rosters, register matches (including retrospective result-only
entries), score matches live from a coach's phone with offline tolerance,
broadcast a shareable read-only scoreboard, and analyze team/player
performance via metric dashboards.

Technical approach (per constitution): a single Next.js (App Router,
TypeScript) PWA talking directly to Supabase (Postgres + Auth + RLS +
Realtime). Isolation is enforced by Row Level Security with a role matrix.
Live scoring writes an append-only, idempotent action log through an
IndexedDB-backed outbox that drains automatically on reconnect. Metrics are
pure, golden-tested TypeScript functions computed on read; deployment is
Vercel free tier with no long-running server processes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) on Node.js 20 LTS
(tooling/build); runs in modern evergreen browsers.

**Primary Dependencies**: Next.js (App Router, latest stable), React,
shadcn/ui + Tailwind CSS, Recharts (dashboards), `@supabase/supabase-js` +
`@supabase/ssr` (data/auth/realtime), TanStack Query (server-state caching),
Zod (runtime input validation), Vitest + React Testing Library (unit/component),
Playwright (E2E, mobile viewport). Each addition beyond the constitution
stack is justified in [research.md](./research.md).

**Storage**: Supabase Postgres (free tier) — all persistent state including
auth; client-side IndexedDB used only as the offline action outbox (Principle III).

**Testing**: Vitest (unit + contract), Playwright (E2E smoke at phone-sized
viewport), RLS policy contract tests executed against the hosted Supabase
project per role fixture (see [research.md](./research.md) D8).

**Target Platform**: Mobile-first PWA served by Vercel; primary target is a
coach's phone browser (one-handed use); desktop is a responsive adaptation.

**Project Type**: Web application (unified frontend + thin route handlers;
no standalone backend service).

**Performance Goals**: Action → public scoreboard propagation < 5 s p95
(SC-004); scoring interaction ≤ 2 s per action (SC-001); dashboard answers
< 10 s for a ~20-match season (SC-007); 100% offline-action recovery
(SC-002/SC-003).

**Constraints**: Zero-cost infrastructure (Supabase free tier ~500 MB DB,
Vercel free tier); no long-running server processes; total organization
isolation (non-negotiable); Spanish UI; offline-capable live scoring.

**Scale/Scope**: Up to 50 active clubs (~250 teams, ~3,000 players, ~5,000
matches/year, ~750k action rows/year) and 10 concurrently scored live
matches — comfortably within free-tier budgets (SC-009).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | How this plan satisfies it |
|---|-----------|--------|----------------------------|
| I | Multi-Tenant Isolation by RLS (NON-NEGOTIABLE) | PASS | Every table carries `organization_id`; RLS enabled on all tables; role permission matrix defined in `contracts/rls-access-matrix.md`; contract tests prove per-role allow/deny including explicit cross-org denial (RLS test harness against hosted Supabase). Public exposure only via token-scoped read path. |
| II | Mobile-First Live Scoring | PASS | Scoring screen designed at 360–430 px width, thumb-zone layout, ≥48 px touch targets, undo affordance; Playwright smoke runs at mobile viewport; PR gate requires phone-viewport smoke pass. |
| III | Offline Resilience & Realtime Sync | PASS | Append-only `match_actions` log with idempotency key (`client_action_id` UNIQUE); IndexedDB outbox drains on reconnect with zero-loss/zero-duplicate semantics (`contracts/sync.md`); Supabase Realtime pushes to dashboards/public board (<5 s). |
| IV | Test-First Development (NON-NEGOTIABLE) | PASS | TDD enforced in workflow; metric formulas specified as executable contracts (`contracts/metrics.md`) with golden-value Vitest suites; RLS contract-test suite mandated per migration. |
| V | Simplicity & Free-Tier Discipline | PASS | No backend service added; dependencies beyond constitution stack individually justified (research.md); read-time metric computation + indexed queries instead of batch jobs; volume estimates fit free tier; no long-running functions. |

**Gate result**: PASS — no violations. Complexity Tracking table stays empty.
Post-Phase-1 re-check: PASS (design introduces no new services, no
cross-org paths, no long-running compute; see Completion Report).

## Project Structure

### Documentation (this feature)

```text
specs/001-spikestats-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── rls-access-matrix.md
│   ├── public-scoreboard-api.md
│   ├── metrics.md
│   └── sync.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/                          # Next.js App Router
├── (auth)/                   # login, signup, invite acceptance
├── (club)/                   # authenticated, org-scoped area
│   ├── equipos/              # teams & rosters
│   ├── partidos/             # matches list/detail/result entry
│   │   └── [matchId]/vivo/   # live scoring screen (mobile-first)
│   ├── tableros/             # team & player dashboards
│   └── ajustes/              # members, invites, roles
├── m/[token]/                # public read-only scoreboard page
└── api/
    └── public/match/[token]/ # public scoreboard JSON contract
components/                   # shadcn/ui-derived components (scoring pad, charts)
lib/
├── db/                       # Supabase clients, typed queries
├── metrics/                  # PURE metric functions (golden-tested)
├── offline/                  # IndexedDB outbox + sync engine
└── validation/               # Zod schemas shared by forms & API
supabase/
└── migrations/               # schema + RLS policies (SQL, versioned)
tests/
├── unit/                     # metric golden tests, validators
├── contract/                 # RLS allow/deny per role; API contracts
├── integration/              # offline queue drain/reconnect flows
└── e2e/                      # Playwright mobile-viewport smoke
```

**Structure Decision**: Single unified Next.js application (Option "Web
application" collapsed into one deployable): the App Router serves both the
authenticated club area and the public scoreboard; all privileged data
access happens through RLS-guarded Supabase client calls rather than a
custom API layer, keeping the server surface minimal per Principle V. SQL
schema and RLS policies live versioned under `supabase/migrations/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations. Table intentionally left empty.
