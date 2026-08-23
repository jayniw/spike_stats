# Contract: Offline Sync Protocol

**Feature**: `001-spikestats-mvp` | **Date**: 2026-08-23
Defines the append-only action pipeline between the live-scoring client and
Supabase (constitution III; FR-013..FR-019). Zero loss, zero duplication,
order preserved.

## Action envelope (client → server)

```jsonc
{
  "client_action_id": "018f6d2a-...",   // UUIDv7, generated at capture time
  "match_id": "uuid",
  "set_number": 2,
  "player_id": "uuid",
  "skill": "attack",                     // serve|reception|set_pass|attack|block|dig
  "outcome": "point",                    // point|error|rally_continues
  "recorded_at": "2026-08-23T15:04:05.123Z",
  "recorded_offline": false
}
```

## Write semantics

1. **Local-first**: every captured action is committed to the IndexedDB
   outbox with its `client_action_id` BEFORE any network attempt; UI confirms
   capture locally and marks sync state (`pending`/`synced`) — FR-018.
2. **Idempotent upsert**: drain performs `INSERT … ON CONFLICT
   (client_action_id) DO NOTHING` in local-queue order. Server `UNIQUE`
   constraint on `client_action_id` is the duplication firewall.
3. **Ordering**: server assigns `seq` (bigserial) on insert; statistical and
   display order always follows `(seq)` — never client timestamps (D4).
4. **Reconnect handshake**: after connectivity returns, the client requests
   the match's current max `seq`; it then drains pending actions oldest-first.
   If a returned count indicates actions the client lacks (e.g., scored from
   another device pre-lockout), the client pulls the missing slice before
   resuming scoring view.
5. **Single active scorer** (FR-019): starting a session claims the match's
   scorer slot (`status='live'` transition); a second device opening the same
   match receives read-only mode with a clear notice.

## Failure handling

| Case | Behavior |
|---|---|
| Network drop mid-drain | remaining queue intact; retried with backoff |
| 4xx validation rejection | item quarantined with visible error badge; never silently dropped; coach can fix or discard explicitly |
| App killed offline | outbox persists in IndexedDB; drained on next open+connect |
| Duplicate replay after partial ack | `DO NOTHING` → treated as success |

## Correction protocol (FR-017)

Undo/correct = delete last own inserted action(s) by `client_action_id` +
reinsert corrected rows, permitted only while the match is not finished.
Corrections are coach/admin only (see RLS matrix).

## Test hooks (contract tests)

- Replay N queued actions twice → exactly N rows, seq contiguous.
- Interleaved offline captures preserve capture order in `seq`.
- Second-device claim while first active → read-only flag returned.
- Quarantine path surfaces explicit error state (no silent drop).
