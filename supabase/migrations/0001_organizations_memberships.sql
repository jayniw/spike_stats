-- 0001_organizations_memberships.sql — SpikeStats MVP
-- Implements the entities defined in specs/001-spikestats-mvp/data-model.md
-- (organizations, memberships, invites) and the permission cells of the
-- executable spec specs/001-spikestats-mvp/contracts/rls-access-matrix.md:
--   * organizations (own): select = every member; update/delete = club_admin.
--   * memberships:         select = every member; insert/update/delete = club_admin.
--   * invites:             select/insert/cancel = club_admin + coach, where coach
--                          may only invite 'analyst','player','spectator' (note ¹).
-- Anonymous is denied on all base tables: RLS enabled AND forced everywhere,
-- no anonymous policies, and helper functions are not executable by anon/public.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.membership_role as enum
  ('club_admin', 'coach', 'analyst', 'player', 'spectator');

create type public.membership_status as enum ('invited', 'active', 'revoked');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'invited',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email citext not null,
  role public.membership_role not null,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index organization_id on every table that carries it; organizations.id is
-- already served by its primary-key index.
create index idx_memberships_organization_id on public.memberships (organization_id);
create index idx_invites_organization_id on public.invites (organization_id);

-- ---------------------------------------------------------------------------
-- RLS helpers — reusable by future migrations (0002+ teams/players/matches).
-- SECURITY DEFINER so policies evaluate membership without recursing into
-- RLS-protected tables; STABLE so each statement sees one consistent snapshot.
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_org_role(org uuid, roles public.membership_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (roles)
  );
$$;

-- Anon must never pass: strip default PUBLIC execute, then grant explicitly.
revoke execute on function public.is_org_member(uuid) from anon, public;
revoke execute on function public.has_org_role(uuid, public.membership_role[]) from anon, public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, public.membership_role[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: enable + force on every table (matrix invariants 1 & 4)
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organizations force row level security;

alter table public.memberships enable row level security;
alter table public.memberships force row level security;

alter table public.invites enable row level security;
alter table public.invites force row level security;

-- organizations -------------------------------------------------------------
create policy "org_select_own"
  on public.organizations
  for select
  to authenticated
  using (public.is_org_member(id));

create policy "org_admin_update"
  on public.organizations
  for update
  to authenticated
  using (public.has_org_role(id, array['club_admin']::membership_role[]))
  with check (public.has_org_role(id, array['club_admin']::membership_role[]));

create policy "org_admin_delete"
  on public.organizations
  for delete
  to authenticated
  using (public.has_org_role(id, array['club_admin']::membership_role[]));

-- memberships ---------------------------------------------------------------
create policy "memberships_select_own"
  on public.memberships
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "memberships_admin_insert"
  on public.memberships
  for insert
  to authenticated
  with check (public.has_org_role(organization_id, array['club_admin']::membership_role[]));

create policy "memberships_admin_update"
  on public.memberships
  for update
  to authenticated
  using (public.has_org_role(organization_id, array['club_admin']::membership_role[]))
  with check (public.has_org_role(organization_id, array['club_admin']::membership_role[]));

create policy "memberships_admin_delete"
  on public.memberships
  for delete
  to authenticated
  using (public.has_org_role(organization_id, array['club_admin']::membership_role[]));

-- invites --------------------------------------------------------------------
create policy "invites_admin_coach_select"
  on public.invites
  for select
  to authenticated
  using (public.has_org_role(organization_id, array['club_admin', 'coach']::membership_role[]));

create policy "invites_insert_role_scoped"
  on public.invites
  for insert
  to authenticated
  with check (
    public.has_org_role(organization_id, array['club_admin']::membership_role[])
    or (
      public.has_org_role(organization_id, array['coach']::membership_role[])
      and role in ('analyst', 'player', 'spectator')
    )
  );

create policy "invites_admin_coach_delete"
  on public.invites
  for delete
  to authenticated
  using (public.has_org_role(organization_id, array['club_admin', 'coach']::membership_role[]));
