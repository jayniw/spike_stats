# Data Model — SpikeStats MVP

**Feature**: `001-spikestats-mvp` | **Date**: 2026-08-23
All tables carry `organization_id` (a.k.a. club) and have RLS enabled — see
`contracts/rls-access-matrix.md`. SQL lives in versioned
`supabase/migrations/`. Types below are Postgres-oriented; enums are native
Postgres enums.

## Entities

### organizations (club)
| Field | Type | Rules |
|---|---|---|
| id | uuid PK | |
| name | text | NOT NULL, 1–80 chars |
| created_at | timestamptz | default now() |

### memberships (user ↔ organization)
| Field | Type | Rules |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK → organizations | |
| user_id | uuid FK → auth.users | |
| role | enum: `club_admin, coach, analyst, player, spectator` | exactly one per membership |
| status | enum: `invited, active, revoked` | |
| invited_by | uuid nullable FK → auth.users | |
| UNIQUE(organization_id, user_id) | | a user appears once per club |

A user MAY hold independent memberships in many clubs (FR-005).

### invites
| Field | Type | Rules |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | |
| email | citext | |
| role | same enum as memberships | |
| token | text unique | unguessable, expires_at set |
| accepted_at | timestamptz nullable | |

### teams
| Field | Type | Rules |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | denormalized for RLS |
| name | text | NOT NULL |
| category | text | e.g. "Sub-16", "Primera" |
| archived_at | timestamptz nullable | archive ≠ delete |

### players
| Field | Type | Rules |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | denormalized for RLS |
| team_id | uuid FK → teams | |
| full_name | text | NOT NULL |
| number | int | dorsal, 1–99; UNIQUE(team_id, number) **where archived_at IS NULL** (FR-008) |
| position | enum: `setter, opposite, middle, receiver, libero` | colocador/opuesto/central/receptor/líbero |
| active | bool | default true; false blocks NEW action attribution only (FR-009) |

Historic actions keep their `player_id` even if the player is deactivated or
the dorsal reassigned after archiving.

### matches
| Field | Type | Rules |
|---|---|---|
| id | uuid PK | |
| organization_id | uuid FK | denormalized for RLS |
| team_id | uuid FK → teams | |
| rival | text | free label, no uniqueness (edge case) |
| played_on | date | |
| competition | text nullable | |
| season_label | text nullable | "2026-Apertura" style tag |
| is_home | bool | |
| status | enum: `scheduled, live, finished, cancelled` | state machine below |
| identity_mode | enum: `dorsal_only, full_name` | public link identity, default `dorsal_only` (Clarification Q1) |
| share_enabled | bool | default true for live/finished; false = revoked (FR-022) |
| share_token | text unique nullable | generated when match created |
| created_by | uuid FK → auth.users | |

Result-only retrospective entries are rows with `status='finished'`, set
scores filled, zero actions (Clarification Q2 / FR-011).

### set_scores
| Field | Type | Rules |
|---|---|---|
| id | uuid PK | |
| match_id | uuid FK → matches | |
| set_number | int | 1–5 |
| points_for | int | our team |
| points_against | int | rival |
| UNIQUE(match_id, set_number) | | final scores; live score during a match derives from actions |

### match_actions (append-only log — Principle III)
| Field | Type | Rules |
|---|---|---|
| id | uuid PK (UUIDv7) | |
| client_action_id | uuid UNIQUE | idempotency key from offline outbox (D3/D4) |
| organization_id | uuid FK | denormalized for RLS |
| match_id | uuid FK → matches | must be `status='live'` at insert |
| player_id | uuid FK → players | active player at insert time |
| set_number | int | 1–5 |
| skill | enum: `serve, reception, set_pass, attack, block, dig` | saque/recepción/colocación/ataque/bloqueo/defensa |
| outcome | enum: `point, error, rally_continues` | punto/error/continuidad |
| seq | bigserial | server-assigned global order (D4) |
| recorded_at | timestamptz | client clock at capture |
| recorded_offline | bool | diagnostics |

**Legality rule (validation)**: `outcome='point'` is valid ONLY for skills
`serve, attack, block`. Reception/set_pass/dig cannot score directly.
Enforced by CHECK constraint + Zod schema.

**Immutability**: no UPDATE path except corrections performed as delete+reinsert
of the affected trailing action(s) while match is not finished (FR-017); all
other writes append-only.

## State machines

**Match**: `scheduled → live → finished`; `scheduled → cancelled`;
`live → finished`; `finished → live` (reapertura, solo club_admin/coach).
Solo `live` acepta nuevas acciones y correcciones; el resultado por sets se
edita en `scheduled`/`live`; en `finished` exige reapertura previa (FR-012).

**Membership**: `invited → active → revoked`.

**Set completion (FR-015)**: normal sets close at ≥25 points with ≥2 margin;
set 5 closes at ≥15 with ≥2 margin. Derived client-side from point outcomes;
final authority written to `set_scores` when the set closes.

## Relationships

```
organizations 1─* memberships *─1 users(auth)
organizations 1─* teams 1─* players
organizations 1─* matches 1─* set_scores
matches 1─* match_actions *─1 players
organizations 1─* invites
```

## Indexing & volume strategy

- Every table indexed on `organization_id`; `match_actions` on
  `(match_id, seq)` and `(organization_id, match_id)`.
- Volume estimate at target scale (50 clubs): ~750k action rows/year ≈ tens
  of MB — well inside the ~500 MB free tier (SC-009).
- Dashboards read filtered slices by `(org, season_label, competition)` via
  index scans; heavy math happens in pure TS (research D5).

## RLS notes

Policies and the full permission matrix are specified in
`contracts/rls-access-matrix.md`; every migration adding/modifying a table or
policy MUST extend the contract tests (constitution I/IV).
