-- 001_core_schema: Enums y Tablas Core
-- Migración inicial para el modelo de datos de voleibol

-- ============================================
-- ENUMS POSTGRESQL
-- ============================================

CREATE TYPE organization_role AS ENUM (
    'owner',
    'admin',
    'coach',
    'parent',
    'viewer'
);

CREATE TYPE match_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'abandoned'
);

CREATE TYPE match_format AS ENUM (
    'best_of_3',
    'best_of_5'
);

CREATE TYPE fundamental AS ENUM (
    'serve',
    'reception',
    'attack',
    'block',
    'set',
    'defense'
);

CREATE TYPE serve_quality AS ENUM (
    'ace',
    'in_play',
    'error'
);

CREATE TYPE reception_quality AS ENUM (
    'excellent',
    'positive',
    'negative',
    'error'
);

CREATE TYPE attack_quality AS ENUM (
    'kill',
    'in_play',
    'error'
);

CREATE TYPE block_quality AS ENUM (
    'kill',
    'touch',
    'assisted',
    'error'
);

CREATE TYPE set_quality AS ENUM (
    'assist',
    'error'
);

CREATE TYPE defense_quality AS ENUM (
    'dig',
    'error'
);

-- court_zone como smallint con check constraint (1-18 zonas FIVB)
CREATE DOMAIN court_zone AS SMALLINT
    CHECK (VALUE >= 1 AND VALUE <= 18);

CREATE TYPE set_status AS ENUM (
    'pending',
    'in_progress',
    'completed'
);

CREATE TYPE serving_team AS ENUM (
    'home',
    'away'
);

-- ============================================
-- TABLAS CORE
-- ============================================

-- Organizaciones (multitenancy root)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Miembros de organización con roles
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role organization_role NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, user_id)
);

-- Equipos dentro de organización
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- ej: 'U18', 'Senior', 'Master'
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'mixed')),
    season TEXT NOT NULL, -- ej: '2024-2025'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jugadores (perfil, sin team_id directo - va en team_rosters)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE,
    dominant_hand TEXT CHECK (dominant_hand IN ('right', 'left', 'ambidextrous')),
    height_cm SMALLINT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rosters: asignación jugador-equipo por temporada con dorsal y posición
CREATE TABLE team_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    jersey_number SMALLINT NOT NULL CHECK (jersey_number >= 0 AND jersey_number <= 99),
    position TEXT NOT NULL CHECK (position IN ('setter', 'outside_hitter', 'middle_blocker', 'opposite', 'libero', 'defensive_specialist')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    UNIQUE (team_id, jersey_number, start_date)
);

-- Partidos
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    match_date TIMESTAMPTZ NOT NULL,
    venue TEXT,
    tournament TEXT,
    phase TEXT, -- ej: 'pool', 'quarterfinal', 'semifinal', 'final'
    format match_format NOT NULL DEFAULT 'best_of_5',
    points_per_set SMALLINT NOT NULL DEFAULT 25,
    min_point_diff SMALLINT NOT NULL DEFAULT 2,
    status match_status NOT NULL DEFAULT 'scheduled',
    current_set SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (home_team_id != away_team_id)
);

-- Sets del partido
CREATE TABLE match_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    set_number SMALLINT NOT NULL CHECK (set_number >= 1 AND set_number <= 5),
    points_home SMALLINT NOT NULL DEFAULT 0,
    points_away SMALLINT NOT NULL DEFAULT 0,
    target_points SMALLINT NOT NULL DEFAULT 25,
    min_diff SMALLINT NOT NULL DEFAULT 2,
    winner_team_id UUID REFERENCES teams(id),
    status set_status NOT NULL DEFAULT 'pending',
    current_rotation SMALLINT CHECK (current_rotation >= 1 AND current_rotation <= 6),
    serving_team serving_team,
    server_position SMALLINT CHECK (server_position >= 1 AND server_position <= 6),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE (match_id, set_number)
);

-- Eventos de juego (tabla única con discriminador fundamental)
CREATE TABLE play_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    set_number SMALLINT NOT NULL CHECK (set_number >= 1 AND set_number <= 5),
    team_id UUID NOT NULL REFERENCES teams(id),
    player_id UUID NOT NULL REFERENCES players(id),
    fundamental fundamental NOT NULL,
    quality TEXT NOT NULL, -- validado via trigger según fundamental
    rotation SMALLINT CHECK (rotation >= 1 AND rotation <= 6),
    court_zone_start court_zone,
    court_zone_end court_zone,
    block_touches SMALLINT CHECK (block_touches >= 0 AND block_touches <= 3),
    target_player_id UUID REFERENCES players(id),
    attack_type TEXT CHECK (attack_type IN ('spike', 'tip', 'roll_shot', 'setter_dump')),
    difficulty SMALLINT CHECK (difficulty >= 1 AND difficulty <= 5),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auditoría inmutable de eventos eliminados/modificados
CREATE TABLE play_event_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    play_event_id UUID NOT NULL REFERENCES play_events(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL, -- denormalizado para RLS
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ÍNDICES BÁSICOS (más en migración 003)
-- ============================================

CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_teams_org ON teams(organization_id);
CREATE INDEX idx_players_org ON players(organization_id);
CREATE INDEX idx_rosters_team ON team_rosters(team_id);
CREATE INDEX idx_rosters_player ON team_rosters(player_id);
CREATE INDEX idx_matches_org ON matches(organization_id);
CREATE INDEX idx_matches_home_team ON matches(home_team_id);
CREATE INDEX idx_matches_away_team ON matches(away_team_id);
CREATE INDEX idx_match_sets_match ON match_sets(match_id);
CREATE INDEX idx_play_events_match ON play_events(match_id);
CREATE INDEX idx_play_events_set ON play_events(match_id, set_number);
CREATE INDEX idx_play_events_player ON play_events(player_id);
CREATE INDEX idx_play_events_team ON play_events(team_id);
CREATE INDEX idx_audit_play_event ON play_event_audit(play_event_id);

-- ============================================
-- TRIGGERS DE ACTUALIZACIÓN DE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();