-- Migration: Agregar started_at a matches para timer preciso
-- El timer debe iniciar cuando se presiona "Iniciar Partido", no cuando se crea el partido

ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

COMMENT ON COLUMN matches.started_at IS 'Timestamp de cuando se inicio el partido (Iniciar Partido). Usado para cronometro.';
