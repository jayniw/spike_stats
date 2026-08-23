# Contract: RLS Access Matrix

**Feature**: `001-spikestats-mvp` | **Date**: 2026-08-23
This matrix is the executable specification for Row Level Security
(constitution Principle I) and the source of truth for the contract tests in
`tests/contract/`. Every cell is a test case. Cross-organization access is
denied in ALL cases for every role and every operation — no exceptions.

Roles: `club_admin`, `coach`, `analyst`, `player`, `spectator`
(within their own organization).

| Resource | Operation | club_admin | coach | analyst | player | spectator |
|---|---|---|---|---|---|---|
| organizations (own) | select | ✅ | ✅ | ✅ | ✅ | ✅ |
| organizations (own) | update/delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| memberships | select | ✅ | ✅ | ✅ | ✅ | ✅ |
| memberships | insert/update/delete (roles, revoke) | ✅ | ❌ | ❌ | ❌ | ❌ |
| invites | select / insert / cancel | ✅ | ✅¹ | ❌ | ❌ | ❌ |
| teams | select | ✅ | ✅ | ✅ | ✅ | ✅ |
| teams | insert/update/archive | ✅ | ✅ | ❌ | ❌ | ❌ |
| players | select | ✅ | ✅ | ✅ | ✅ | ✅ |
| players | insert/update/deactivate | ✅ | ✅ | ❌ | ❌ | ❌ |
| matches | select (all fields) | ✅ | ✅ | ✅ | ✅ | ✅ |
| matches | insert / edit result / state change | ✅ | ✅ | ✅² | ❌ | ❌ |
| match_actions | select | ✅ | ✅ | ✅ | ✅ | ✅ |
| match_actions | insert (match must be `live`) | ✅ | ✅ | ✅² | ❌ | ❌ |
| match_actions | delete+reinsert correction (pre-finish) | ✅ | ✅ | ❌ | ❌ | ❌ |
| set_scores | select | ✅ | ✅ | ✅ | ✅ | ✅ |
| set_scores | write | ✅ | ✅ | ✅² | ❌ | ❌ |

¹ Coach may invite only roles below their own (`analyst`, `player`,
`spectator`) — never `club_admin`.
² Analyst may register/edit results and score actions but may not correct
(rewrite) recorded actions.

**Anonymous (no JWT)**:
- Base tables: DENY all. No anonymous policy exists on any table.
- Public read path is exclusively `public_match_snapshot(token)` — a
  security-definer function returning only published-match fields honoring
  `identity_mode` (see `public-scoreboard-api.md`). Revoked/cancelled → empty
  snapshot.

**Invariants tested on every migration touching schema or policies**:
1. Every table has RLS enabled; `FORCE ROW LEVEL SECURITY` for owner paths.
2. Any query as any role against another org's rows returns 0 rows / error.
3. Matrix cells above behave as marked.
4. Anonymous access to base tables returns 0 rows.

Violation of any invariant fails CI (constitution I & IV).
