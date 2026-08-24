---
description: "Task list for SpikeStats MVP implementation"
---

# Tasks: SpikeStats MVP — Plataforma de estadísticas de voleibol en vivo

**Input**: Design documents from `/specs/001-spikestats-mvp/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅,
contracts/ ✅ (rls-access-matrix, public-scoreboard-api, metrics, sync),
quickstart.md ✅

**Tests**: INCLUDED — constitution Principle IV mandates TDD (non-negotiable);
test tasks are written FIRST and must FAIL before their implementation task.

**Organization**: By user story (US1–US8 from spec.md priorities P1→P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on incomplete tasks)
- **[Story]**: owning user story (US1…US8)
- Every task includes exact file paths

## Path Conventions

Single unified Next.js app (plan.md Structure Decision): `app/`, `components/`,
`lib/`, `supabase/migrations/`, `scripts/`, `tests/{unit,contract,integration,e2e}/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and toolchain

- [X] T001 Scaffold Next.js App Router project with TypeScript strict mode creating directories per plan.md: `app/(auth)/`, `app/(club)/`, `app/m/[token]/`, `app/api/public/match/[token]/`, `components/`, `lib/{db,metrics,offline,scoring,validation,auth}`, `supabase/migrations/`, `tests/{unit,contract,integration,e2e}/`
- [X] T002 [P] Configure Tailwind CSS + shadcn/ui baseline and Spanish locale defaults in `app/layout.tsx`
- [X] T003 [P] Add lint/format/typecheck scripts (`npm run lint|typecheck`) with ESLint + Prettier configs at repo root
- [X] T004 [P] Set up Vitest (`vitest.config.ts`) and Playwright (`playwright.config.ts` with mobile viewport 360×800 project) plus npm scripts `test`, `test:e2e`
- [X] T005 [P] Create environment template `.env.local.example` (SUPABASE_URL, SUPABASE_ANON_KEY) and document setup steps from `specs/001-spikestats-mvp/quickstart.md` in README

**Checkpoint**: Toolchain ready — `npm run typecheck && npm run test` green on empty suites

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Isolation core, auth sessions, RLS test harness — blocks ALL stories

**⚠ CRITICAL**: No user story work until this phase completes

- [X] T006 Initialize Supabase project (`supabase/config.toml`) and write migration `supabase/migrations/0001_organizations_memberships.sql`: tables `organizations`, `memberships`, `invites` with enums (`membership_role`, `membership_status`), RLS ENABLED + policies per `contracts/rls-access-matrix.md` rows for those resources
- [X] T007 [P] Implement typed Supabase clients `lib/db/client.ts` (browser + server via `@supabase/ssr`)
- [ ] T008 [P] Build RLS contract-test harness `tests/contract/rls-harness.ts` (fixture users in each role across TWO clubs, real JWTs against local Supabase) + suite `tests/contract/rls-core.spec.ts` proving matrix cells and explicit cross-org denial for 0001 tables, including a dual-membership case: same user active in two clubs with different roles, isolation verified in both directions (FR-005)
- [X] T009 [P] Create Zod schemas `lib/validation/core.ts` (role enum, invite email/token, membership transitions)
- [X] T010 [P] Write demo seed `scripts/seed-demo.ts`: two clubs, users for all five roles, and a demo season fixture (20 matches incl. 3 result-only entries with set scores plus action distributions reproducing `contracts/metrics.md` golden values); printed passwords (quickstart prerequisites)
- [X] T011 Implement auth entry `app/(auth)/entrar/page.tsx` (magic-link + password via Supabase Auth) and session guard layout `app/(club)/layout.tsx` redirecting unauthenticated users
- [X] T012 [P] Establish empty/error/loading state conventions with shadcn wrappers in `components/ui/states.tsx` and toast provider in `app/layout.tsx`

### ⏸ ESTADO DE EJECUCIÓN — actualizado tras sesión con cortes de red

**Completadas y commiteadas**: Fase 1 (T001–T005) + Fase 2: T006 ✓, T007 ✓,
T009 ✓, T010 ✓, T011 ✓, T012 ✓. Typecheck/lint verde. **Única tarea
pendiente de Fase 2: T008**, bloqueada por el entorno.

**Bloqueo de entorno**: el stack local de Supabase NO está levantado
(contenedor `supabase_db_spikestats` inexistente; imágenes Docker a medio
descargar por cortes). Todo lo ejecutable sin DB ya está hecho y commiteado.

**Al reanudar (con Docker/virtualización funcionando):**
1. `npx supabase start` (reintenta: las capas ya descargadas se reutilizan;
   puede tardar varios minutos la primera vez).
