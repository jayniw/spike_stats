<!--
=== Sync Impact Report ===
Version change: unratified scaffold -> 1.0.0 (initial ratification)
Modified principles: none (all newly ratified)
Added sections: Core Principles (I-V); Technology Stack & Constraints;
  Development Workflow & Quality Gates; Governance
Removed sections: none (template comments removed after replacement)
Follow-up TODOs: none
===
-->

# SpikeStats Constitution

## Core Principles

### I. Multi-Tenant Isolation by RLS (NON-NEGOTIABLE)

Every data resource belongs to exactly one `organizations` row. Row Level
Security MUST be enabled on every Supabase table and MUST be the primary
isolation mechanism. Roles per organization (club admin, coach, analyst,
player, spectator) carry differentiated permissions for annotating, editing,
and viewing. No query, endpoint, or view may EVER read or write across
organization boundaries. Every schema migration MUST include RLS policy
updates plus contract tests that prove cross-organization access is denied
for each role. Rationale: serving multiple clubs on a single instance makes
data leakage the single highest-severity defect class in the product.

### II. Mobile-First Live Scoring

The coach's phone is the primary scoring device. Every live-scoring surface
MUST be operable one-handed ("tap" style) with large, pulse-tolerant touch
targets, and MUST NOT lose a recorded play due to UI friction. Desktop and
tablet layouts are responsive adaptations of the mobile design, never the
reverse. Rationale: courtside, users hold a phone in one hand while watching
the game; nobody should depend on securing a tablet or laptop at the court.

### III. Offline Resilience & Realtime Sync

Live scoring MUST tolerate network outages: actions recorded while offline
MUST be persisted locally and synchronized automatically on reconnect with
zero loss and zero duplication. Under normal connectivity, scored actions
MUST propagate via Supabase Realtime to shared dashboards and the public
read-only live scoreboard within seconds. Sync semantics SHOULD be based on
an append-only action log so conflict resolution is deterministic. Rationale:
matches happen in gyms with unreliable coverage; a lost point corrupts every
derived statistic downstream.

### IV. Test-First Development (NON-NEGOTIABLE)

TDD is mandatory: tests are written and reviewed before implementation code;
the Red-Green-Refactor cycle is strictly enforced. Metric formulas (points
per set, attack efficiency, kill %, ace %, reception quality, blocks per set)
MUST be covered by unit tests with known golden values. RLS policies MUST be
covered by contract tests demonstrating allow/deny outcomes per role,
including explicit cross-organization denial cases. Rationale: the product's
value is statistical correctness; wrong numbers silently destroy trust, and
security regressions are unacceptable.

### V. Simplicity & Free-Tier Discipline

Start simple and apply YAGNI: every new dependency, abstraction, or service
MUST be justified in the plan that introduces it. Queries, indexes, and data
volumes MUST be designed against Supabase free-tier limits (~500 MB database,
project pauses on inactivity) and Vercel free tier. Long-running serverless
functions MUST be avoided; prefer client-side computation and indexed queries
over backend batch jobs. Rationale: the project operates within zero-cost
infrastructure until validated; premature scale engineering is waste.

## Technology Stack & Constraints

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Mobile-first PWA, installable; dashboards adapt to desktop |
| UI | shadcn/ui + Tailwind CSS | Accessible components, fast iteration |
| Backend/Data | Supabase | Postgres + Auth + RLS + Realtime; respect free-tier limits |
| Deployment | Vercel | Free tier, preview per PR |
| Charts | Recharts | Team and player dashboards |

Constraints:

- Out of scope until explicitly ratified otherwise: native mobile apps
  (PWA covers live scoring), video analysis, billing/subscriptions.
- All features MUST function within free-tier quotas; pausing-by-inactivity
  of the Supabase project is an accepted operational reality, so local-first
  persistence (Principle III) is required, not optional.
- New stack additions require a constitution amendment (see Governance).

## Development Workflow & Quality Gates

- Specification-driven flow: `/speckit.specify` -> `/speckit.clarify` ->
  `/speckit.plan` -> `/speckit.tasks` -> `/speckit.implement`. No
  implementation starts without an approved specification.
- Quality gates per PR:
  - Tests written first (Principle IV); all tests green before merge.
  - RLS contract tests updated whenever schema or roles change (Principle I).
  - Manual smoke pass of live-scoring flow on a phone-sized viewport for any
    UI change touching scoring screens (Principle II).
  - No regression in offline queue/reconnect behavior (Principle III).
- Code review requirements: at least one reviewer; reviewer MUST verify
  constitution compliance alongside functional correctness.
- Deployment: merge to main deploys via Vercel; every PR gets a preview URL
  that MUST be exercised for UI-facing changes.

## Governance

This constitution supersedes all other practices, conventions, and ad-hoc
decisions in the repository.

- Amendment procedure: propose the change in a PR editing this file, document
  what changes and why, include a migration plan for affected work in flight,
  and obtain maintainer approval before merge.
- Versioning policy (semantic versioning):
  - MAJOR: removal or incompatible redefinition of a core principle.
  - MINOR: new principle, section, or materially expanded guidance.
  - PATCH: clarifications, wording, typo fixes, non-semantic refinements.
- Compliance review: every PR and code review MUST verify adherence to the
  five core principles; any intentional deviation MUST be recorded in the PR
  description and folded back into a future amendment.
- Complexity MUST be justified against Principle V wherever introduced.
- Runtime development guidance lives in `.specify/` templates and specs; this
  file governs, it does not prescribe implementation detail.

**Version**: 1.0.0 | **Ratified**: 2026-08-23 | **Last Amended**: 2026-08-23
