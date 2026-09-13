-- Migration: Agregar opponent_name para partidos inter-clubes
-- Opción A del MVP: solo nombre del rival, no equipo de otra org

-- Agregar campo opponent_name (hace opcional a away_team_id)
ALTER TABLE matches 
  ADD COLUMN opponent_name TEXT,
  ALTER COLUMN away_team_id DROP NOT NULL;

-- Validar que tenga away_team_id O opponent_name
ALTER TABLE matches 
  ADD CONSTRAINT matches_opponent_check 
  CHECK (away_team_id IS NOT NULL OR opponent_name IS NOT NULL);

-- Comentario
COMMENT ON COLUMN matches.opponent_name IS 'Nombre del equipo rival (para partidos inter-clubes). Si se usa, away_team_id es NULL.';