2. `npx supabase db reset` — valida que la migración 0001 (T006) aplique limpia.
3. Ejecutar **T008** (harness RLS en `tests/contract/` contra la DB local).
4. Checkpoint Fase 2 → continuar Fase 3 (US1) según plan de olas paralelas.
No repetir tareas marcadas `[X]`.

**Checkpoint**: Foundation ready — RLS harness green, login works, stories can start in parallel

---

## Phase 3: User Story 1 — Crear club e invitar miembros con roles (P1) — MVP

**Goal**: Admin creates a club, invites members by email with one of five roles; permissions enforced; total cross-org isolation

**Independent Test**: Create club → invite spectator → that user sees the club but cannot create teams or score matches (spec US1 scenarios; quickstart V1)

### Tests for User Story 1 (write FIRST, must FAIL)

- [ ] T013 [P] [US1] E2E `tests/e2e/onboarding.spec.ts`: create club → invite spectator → assert restricted nav and denied direct URLs (V1 flow)
- [ ] T018 [P] [US1] Contract tests `tests/contract/rls-memberships.spec.ts`: coach may invite only analyst/player/spectator; analyst cannot manage memberships; all cross-org denials (matrix rows)

### Implementation for User Story 1

- [ ] T014 [US1] Club creation onboarding `app/(onboarding)/nuevo-club/page.tsx` + server action inserting `organizations` + admin `membership` atomically
- [ ] T015 [US1] Members management `app/(club)/ajustes/miembros/page.tsx` listing memberships with role change and revoke actions (admin-only, FR-002/FR-003)
- [ ] T016 [US1] Invitations `app/(club)/ajustes/invitaciones/page.tsx` + acceptance route `app/(auth)/aceptar/[token]/page.tsx` consuming `invites` tokens with expiry (FR-002, research D7)
- [ ] T017 [US1] Server-side role guards `lib/auth/guards.ts` (`requireRole(...roles)`) used by all `(club)` mutations (FR-003)
- [ ] T019 [US1] Wire club-shell navigation `app/(club)/layout.tsx` nav with role-filtered links and Spanish labels

**Checkpoint**: US1 fully functional alone: club exists, roles enforced, isolation proven

---

## Phase 4: User Story 2 — Gestionar equipos y jugadoras (P1)

**Goal**: Teams and rosters with dorsal/position; duplicates rejected; archives preserve history

**Independent Test**: Create team, add 12 players, attempt duplicate dorsal → rejected (spec US2; quickstart V2)

### Tests for User Story 2 (write FIRST, must FAIL)

- [ ] T020 [P] [US2] Contract tests `tests/contract/teams-players.spec.ts`: duplicate dorsal within active team denied (and allowed across teams/archived), coach insert allowed, analyst/player denied, cross-org invisible
- [ ] T021 [P] [US2] Unit tests `lib/validation/players.test.ts`: dorsal 1–99 bounds, position enum, required name (FR-007)

### Implementation for User Story 2

- [ ] T022 [US2] Migration `supabase/migrations/0002_teams_players.sql`: `teams`, `players` (partial UNIQUE(team_id,number) WHERE archived_at IS NULL), RLS policies per matrix
- [ ] T023 [US2] Queries `lib/db/teams.ts`: list/create/archive team, roster CRUD, duplicate-dorsal error mapping
- [ ] T024 [US2] Pages `app/(club)/equipos/page.tsx` (list/create) and `app/(club)/equipos/[teamId]/page.tsx` (roster editor with position/dorsal forms using `lib/validation/players.ts`)
- [ ] T025 [US2] Archive/deactivate player flows preserving historic action attribution display notes (FR-009) in roster UI + queries
- [ ] T026 [P] [US2] Reusable roster picker `components/rostero/selector-jugadora.tsx` exported for later scoring screens (US4 dependency-free usage)

**Checkpoint**: US1 + US2 work independently

---

## Phase 5: User Story 3 — Registrar partidos y resultados (P1)

**Goal**: Register matches (rival/date/competition/home), edit set results, retrospective result-only entries, share tokens

**Independent Test**: Register match, load 3-1 result, appears in team history (spec US3; feeds quickstart V6)

### Tests for User Story 3 (write FIRST, must FAIL)

- [ ] T027 [P] [US3] Contract tests `tests/contract/matches.spec.ts`: coach/analyst insert+edit allowed while scheduled/live, player/spectator denied; result edits denied once `finished` unless reopened; reopen `finished→live` allowed for coach/admin and denied for analyst (matrix footnote ³); retrospective `finished` row without actions accepted; cancelled match rejects activation

