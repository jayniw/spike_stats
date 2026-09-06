-- 003_triggers_rpcs_indexes: Triggers, RPCs e Índices Compuestos
-- Validación de combinaciones fundamental/quality, recálculo de marcador, auditoría, RPCs de stats

-- ============================================
-- FUNCIÓN validate_fundamental_quality()
-- Valida que la combinación fundamental + quality sea válida
-- ============================================

CREATE OR REPLACE FUNCTION validate_fundamental_quality()
RETURNS TRIGGER AS $$
DECLARE
    valid_combination BOOLEAN := FALSE;
BEGIN
    CASE NEW.fundamental
        WHEN 'serve' THEN
            valid_combination := NEW.quality IN ('ace', 'in_play', 'error');
        WHEN 'reception' THEN
            valid_combination := NEW.quality IN ('excellent', 'positive', 'negative', 'error');
        WHEN 'attack' THEN
            valid_combination := NEW.quality IN ('kill', 'in_play', 'error');
        WHEN 'block' THEN
            valid_combination := NEW.quality IN ('kill', 'touch', 'assisted', 'error');
        WHEN 'set' THEN
            valid_combination := NEW.quality IN ('assist', 'error');
        WHEN 'defense' THEN
            valid_combination := NEW.quality IN ('dig', 'error');
        ELSE
            valid_combination := FALSE;
    END CASE;

    IF NOT valid_combination THEN
        RAISE EXCEPTION 'Combinación inválida: fundamental=% quality=%', NEW.fundamental, NEW.quality
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger BEFORE INSERT en play_events
DROP TRIGGER IF EXISTS validate_fundamental_quality_trigger ON play_events;
CREATE TRIGGER validate_fundamental_quality_trigger
    BEFORE INSERT ON play_events
    FOR EACH ROW EXECUTE FUNCTION validate_fundamental_quality();

-- ============================================
-- FUNCIÓN recalculate_set_score()
-- Actualiza points_home/points_away en match_sets basado en eventos de punto
-- Se ejecuta como trigger, accede a NEW/OLD internamente
-- ============================================

CREATE OR REPLACE FUNCTION recalculate_set_score()
RETURNS TRIGGER AS $$
DECLARE
    v_points_home SMALLINT := 0;
    v_points_away SMALLINT := 0;
    v_home_team_id UUID;
    v_away_team_id UUID;
    v_match_id UUID;
    v_set_number SMALLINT;
BEGIN
    -- Usar NEW para INSERT, OLD para DELETE
    IF TG_OP = 'INSERT' THEN
        v_match_id := NEW.match_id;
        v_set_number := NEW.set_number;
    ELSE
        v_match_id := OLD.match_id;
        v_set_number := OLD.set_number;
    END IF;

    -- Obtener home_team_id y away_team_id del partido
    SELECT home_team_id, away_team_id
    INTO v_home_team_id, v_away_team_id
    FROM matches WHERE id = v_match_id;

    -- Contar puntos para home team
    SELECT COUNT(*)::SMALLINT
    INTO v_points_home
    FROM play_events
    WHERE match_id = v_match_id
    AND set_number = v_set_number
    AND team_id = v_home_team_id
    AND quality IN ('ace', 'kill', 'block_kill', 'opponent_error');

    -- Contar puntos para away team
    SELECT COUNT(*)::SMALLINT
    INTO v_points_away
    FROM play_events
    WHERE match_id = v_match_id
    AND set_number = v_set_number
    AND team_id = v_away_team_id
    AND quality IN ('ace', 'kill', 'block_kill', 'opponent_error');

    -- Actualizar match_sets
    UPDATE match_sets
    SET points_home = v_points_home,
        points_away = v_points_away
    WHERE match_id = v_match_id AND set_number = v_set_number;

    RETURN NULL; -- AFTER trigger no necesita retornar
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger AFTER INSERT OR DELETE en play_events
DROP TRIGGER IF EXISTS recalculate_score_trigger ON play_events;
CREATE TRIGGER recalculate_score_trigger
    AFTER INSERT OR DELETE ON play_events
    FOR EACH ROW EXECUTE FUNCTION recalculate_set_score();

-- ============================================
-- TRIGGER AUDITORÍA: AFTER DELETE en play_events
-- ============================================

