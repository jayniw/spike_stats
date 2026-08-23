# Research & Decisions — SpikeStats MVP

**Feature**: `001-spikestats-mvp` | **Date**: 2026-08-23
All NEEDS CLARIFICATION items from the plan workflow are resolved here.
The constitution fixes the core stack; this document records decisions made
within that stack and justifies every dependency added beyond it (Principle V).

## D1. Application framework

- **Decision**: Next.js with App Router, single deployable on Vercel.
- **Rationale**: Constitution-mandated; unifies authenticated club area,
  public scoreboard route (`app/m/[token]`), and minimal API route handlers
  in one project — no separate backend to operate.
- **Alternatives considered**: Vite SPA + standalone API (two deploys, more
  moving parts); Remix (not in constitution stack). Rejected.

## D2. Server-state management & realtime consumption

- **Decision**: TanStack Query for caching/revalidation of Supabase reads;
  Supabase Realtime (Postgres Changes) subscribed per open match/dashboard
  channel for push updates.
- **Rationale**: Gives request deduplication, cache invalidation on realtime
  events, and offline-friendly retry semantics out of the box.
- **Alternatives considered**: Hand-rolled fetch/effect caches (error-prone,
  duplicated logic); Redux Toolkit Query (heavier, less fit for Supabase).
  Rejected.

## D3. Offline scoring engine

- **Decision**: IndexedDB-backed append-only "outbox". Every scored action is
  written locally first with a client-generated UUIDv7 id
  (`client_action_id`); a sync engine drains the queue on reconnect using
  idempotent upserts (`ON CONFLICT (client_action_id) DO NOTHING`).
- **Rationale**: Satisfies Principle III deterministically: local write order
  is preserved, replay is idempotent (zero duplication), UUIDv7 gives
  time-sortable ids even before server sequencing. Works in any modern
  browser regardless of Service Worker support.
- **Alternatives considered**: Background Sync API (unreliable/unsupported in
  some mobile browsers for this use case); CRDT library (over-engineered for
  single-active-scorer model, violates YAGNI). Rejected.

## D4. Action ordering & conflict policy

- **Decision**: Display/statistical order = server sequence (bigserial)
  assigned at insert; ties broken by `recorded_at`. Single-active-scorer rule
  (FR-019) enforced by a partial unique index: only one match may be in
  `status='live'` per scorer session token; second device gets read-only view.
- **Rationale**: Append-only log + server sequencing makes stats reproducible
  from any point-in-time snapshot (constitution III) without merge logic.
- **Alternatives considered**: Client-side ordering trust (unsafe across
  devices); last-write-wins mutation of an aggregate score row (loses audit
  trail). Rejected.

## D5. Metrics computation strategy

- **Decision**: Pure TypeScript functions in `lib/metrics/` operating on
  fetched action arrays; Postgres does only cheap indexed aggregates where a
  season filter needs them (e.g., set-score counts for win %). No batch jobs.
- **Rationale**: Golden-value unit testing (Principle IV) is trivial against
  pure functions; volumes (~750k actions/year total, ≤ ~150k per club) make
  read-time computation comfortably fast (<10 s SC-007) with proper indexes
  (`(match_id)`, `(org_id, match_id)`).
- **Alternatives considered**: SQL views/materialized views for all metrics
  (harder to golden-test portably, refresh complexity); serverless cron
  aggregation (violates no-long-running constraint). Rejected.

## D6. Public scoreboard exposure without auth

- **Decision**: Public page + JSON route keyed by unguessable share token;
  data served through a Postgres security-definer function that returns only
  published-match fields and applies the per-match identity preference
  (`dorsal` default vs full name). Token revocation = flag flip on match.
- **Rationale**: Keeps RLS as the only privilege boundary for club data while
  giving anonymous viewers a narrow, auditable read path; identity mode
  implements Clarification Q1 (privacy-safe default).
- **Alternatives considered**: Anonymous RLS policies on base tables (widens
  attack surface); pre-rendered static snapshots (breaks <5 s liveness).
  Rejected.

## D7. Auth, invitations & email delivery (resolves deferred item from /speckit.clarify)

- **Decision**: Supabase Auth (email + password or magic link). Club invites
  are rows in an `invites` table with expiring tokens; invitation emails are
  sent by Supabase's built-in invite/auth emails (free tier), falling back to
  displaying a copyable invite link in-app when email delivery fails.
- **Rationale**: Zero additional vendor/cost; resolves the deferred
  "email delivery" dependency without adding an external provider.
- **Alternatives considered**: Resend/SendGrid free tiers (extra vendor +
  keys to manage in v1). Deferred until volume justifies it.

## D8. RLS contract-test harness

- **Decision**: Contract tests run against a local Supabase instance
  (`supabase start` + migrations reset) using real JWTs minted for fixture
  users in each role, asserting allow/deny per matrix cell including explicit
  cross-org denial. Executed via Vitest suites in `tests/contract/`.
- **Rationale**: Tests the actual enforcement layer (Postgres RLS), not a
  mock; satisfies constitution I+IV verbatim ("prove cross-org denial").
- **Alternatives considered**: pgTAP (SQL-only, weaker integration with CI
  reporting we already use); mocking the DB client (tests nothing real).
  Rejected.

## D9. PWA installability & offline shell

- **Decision**: Minimal hand-rolled web manifest + tiny Service Worker that
  precaches the app shell only. Match DATA never lives in the SW cache —
  live-scoring data goes through IndexedDB outbox (D3).
- **Rationale**: Installable home-screen experience (README requirement) with
  zero extra dependencies; avoids stale-data bugs typical of data-caching
  SWs.
- **Alternatives considered**: `next-pwa`/Serwist plugin (extra dependency
  whose data caching we would disable anyway — YAGNI). Rejected.

## D10. Validation & forms

- **Decision**: Zod schemas in `lib/validation/` shared by client forms and
  route handlers; domain rules (dorsal range/uniqueness, skill-outcome
  legality) encoded once.
- **Rationale**: Single source of validation truth keeps FR-008-style rules
  consistent between UI and persistence path.
- **Alternatives considered**: Ad-hoc per-form validation (drift risk);
  server-only validation (poor UX). Rejected.

## Dependency budget (Principle V justification)

| Dependency | Why needed | Rejected alternative |
|---|---|---|
| TanStack Query | Cache + invalidation wired to Realtime | Manual effect caching |
| Zod | Shared form/API validation | Per-form ad-hoc checks |
| Vitest + RTL | Fast TDD loop incl. RLS contract suites | Jest (slower config, equal fit) |
| Playwright | Phone-viewport smoke gate (Principle II) | Cypress (equal fit, heavier bundle) |
| Recharts | Constitution-mandated charts | n/a |
| shadcn/ui + Tailwind | Constitution-mandated UI system | n/a |

No other runtime dependencies planned; additions later require a PR note per
constitution governance.