### Implementation for User Story 3

- [ ] T028 [US3] Migration `supabase/migrations/0003_matches_sets.sql`: `matches` (status enum, `identity_mode` default `dorsal_only`, `share_token` unguessable, `share_enabled`) + `set_scores` UNIQUE(match_id,set_number), RLS policies
- [ ] T029 [US3] Queries `lib/db/matches.ts`: create/list (filters season/competition/state), result entry, state transitions per data-model machine
- [ ] T030 [P] [US3] Zod schemas `lib/validation/matches.ts` (rival/date/competition free-label rules, set scores 0–99)
- [ ] T031 [US3] Matches list `app/(club)/partidos/page.tsx` with state badges and filters
- [ ] T032 [US3] Match detail `app/(club)/partidos/[matchId]/page.tsx`: edit result-by-sets form + retrospective "cargar finalizado sin acciones" mode (Clarification Q2, FR-011/FR-012)
- [ ] T033 [US3] Share-link block in match detail `app/(club)/partidos/[matchId]/page.tsx`: copyable URL, privacy toggle bound to `share_enabled`, and per-match identity selector (`dorsal_only` default ↔ `full_name`) bound to `identity_mode` (FR-020, FR-022; enforcement lands in US5 T047)

**Checkpoint**: P1 stories complete — platform usable for records; ready for live scoring

---

## Phase 6: User Story 4 — Anotación en vivo desde el teléfono (P2)

**Goal**: One-handed tap scoring of skills/outcomes attributed to players; automatic score & set detection; undo/correct; single active scorer

**Independent Test**: Start live match at 360×800, record sequence, verify score/set logic and undo correctness (quickstart V3)

### Tests for User Story 4 (write FIRST, must FAIL)

- [ ] T034 [P] [US4] Unit tests `lib/scoring/engine.test.ts` golden: running score, deuce 24-24 needs +2 margin, 5th set to 15/+2, skill-outcome legality map (point only for serve/attack/block)
- [ ] T035 [P] [US4] Contract tests `tests/contract/actions.spec.ts`: insert rejected unless match `live`; CHECK constraint rejects illegal outcome/skill pair; corrections coach/admin-only (analyst denied per matrix)

### Implementation for User Story 4

- [ ] T036 [US4] Migration `supabase/migrations/0004_match_actions.sql`: append-only `match_actions` (UUIDv7 PK, UNIQUE `client_action_id`, bigserial `seq`, legality CHECK, insert policy requiring `live` status + coach/analyst role)
- [ ] T037 [US4] Pure scoring engine `lib/scoring/engine.ts`: reduce(actions) → per-set scores, set-close events, current set (passes T034 goldens)
- [ ] T038 [US4] Capture layer `lib/scoring/capture.ts`: builds action envelope with `client_action_id` UUIDv7 and performs idempotent insert (ON CONFLICT DO NOTHING path; offline routing arrives in US6)
- [ ] T039 [US4] Live scoring screen `app/(club)/partidos/[matchId]/vivo/page.tsx`: thumb-zone pad, ≥48px targets, skill→player→outcome flow, undo/correct affordances (FR-016/FR-017)
- [ ] T040 [US4] Single-scorer session claim `lib/scoring/session.ts`: claims live slot on start, second device gets read-only notice (FR-019)
- [ ] T041 [US4] Realtime hook `hooks/use-live-match.ts`: subscribes match actions + set_scores changes feeding score header and recent-actions strip
- [ ] T042 [US4] E2E `tests/e2e/scoring.spec.ts` at mobile viewport: schedule→live→record→undo→close-set assertions (quickstart V3 automation); asserts tap→capture-confirmed latency ≤2 s p95 over 20 scripted actions (SC-001)

**Checkpoint**: Core differentiator works end-to-end online

---

## Phase 7: User Story 5 — Sincronización en vivo y marcador público (P2)

**Goal**: Anonymous read-only shareable scoreboard updating <5s honoring per-match identity preference

**Independent Test**: Open share link signed-out during live match; updates arrive ≤5s; dorsal-only default; revoked link → 403 (quickstart V5)

### Tests for User Story 5 (write FIRST, must FAIL)

- [ ] T043 [P] [US5] Contract tests `tests/contract/public-snapshot.spec.ts` per `contracts/public-scoreboard-api.md`: both identity modes, unknown→404, revoked/cancelled→403, no extra field leakage

### Implementation for User Story 5

