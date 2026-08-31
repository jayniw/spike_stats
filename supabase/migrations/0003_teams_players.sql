-- 0003_teams_players.sql — SpikeStats MVP
-- Implements teams and players entities per data-model.md and RLS access matrix.
--   * teams:    select = all org members; insert/update/archive = club_admin + coach.
--   * players:  select = all org members; insert/update/deactivate = club_admin + coach.
-- Conditional UNIQUE(team_id, number) WHERE active = true enforced via partial index.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.player_position as enum
  ('setter', 'opposite', 'middle', 'receiver', 'libero');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  category text not null check (char_length(category) between 1 and 40),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  number int not null check (number between 1 and 99),
  position public.player_position not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_teams_organization_id on public.teams (organization_id);
create index idx_players_organization_id on public.players (organization_id);
create index idx_players_team_id on public.players (team_id);

-- Partial unique index: duplicate dorsal rejected only among active players (FR-008).
-- Archived players (active=false) do not block reuse of a dorsal number.
create unique index idx_players_active_dorsal
  on public.players (team_id, number)
  where active = true;

-- ---------------------------------------------------------------------------
-- RLS: enable + force on every table
-- ---------------------------------------------------------------------------
alter table public.teams enable row level security;
alter table public.teams force row level security;

alter table public.players enable row level security;
alter table public.players force row level security;

-- ---------------------------------------------------------------------------
-- Teams — policies
-- SELECT: any org member can view teams
-- ---------------------------------------------------------------------------
create policy "teams_select_own"
  on public.teams
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- INSERT: club_admin + coach
create policy "teams_insert_coach_admin"
  on public.teams
  for insert
  to authenticated
  with check (public.has_org_role(organization_id, array['club_admin', 'coach']::membership_role[]));

-- UPDATE: club_admin + coach (covers name, category, archived_at)
create policy "teams_update_coach_admin"
  on public.teams
  for update
  to authenticated
  using (public.has_org_role(organization_id, array['club_admin', 'coach']::membership_role[]))
  with check (public.has_org_role(organization_id, array['club_admin', 'coach']::membership_role[]));

-- DELETE: not allowed (archive only); deny all
create policy "teams_delete_deny"
  on public.teams
  for delete
  to authenticated
  using (false);

-- ---------------------------------------------------------------------------
-- Players — policies
-- SELECT: any org member can view players
-- ---------------------------------------------------------------------------
create policy "players_select_own"
  on public.players
  for select
  to authenticated
  using (public.is_org_member(organization_id));

-- INSERT: club_admin + coach
create policy "players_insert_coach_admin"
  on public.players
  for insert
  to authenticated
  with check (public.has_org_role(organization_id, array['club_admin', 'coach']::membership_role[]));

-- UPDATE: club_admin + coach
create policy "players_update_coach_admin"
  on public.players
  for update
  to authenticated
  using (public.has_org_role(organization_id, array['club_admin', 'coach']::membership_role[]))
  with check (public.has_org_role(organization_id, array['club_admin', 'coach']::membership_role[]));

-- DELETE: not allowed (deactivate only); deny all
create policy "players_delete_deny"
  on public.players
  for delete
  to authenticated
  using (false);