CREATE OR REPLACE FUNCTION audit_play_event_delete()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO play_event_audit (play_event_id, organization_id, action, old_data, user_id)
    VALUES (OLD.id, OLD.organization_id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS audit_play_event_delete_trigger ON play_events;
CREATE TRIGGER audit_play_event_delete_trigger
    AFTER DELETE ON play_events
    FOR EACH ROW EXECUTE FUNCTION audit_play_event_delete();

-- ============================================
-- RPC: get_player_match_stats
-- Retorna estadísticas completas de un jugador en un partido
-- ============================================

CREATE OR REPLACE FUNCTION get_player_match_stats(p_match_id UUID, p_player_id UUID)
RETURNS TABLE (
    -- Recepción
    receptions_total BIGINT,
    receptions_excellent BIGINT,
    receptions_positive BIGINT,
    receptions_negative BIGINT,
    receptions_error BIGINT,
    reception_rating NUMERIC,
    -- Ataque
    attacks_total BIGINT,
    attacks_kills BIGINT,
    attacks_errors BIGINT,
    attacks_in_play BIGINT,
    attack_efficiency NUMERIC,
    -- Bloqueo
    blocks_total BIGINT,
    blocks_kills BIGINT,
    blocks_touches BIGINT,
    blocks_assisted BIGINT,
    blocks_errors BIGINT,
    -- Colocación
    sets_total BIGINT,
    sets_assists BIGINT,
    sets_errors BIGINT,
    -- Defensa
    defenses_total BIGINT,
    defenses_digs BIGINT,
    defenses_errors BIGINT
) AS $$
DECLARE
    v_rec RECORD;
    v_att RECORD;
    v_blk RECORD;
    v_set RECORD;
    v_def RECORD;
BEGIN
    -- Recepción
    SELECT
        COUNT(*) FILTER (WHERE quality = 'excellent') AS excellent,
        COUNT(*) FILTER (WHERE quality = 'positive') AS positive,
        COUNT(*) FILTER (WHERE quality = 'negative') AS negative,
        COUNT(*) FILTER (WHERE quality = 'error') AS error,
        COUNT(*) AS total
    INTO v_rec
    FROM play_events
    WHERE match_id = p_match_id AND player_id = p_player_id AND fundamental = 'reception';

    -- Ataque
    SELECT
        COUNT(*) FILTER (WHERE quality = 'kill') AS kills,
        COUNT(*) FILTER (WHERE quality = 'error') AS errors,
        COUNT(*) FILTER (WHERE quality = 'in_play') AS in_play,
        COUNT(*) AS total
    INTO v_att
    FROM play_events
    WHERE match_id = p_match_id AND player_id = p_player_id AND fundamental = 'attack';

    -- Bloqueo
    SELECT
        COUNT(*) FILTER (WHERE quality = 'kill') AS kills,
        COUNT(*) FILTER (WHERE quality = 'touch') AS touches,
        COUNT(*) FILTER (WHERE quality = 'assisted') AS assisted,
        COUNT(*) FILTER (WHERE quality = 'error') AS errors,
        COUNT(*) AS total
    INTO v_blk
    FROM play_events
    WHERE match_id = p_match_id AND player_id = p_player_id AND fundamental = 'block';

    -- Colocación
    SELECT
        COUNT(*) FILTER (WHERE quality = 'assist') AS assists,
        COUNT(*) FILTER (WHERE quality = 'error') AS errors,
        COUNT(*) AS total
    INTO v_set
    FROM play_events
    WHERE match_id = p_match_id AND player_id = p_player_id AND fundamental = 'set';

    -- Defensa
    SELECT
        COUNT(*) FILTER (WHERE quality = 'dig') AS digs,
        COUNT(*) FILTER (WHERE quality = 'error') AS errors,
        COUNT(*) AS total
    INTO v_def
    FROM play_events
    WHERE match_id = p_match_id AND player_id = p_player_id AND fundamental = 'defense';

    RETURN QUERY SELECT
        COALESCE(v_rec.total, 0),
        COALESCE(v_rec.excellent, 0),
        COALESCE(v_rec.positive, 0),
        COALESCE(v_rec.negative, 0),
        COALESCE(v_rec.error, 0),
        CASE WHEN COALESCE(v_rec.total, 0) > 0
            THEN ROUND((COALESCE(v_rec.excellent, 0) * 3 + COALESCE(v_rec.positive, 0) * 2 + COALESCE(v_rec.negative, 0) * 1)::NUMERIC / COALESCE(v_rec.total, 1), 2)
            ELSE 0 END,
        COALESCE(v_att.total, 0),
        COALESCE(v_att.kills, 0),
        COALESCE(v_att.errors, 0),
        COALESCE(v_att.in_play, 0),
        CASE WHEN COALESCE(v_att.total, 0) > 0
            THEN ROUND((COALESCE(v_att.kills, 0) - COALESCE(v_att.errors, 0))::NUMERIC / COALESCE(v_att.total, 1), 3)
            ELSE 0 END,
        COALESCE(v_blk.total, 0),
        COALESCE(v_blk.kills, 0),
        COALESCE(v_blk.touches, 0),
        COALESCE(v_blk.assisted, 0),
        COALESCE(v_blk.errors, 0),
        COALESCE(v_set.total, 0),
        COALESCE(v_set.assists, 0),
        COALESCE(v_set.errors, 0),
        COALESCE(v_def.total, 0),
        COALESCE(v_def.digs, 0),
        COALESCE(v_def.errors, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- RPC: get_team_match_stats
-- Estadísticas agregadas por equipo en un partido
-- ============================================

CREATE OR REPLACE FUNCTION get_team_match_stats(p_match_id UUID, p_team_id UUID)
RETURNS TABLE (
    fundamental TEXT,
    quality TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.fundamental::TEXT,
        pe.quality::TEXT,
        COUNT(*)::BIGINT
    FROM play_events pe
    WHERE pe.match_id = p_match_id
    AND pe.team_id = p_team_id
    GROUP BY pe.fundamental, pe.quality
    ORDER BY pe.fundamental, pe.quality;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- RPC: get_player_season_stats
-- Estadísticas acumuladas de un jugador por temporada
-- ============================================

CREATE OR REPLACE FUNCTION get_player_season_stats(p_player_id UUID, p_season TEXT)
RETURNS TABLE (
    match_id UUID,
    match_date TIMESTAMPTZ,
    opponent_team_name TEXT,
    is_home BOOLEAN,
    -- Recepción
    receptions_total BIGINT,
    receptions_excellent BIGINT,
    receptions_positive BIGINT,
    receptions_negative BIGINT,
    receptions_error BIGINT,
    reception_rating NUMERIC,
    -- Ataque
    attacks_total BIGINT,
    attacks_kills BIGINT,
    attacks_errors BIGINT,
    attacks_in_play BIGINT,
    attack_efficiency NUMERIC,
    -- Bloqueo
    blocks_total BIGINT,
    blocks_kills BIGINT,
    blocks_touches BIGINT,
    blocks_assisted BIGINT,
    blocks_errors BIGINT,
    -- Colocación
    sets_total BIGINT,
    sets_assists BIGINT,
    sets_errors BIGINT,
    -- Defensa
    defenses_total BIGINT,
    defenses_digs BIGINT,
    defenses_errors BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id AS match_id,
        m.match_date,
        CASE WHEN m.home_team_id = t.id THEN a.name ELSE h.name END AS opponent_team_name,
        (m.home_team_id = t.id) AS is_home,
        -- Recepción
        COALESCE(stats.receptions_total, 0),
        COALESCE(stats.receptions_excellent, 0),
        COALESCE(stats.receptions_positive, 0),
        COALESCE(stats.receptions_negative, 0),
        COALESCE(stats.receptions_error, 0),
        CASE WHEN COALESCE(stats.receptions_total, 0) > 0
            THEN ROUND((COALESCE(stats.receptions_excellent, 0) * 3 + COALESCE(stats.receptions_positive, 0) * 2 + COALESCE(stats.receptions_negative, 0) * 1)::NUMERIC / COALESCE(stats.receptions_total, 1), 2)
            ELSE 0 END,
        -- Ataque
        COALESCE(stats.attacks_total, 0),
        COALESCE(stats.attacks_kills, 0),
        COALESCE(stats.attacks_errors, 0),
        COALESCE(stats.attacks_in_play, 0),
        CASE WHEN COALESCE(stats.attacks_total, 0) > 0
            THEN ROUND((COALESCE(stats.attacks_kills, 0) - COALESCE(stats.attacks_errors, 0))::NUMERIC / COALESCE(stats.attacks_total, 1), 3)
            ELSE 0 END,
        -- Bloqueo
        COALESCE(stats.blocks_total, 0),
        COALESCE(stats.blocks_kills, 0),
        COALESCE(stats.blocks_touches, 0),
        COALESCE(stats.blocks_assisted, 0),
        COALESCE(stats.blocks_errors, 0),
        -- Colocación
        COALESCE(stats.sets_total, 0),
        COALESCE(stats.sets_assists, 0),
        COALESCE(stats.sets_errors, 0),
        -- Defensa
        COALESCE(stats.defenses_total, 0),
        COALESCE(stats.defenses_digs, 0),
        COALESCE(stats.defenses_errors, 0)
    FROM matches m
    JOIN teams t ON (m.home_team_id = t.id OR m.away_team_id = t.id)
    JOIN team_rosters tr ON tr.team_id = t.id AND tr.player_id = p_player_id
    JOIN teams h ON h.id = m.home_team_id
    JOIN teams a ON a.id = m.away_team_id
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*) FILTER (WHERE fundamental = 'reception' AND quality = 'excellent') AS receptions_excellent,
            COUNT(*) FILTER (WHERE fundamental = 'reception' AND quality = 'positive') AS receptions_positive,
            COUNT(*) FILTER (WHERE fundamental = 'reception' AND quality = 'negative') AS receptions_negative,
            COUNT(*) FILTER (WHERE fundamental = 'reception' AND quality = 'error') AS receptions_error,
            COUNT(*) FILTER (WHERE fundamental = 'reception') AS receptions_total,
            COUNT(*) FILTER (WHERE fundamental = 'attack' AND quality = 'kill') AS attacks_kills,
            COUNT(*) FILTER (WHERE fundamental = 'attack' AND quality = 'error') AS attacks_errors,
            COUNT(*) FILTER (WHERE fundamental = 'attack' AND quality = 'in_play') AS attacks_in_play,
            COUNT(*) FILTER (WHERE fundamental = 'attack') AS attacks_total,
            COUNT(*) FILTER (WHERE fundamental = 'block' AND quality = 'kill') AS blocks_kills,
            COUNT(*) FILTER (WHERE fundamental = 'block' AND quality = 'touch') AS blocks_touches,
            COUNT(*) FILTER (WHERE fundamental = 'block' AND quality = 'assisted') AS blocks_assisted,
            COUNT(*) FILTER (WHERE fundamental = 'block' AND quality = 'error') AS blocks_errors,
            COUNT(*) FILTER (WHERE fundamental = 'block') AS blocks_total,
            COUNT(*) FILTER (WHERE fundamental = 'set' AND quality = 'assist') AS sets_assists,
            COUNT(*) FILTER (WHERE fundamental = 'set' AND quality = 'error') AS sets_errors,
            COUNT(*) FILTER (WHERE fundamental = 'set') AS sets_total,
            COUNT(*) FILTER (WHERE fundamental = 'defense' AND quality = 'dig') AS defenses_digs,
            COUNT(*) FILTER (WHERE fundamental = 'defense' AND quality = 'error') AS defenses_errors,
            COUNT(*) FILTER (WHERE fundamental = 'defense') AS defenses_total
        FROM play_events pe
        WHERE pe.match_id = m.id AND pe.player_id = p_player_id
    ) stats ON TRUE
    WHERE t.season = p_season
    AND m.status = 'completed'
    ORDER BY m.match_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- ÍNDICES COMPUESTOS PARA CONSULTAS DE TIEMPO REAL Y REPORTES
-- ============================================

-- Eventos por partido + set + tiempo (para Realtime y timeline)
CREATE INDEX IF NOT EXISTS idx_play_events_match_set_time
    ON play_events (match_id, set_number, created_at);

-- Eventos por jugador + partido (para stats de jugador)
CREATE INDEX IF NOT EXISTS idx_play_events_player_match
    ON play_events (player_id, match_id);

-- Eventos por fundamental + quality (para agregaciones)
CREATE INDEX IF NOT EXISTS idx_play_events_fundamental_quality
    ON play_events (fundamental, quality);

-- Sets por partido (para marcador)
CREATE INDEX IF NOT EXISTS idx_match_sets_match_set
    ON match_sets (match_id, set_number);

-- Equipos por org + temporada
CREATE INDEX IF NOT EXISTS idx_teams_org_season
    ON teams (organization_id, season);

-- Rosters por team + player
CREATE INDEX IF NOT EXISTS idx_rosters_team_player
    ON team_rosters (team_id, player_id);

-- Auditoría por play_event
CREATE INDEX IF NOT EXISTS idx_audit_play_event
    ON play_event_audit (play_event_id);

-- ============================================
-- GRANTS PARA RPCs
-- ============================================

GRANT EXECUTE ON FUNCTION get_player_match_stats(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_team_match_stats(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_player_season_stats(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION recalculate_set_score() TO anon, authenticated, service_role;