# Contract: Public Scoreboard API

**Feature**: `001-spikestats-mvp` | **Date**: 2026-08-23
Anonymous, read-only, token-keyed exposure of a live match (FR-020..FR-022).
No authentication. Identity of players obeys the match's `identity_mode`
(default `dorsal_only` — Clarification Q1).

## REST route

### `GET /api/public/match/{share_token}`

Returns the current snapshot used for first paint; subsequent updates arrive
over Supabase Realtime (below).

**200 OK**
```json
{
  "match": {
    "status": "live",
    "rival": "Club Atlético Río",
    "played_on": "2026-08-23",
    "is_home": true,
    "sets": [
      { "set_number": 1, "points_for": 25, "points_against": 20 },
      { "set_number": 2, "points_for": 23, "points_against": 21, "in_progress": true }
    ],
    "identity_mode": "dorsal_only"
  },
  "recent_actions": [
    {
      "seq": 148,
      "set_number": 2,
      "skill": "attack",
      "outcome": "point",
      "player": { "number": 7 }
    }
  ]
}
```

`player` shape depends on `identity_mode`:
- `dorsal_only`: `{ "number": 7 }`
- `full_name`: `{ "number": 7, "name": "Martina Gómez" }`

**Error responses**
| Status | When |
|---|---|
| 404 | unknown token |
| 403 | `share_enabled=false` (revoked/private) or status `cancelled` |
| 200 | finished matches keep serving final snapshot |

## Realtime channel

- Channel: `public:match:{share_token}` — a broadcast relay of inserted
  actions, NOT direct table subscription by anonymous clients.
- Event payload per action = one element of `recent_actions` (same shape).
- Emitted within the realtime path already budgeted at <5 s p95 (SC-004).
- On set close, a `set_closed` event carries final `{set_number, points_for,
  points_against}`.

## Rules

1. Snapshot and events NEVER include fields outside this contract
   (no emails, no opponent roster identities beyond numbers, no org name).
2. Token is unguessable (≥128-bit entropy) and revocable by flipping
   `share_enabled` (FR-022) — revoked tokens answer 403 immediately.
3. Contract tests cover: valid live fetch, finished fetch, revoked → 403,
   cancelled → 403, unknown → 404, identity_mode both variants, and that no
   extra fields leak.
