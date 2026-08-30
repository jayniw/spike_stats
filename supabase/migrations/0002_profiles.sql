-- 0002_profiles.sql — Perfiles de usuario
-- Almacena información pública del usuario más allá de auth.users.
-- phone se usa para automatización por WhatsApp (futuro).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil público del usuario; auth.users tiene email/password>';

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- SELECT: cualquier miembro autenticado puede ver perfiles (para listas de miembros)
create policy "profiles_select_any_member"
  on public.profiles
  for select
  to authenticated
  using (true);

-- UPDATE: solo el propio usuario puede actualizar su perfil
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- INSERT: solo el propio usuario puede crear su perfil (onboarding)
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());