- [ ] T044 [US5] Migration `supabase/migrations/0005_public_events.sql`: `public_match_events` mirror table (token-keyed anonymous SELECT policy — sole anonymous grant, base tables stay closed) + trigger populating from `match_actions`/set closes + `public_match_snapshot(token)` security-definer function returning the contract-shaped snapshot honoring `identity_mode`
- [ ] T045 [US5] Route handler `app/api/public/match/[token]/route.ts` returning snapshot JSON exactly per contract (security-definer lookup, identity_mode shaping)
- [ ] T046 [US5] Public page `app/m/[token]/page.tsx`: scoreboard, set tracker, recent actions; subscribes `public_match_events` channel; handles `set_closed` events; Spanish UI
- [ ] T047 [US5] Revocation integration: flipping `share_enabled` (T033 toggle) immediately yields 403 on route + page; contract test extension in `tests/contract/public-snapshot.spec.ts`
- [ ] T048 [US5] Latency assertion: extend `tests/e2e/scoring.spec.ts` with paired-context check that a scored point reflects publicly within 5s budget window (SC-004)

**Checkpoint**: Spectators follow matches live; privacy default proven

---

## Phase 8: User Story 6 — Anotación tolerante a cortes de red (P2)

**Goal**: Offline capture persists locally; auto-sync on reconnect with zero loss/duplication; explicit quarantine errors

**Independent Test**: Go offline mid-match, record 10 actions, reconnect → all synced once, ordered (quickstart V4)

### Tests for User Story 6 (write FIRST, must FAIL)

- [ ] T049 [P] [US6] Contract tests `tests/contract/offline-sync.spec.ts` per `contracts/sync.md`: replay twice → exactly N rows contiguous seq; capture order preserved; validation-rejected item quarantined visibly; second-device claim while a session is active returns read-only mode (FR-019)

### Implementation for User Story 6

- [ ] T050 [US6] Outbox store `lib/offline/outbox.ts`: IndexedDB queue, UUIDv7 ids, per-item sync state (`pending|synced|quarantined`)
- [ ] T051 [US6] Local-first capture: reroute `lib/scoring/capture.ts` writes through outbox commit-before-network (FR-018 step 1)
- [ ] T052 [US6] Drain engine `lib/offline/drain.ts`: oldest-first idempotent replay with exponential backoff, reconnect handshake fetching match max `seq` and gap-pull (research D3/D4)
- [ ] T053 [US6] Status UX in `app/(club)/partidos/[matchId]/vivo/page.tsx`: connectivity badge, pending counter, quarantined-item card with fix/discard actions (never silent drop)
- [ ] T054 [US6] Integration tests `tests/integration/offline-flow.spec.ts`: simulate offline window, app reload before reconnect, resumed drain integrity

**Checkpoint**: Courtside reliability proven; scoring survives outages

---

## Phase 9: User Story 7 — Dashboard de equipo (P3)

**Goal**: Team history/win%/sets + aggregated efficiencies with season filters, live auto-update, golden-correct numbers

**Independent Test**: Seeded 20-match season incl. 3 result-only games renders indicators matching manual calculation (quickstart V6)

### Tests for User Story 7 (write FIRST, must FAIL)

- [ ] T055 [P] [US7] Unit tests `lib/metrics/team.test.ts`: golden fixture from `contracts/metrics.md` (PPS 25.00, eficiencia 0.275, kill% 0.45, ace/set ≈1.667, recepción 0.84, bloqueos/set 2.000) + win% including result-only matches while action metrics exclude them

### Implementation for User Story 7

- [ ] T056 [US7] Metric functions `lib/metrics/team.ts` implementing canonical formulas + null-denominator "—" convention (passes T055)
- [ ] T057 [US7] Indexed aggregate queries `lib/db/dashboard-queries.ts` (org+season slices feeding pure functions; research D5)
- [ ] T058 [US7] Team dashboard `app/(club)/tableros/equipo/page.tsx`: history table, KPI cards, Recharts trend lines, temporada/competencia filters
- [ ] T059 [US7] Live auto-refresh: TanStack Query invalidation wired to realtime hook for in-progress matches (FR-026)
- [ ] T060 [US7] E2E `tests/e2e/team-dashboard.spec.ts`: seeded season renders golden values verbatim (SC-007/SC-008 automation)

**Checkpoint**: Analytics answer "¿cómo viene el equipo?" correctly

---

## Phase 10: User Story 8 — Dashboard por jugadora (P3)

**Goal**: Per-player averages/efficiencies/serve/reception metrics, side-by-side comparison, temporal trend

