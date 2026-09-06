-- 002_rls_policies: Row Level Security, Policies y Funciones Auth
-- Habilita RLS en todas las tablas y crea policies para aislamiento multitenant

-- ============================================
-- FUNCIÓN current_org() PARA RLS
-- ============================================

CREATE OR REPLACE FUNCTION current_org()
RETURNS UUID AS $$
DECLARE
    org_id_text TEXT;
BEGIN
    -- Leer org_id del JWT custom claim
    org_id_text := auth.jwt() ->> 'org_id';
    IF org_id_text IS NULL OR org_id_text = '' THEN
        RETURN NULL;
    END IF;
    RETURN org_id_text::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION current_org() IS 'Retorna el organization_id del JWT claim "org_id". Usado en policies RLS para aislamiento multitenant.';

-- ============================================
-- AÑADIR organization_id A TABLAS QUE LO NECESITAN
-- ============================================

-- match_sets: añadir organization_id para RLS directo
ALTER TABLE match_sets ADD COLUMN organization_id UUID NOT NULL DEFAULT current_org();

-- play_events: añadir organization_id para RLS directo (denormalizado)
ALTER TABLE play_events ADD COLUMN organization_id UUID NOT NULL DEFAULT current_org();

-- ============================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_event_audit ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- organizations: solo la org propia
CREATE POLICY organizations_select ON organizations
    FOR SELECT USING (id = current_org());

CREATE POLICY organizations_insert ON organizations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY organizations_update ON organizations
    FOR UPDATE USING (id = current_org()) WITH CHECK (id = current_org());

CREATE POLICY organizations_delete ON organizations
    FOR DELETE USING (id = current_org() AND owner_id = auth.uid());

-- organization_members: miembros de la org
CREATE POLICY org_members_select ON organization_members
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY org_members_insert ON organization_members
    FOR INSERT WITH CHECK (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

CREATE POLICY org_members_update ON organization_members
    FOR UPDATE USING (organization_id = current_org()) WITH CHECK (organization_id = current_org());

CREATE POLICY org_members_delete ON organization_members
    FOR DELETE USING (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- teams: CRUD por organización
CREATE POLICY teams_select ON teams
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY teams_insert ON teams
    FOR INSERT WITH CHECK (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'coach')
        )
    );

CREATE POLICY teams_update ON teams
    FOR UPDATE USING (organization_id = current_org()) WITH CHECK (organization_id = current_org());

CREATE POLICY teams_delete ON teams
    FOR DELETE USING (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- players: CRUD por organización
CREATE POLICY players_select ON players
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY players_insert ON players
    FOR INSERT WITH CHECK (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'coach')
        )
    );

CREATE POLICY players_update ON players
    FOR UPDATE USING (organization_id = current_org()) WITH CHECK (organization_id = current_org());

CREATE POLICY players_delete ON players
    FOR DELETE USING (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'coach')
        )
    );

-- team_rosters: CRUD por organización (via team.organization_id)
CREATE POLICY rosters_select ON team_rosters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_rosters.team_id
            AND t.organization_id = current_org()
        )
    );

CREATE POLICY rosters_insert ON team_rosters
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_rosters.team_id
            AND t.organization_id = current_org()
        )
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'coach')
        )
    );

CREATE POLICY rosters_update ON team_rosters
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_rosters.team_id
            AND t.organization_id = current_org()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_rosters.team_id
            AND t.organization_id = current_org()
        )
    );

CREATE POLICY rosters_delete ON team_rosters
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams t
            WHERE t.id = team_rosters.team_id
            AND t.organization_id = current_org()
        )
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'coach')
        )
    );

-- matches: CRUD por organización
CREATE POLICY matches_select ON matches
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY matches_insert ON matches
    FOR INSERT WITH CHECK (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'coach')
        )
    );

CREATE POLICY matches_update ON matches
    FOR UPDATE USING (organization_id = current_org()) WITH CHECK (organization_id = current_org());

CREATE POLICY matches_delete ON matches
    FOR DELETE USING (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- match_sets: CRUD por organización (columna denormalizada)
CREATE POLICY match_sets_select ON match_sets
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY match_sets_insert ON match_sets
    FOR INSERT WITH CHECK (organization_id = current_org());

CREATE POLICY match_sets_update ON match_sets
    FOR UPDATE USING (organization_id = current_org()) WITH CHECK (organization_id = current_org());

CREATE POLICY match_sets_delete ON match_sets
    FOR DELETE USING (organization_id = current_org());

-- play_events: CRUD por organización (columna denormalizada)
CREATE POLICY play_events_select ON play_events
    FOR SELECT USING (organization_id = current_org());

CREATE POLICY play_events_insert ON play_events
    FOR INSERT WITH CHECK (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'coach', 'parent')
        )
    );

CREATE POLICY play_events_update ON play_events
    FOR UPDATE USING (organization_id = current_org()) WITH CHECK (organization_id = current_org());

CREATE POLICY play_events_delete ON play_events
    FOR DELETE USING (
        organization_id = current_org()
        AND EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = current_org()
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin', 'coach')
        )
    );

-- play_event_audit: solo select por organización (append-only via trigger)
CREATE POLICY audit_select ON play_event_audit
    FOR SELECT USING (organization_id = current_org());

-- Nota: audit es append-only, no se permiten INSERT/UPDATE/DELETE directos
-- Los inserts vienen del trigger AFTER DELETE en play_events

-- ============================================
-- TRIGGER PARA POBLAR organization_id AUTOMÁTICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION set_organization_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'play_events' THEN
        -- Obtener organization_id desde matches
        NEW.organization_id := (
            SELECT organization_id FROM matches WHERE id = NEW.match_id
        );
    ELSIF TG_TABLE_NAME = 'match_sets' THEN
        -- Obtener organization_id desde matches
        NEW.organization_id := (
            SELECT organization_id FROM matches WHERE id = NEW.match_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_org_id_play_events
    BEFORE INSERT ON play_events
    FOR EACH ROW EXECUTE FUNCTION set_organization_id_on_insert();

CREATE TRIGGER set_org_id_match_sets
    BEFORE INSERT ON match_sets
    FOR EACH ROW EXECUTE FUNCTION set_organization_id_on_insert();

-- ============================================
-- ÍNDICES PARA RLS (organization_id)
-- ============================================

CREATE INDEX idx_match_sets_org ON match_sets(organization_id);
CREATE INDEX idx_play_events_org ON play_events(organization_id);
CREATE INDEX idx_audit_org ON play_event_audit(organization_id);

-- ============================================
-- GRANTS PARA ROLES DE SUPABASE
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON organizations TO anon, authenticated;
GRANT SELECT ON organization_members TO anon, authenticated;
GRANT SELECT ON teams TO anon, authenticated;
GRANT SELECT ON players TO anon, authenticated;
GRANT SELECT ON team_rosters TO anon, authenticated;
GRANT SELECT ON matches TO anon, authenticated;
GRANT SELECT ON match_sets TO anon, authenticated;
GRANT SELECT ON play_events TO anon, authenticated;
GRANT SELECT ON play_event_audit TO anon, authenticated;