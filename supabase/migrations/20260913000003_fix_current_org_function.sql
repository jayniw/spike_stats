-- Fix: Corregir función current_org() para leer de app_metadata
-- El org_id está en raw_app_meta_data.org_id, no en el nivel raíz del JWT

CREATE OR REPLACE FUNCTION current_org()
RETURNS UUID AS $$
DECLARE
    org_id_text TEXT;
BEGIN
    -- Leer org_id de app_metadata (Supabase almacena JWT claims aquí)
    org_id_text := auth.jwt() -> 'app_metadata' ->> 'org_id';
    IF org_id_text IS NULL OR org_id_text = '' THEN
        RETURN NULL;
    END IF;
    RETURN org_id_text::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION current_org() IS 'Retorna el organization_id del JWT claim "app_metadata.org_id". Usado en policies RLS para aislamiento multitenant.';