**Independent Test**: Player profile over N matches matches manual computation; comparison view contrasts selected players (spec US8)

### Tests for User Story 8 (write FIRST, must FAIL)

- [ ] T061 [P] [US8] Unit tests `lib/metrics/player.test.ts`: per-player golden values (averages divide by matches-with-actions; reception perfect% uses rated denominator per metrics contract)

### Implementation for User Story 8

- [ ] T062 [US8] Player metrics `lib/metrics/player.ts` reusing shared count derivations from `lib/metrics/team.ts` (single formula source, FR-025)
- [ ] T063 [US8] Player profile `app/(club)/tableros/jugadoras/[playerId]/page.tsx` with date/season range filter (FR-024)
- [ ] T064 [US8] Comparison view `app/(club)/tableros/comparar/page.tsx`: multi-select players, side-by-side metric table + radar/bar charts
- [ ] T065 [US8] Temporal trend chart component `components/tableros/tendencia.tsx` reused by team and player views
- [ ] T066 [US8] E2E `tests/e2e/player-dashboard.spec.ts`: profile + comparison render expected golden numbers

**Checkpoint**: Full analytics value delivered; all 8 stories independently functional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, performance, compliance validation

- [ ] T067 [P] Spanish copy audit across `app/` and `components/` (FR-027): consistent volleyball terminology per spec glossary
- [ ] T068 [P] PWA installability: `public/manifest.webmanifest` + minimal Service Worker `public/sw.js` precaching app shell only (research D9)
- [ ] T069 [P] Accessibility/touch audit script `scripts/a11y-check.mjs` (axe scan + ≥48px target assertions on scoring pad)
- [ ] T070 Performance & scale validation: volume seed `scripts/seed-volume.ts` (~50 clubs) + EXPLAIN review of dashboard queries against indexes (SC-009)
- [ ] T071 Security hardening: rate-limit `app/api/public/match/[token]/route.ts`, security headers, token entropy verification
- [ ] T072 Execute full `specs/001-spikestats-mvp/quickstart.md` scenarios V1–V6 and record results
- [ ] T073 Update README with architecture summary and constitution compliance notes (governance requirement)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → none; **Foundational (2)** → blocks ALL stories (RLS harness + auth are prerequisites)
- **US1 (3)** → first story; its guards/guards patterns are referenced by later stories
- **US2 (4)**, **US3 (5)** depend only on Foundation (need US1's club context fixtures)
- **US4 (6)** depends on US2 (roster picker) + US3 (matches exist)
- **US5 (7)** depends on US4 (actions/events source) + US3 (share toggle UI)
- **US6 (8)** depends on US4 capture layer (T038)
- **US7 (9)** depends on US3 (incl. result-only matches) + US4 (actions); **US8 (10)** depends on US7 metric core
- **Polish (11)** last

### Critical chain

Foundation → US1 → US3 → US4 → US5/US6 (parallelizable) → US7 → US8 → Polish
(US2 slots anywhere after US1; shown in priority order above)

### Parallel Opportunities

- Within phases: every `[P]` task (different files, tests-first pairs)
- Across stories once Foundation is done: US2 ∥ US3; after US4: US5 ∥ US6; after US7: US8 metrics ∥ Polish prep
- Test tasks marked `[P]` are written while sibling implementation files change nothing they import

---

## Parallel Example: User Story 4

```bash
# Tests first (parallel, different files):
Task: "Unit tests lib/scoring/engine.test.ts"        # T034
Task: "Contract tests tests/contract/actions.spec.ts" # T035

# Then sequential core:
Task: "Migration 0004_match_actions.sql"              # T036
Task: "Pure engine lib/scoring/engine.ts"             # T037 (green T034)
```

---

## Implementation Strategy

### MVP First (recommended stop-point 1)

1. Phases 1–2 (Setup + Foundation)
2. Phase 3 US1 → validate isolation & roles (checkpoint)
3. Continue P1 chain: US2, US3 → platform of record exists

### Value milestones

- After US4+US5+US6: courtside product complete (live + public + offline)
- After US7+US8: analytics promise fulfilled (full MVP per spec)

### Incremental delivery

Each checkpoint deploys standalone value via Vercel preview; never merge red
tests (constitution IV quality gates apply per PR).

---

## Notes

- TDD: every "Tests … (write FIRST)" task must fail before its implementation tasks start
- [P] = different files, no unfinished dependencies
- Commit after each task/logical group; stop at checkpoints to validate stories independently
- Any new dependency requires justification note in PR (constitution V)
