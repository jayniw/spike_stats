<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## ⚠️ Spike Stats - Agent Rules

### 🔴 GIT WORKFLOW - MANDATORY
- **NEVER push to remote without explicit user confirmation**
- Commit locally → show summary → wait for "push" / "deploy" / "ok" before `git push`
- This includes Vercel deployments (triggered by push to `develop`)

### Git Workflow
- **Always ask for confirmation before pushing to remote** (`git push origin <branch>`)
- Commit locally first, show summary, wait for explicit "push" or "deploy" approval

### Commands
```bash
# Typecheck (run before commit)
npx tsc --noEmit

# Dev server
npm run dev

# Generate Supabase types (after DB migrations)
npx supabase gen types typescript --project-id zssttxbjnmoqwoermlld > src/types/database.ts
```

### Architecture
- **Next.js 16 + Turbopack** (App Router, Server Components by default)
- **Supabase** for Auth, DB, Realtime
- **Zustand** for local match state (persisted)
- **React Query** for server state
- **shadcn/ui** + Tailwind for UI

### Key Paths
- `app/matches/[matchId]/page.tsx` - Live match page
- `components/organisms/Scoreboard.tsx` - Scoreboard with set navigation
- `components/organisms/EventGrid.tsx` - Event buttons (fundamentals)
- `hooks/useMatchActions.ts` - Mutations (insertEvent, advanceSet, etc.)
- `stores/matchStore.ts` - Zustand store for match state
- `src/types/volleyball.ts` - Domain types (PlayerMatchStatsDetail, etc.)
- `supabase/migrations/` - SQL migrations (apply via Supabase CLI)

### Match Flow
1. Scheduled → Start Match → creates sets in DB
2. In Progress → Scoreboard (tap +1, swipe -1, long-press lock) + EventGrid
3. Lock set → shows "››" center button → advance to next set
4. Complete → finalize match

### DB Functions (RPCs)
- `get_player_match_stats(match_id, player_id)` - match stats with serve + attack breakdown
- `get_player_season_stats(player_id, season)` - season aggregates
- `validate_fundamental_quality()` - trigger validates fundamental/quality combos

### Attack Qualities (5)
`kill` | `in_play` | `blocked` | `out` | `net` - all count as errors for efficiency

### Supabase Project
- URL: `https://zssttxbjnmoqwoermlld.supabase.co`
- Project ID: `zssttxbjnmoqwoermlld`
- Vercel auto-deploys on push to `develop`