-- Seed completo desde cero: org, owner, equipos, jugadores, rosters, partido, sets
-- User ID: e9b9dea5-0f8b-4855-8962-4d8873f2a3cf

DO $$
DECLARE
    v_user_id UUID := 'e9b9dea5-0f8b-4855-8962-4d8873f2a3cf'::UUID;
    v_org_id UUID;
    v_team1_id UUID;
    v_team2_id UUID;
    v_match_id UUID;
BEGIN
    -- 1. Validar usuario existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        RAISE EXCEPTION 'Usuario % no existe en auth.users', v_user_id;
    END IF;

    -- 2. Crear organización
    INSERT INTO organizations (id, name, slug, owner_id, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Club Voleibol Ejemplo', 'club-voleibol-ejemplo', v_user_id, now(), now())
    RETURNING id INTO v_org_id;

    -- 3. Owner member
    INSERT INTO organization_members (id, organization_id, user_id, role, joined_at)
    VALUES (gen_random_uuid(), v_org_id, v_user_id, 'owner', now());

    -- 4. Equipos
    INSERT INTO teams (id, organization_id, name, category, gender, season, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Equipo A', 'Senior', 'female', '2024-2025', now())
    RETURNING id INTO v_team1_id;

    INSERT INTO teams (id, organization_id, name, category, gender, season, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Equipo B', 'Senior', 'female', '2024-2025', now())
    RETURNING id INTO v_team2_id;

    -- 5. Jugadores Equipo A
    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Ana', 'García', '2000-03-15', 'right', 175, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'María', 'López', '1999-07-22', 'right', 170, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Laura', 'Martínez', '2001-11-08', 'left', 180, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Sofía', 'Rodríguez', '2000-01-30', 'right', 168, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Carmen', 'Fernández', '1998-09-12', 'right', 172, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Paula', 'González', '2002-05-25', 'right', 165, now());

    -- 6. Jugadores Equipo B
    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Lucía', 'Sánchez', '2000-04-18', 'right', 173, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Isabel', 'Pérez', '1999-12-03', 'right', 169, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Elena', 'Gómez', '2001-02-14', 'left', 178, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Nuria', 'Martín', '2000-08-21', 'right', 171, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Patricia', 'Jiménez', '1998-06-09', 'right', 167, now());

    INSERT INTO players (id, organization_id, first_name, last_name, birth_date, dominant_hand, height_cm, created_at)
    VALUES (gen_random_uuid(), v_org_id, 'Raquel', 'Ruiz', '2002-10-11', 'right', 166, now());

    -- 7. Rosters Equipo A
    INSERT INTO team_rosters (id, team_id, player_id, jersey_number, position, start_date, end_date)
    SELECT gen_random_uuid(), v_team1_id, p.id, rn, pos, '2024-08-01', NULL
    FROM (VALUES
        (1, 'setter'), (2, 'outside_hitter'), (3, 'middle_blocker'),
        (4, 'opposite'), (5, 'libero'), (6, 'defensive_specialist')
    ) AS r(rn, pos)
    JOIN LATERAL (
        SELECT id FROM players 
        WHERE organization_id = v_org_id 
        ORDER BY created_at 
        LIMIT 1 OFFSET rn - 1
    ) p ON true;

    -- 8. Rosters Equipo B
    INSERT INTO team_rosters (id, team_id, player_id, jersey_number, position, start_date, end_date)
    SELECT gen_random_uuid(), v_team2_id, p.id, rn, pos, '2024-08-01', NULL
    FROM (VALUES
        (1, 'setter'), (2, 'outside_hitter'), (3, 'middle_blocker'),
        (4, 'opposite'), (5, 'libero'), (6, 'defensive_specialist')
    ) AS r(rn, pos)
    JOIN LATERAL (
        SELECT id FROM players 
        WHERE organization_id = v_org_id 
        ORDER BY created_at 
        LIMIT 1 OFFSET rn + 5
    ) p ON true;

    -- 9. Partido
    INSERT INTO matches (id, organization_id, home_team_id, away_team_id, match_date, venue, tournament, phase, format, points_per_set, min_point_diff, status, current_set, created_at, updated_at)
    VALUES (gen_random_uuid(), v_org_id, v_team1_id, v_team2_id, '2025-01-15 18:00:00+01', 'Pabellón Municipal', 'Liga Regional 2024-2025', 'pool', 'best_of_5', 25, 2, 'scheduled', 1, now(), now())
    RETURNING id INTO v_match_id;

    -- 10. Sets (5)
    INSERT INTO match_sets (id, match_id, set_number, points_home, points_away, target_points, min_diff, winner_team_id, status, current_rotation, serving_team, server_position, started_at, completed_at, organization_id)
    SELECT gen_random_uuid(), v_match_id, gs, 0, 0, 25, 2, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, v_org_id
    FROM generate_series(1, 5) gs;

    RAISE NOTICE 'Seed OK - Org: %, Match: %', v_org_id, v_match_id;
END $$;