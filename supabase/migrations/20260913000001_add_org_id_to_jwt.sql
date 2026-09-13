-- Fix: Agregar org_id al JWT para que RLS funcione correctamente
-- Esta migración crea una función que setea el org_id en el app_metadata del usuario

-- Primero, crear una función que obtenga la organización del usuario
CREATE OR REPLACE FUNCTION public.get_user_org_id(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT om.organization_id INTO org_id
    FROM organization_members om
    WHERE om.user_id = user_uuid
    LIMIT 1;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para actualizar el JWT con org_id
CREATE OR REPLACE FUNCTION public.set_user_org_id()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Obtener la organización del usuario
    org_id := public.get_user_org_id(NEW.user_id);
    
    -- Si tiene organización, actualizar el app_metadata
    IF org_id IS NOT NULL THEN
        UPDATE auth.users
        SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('org_id', org_id::text)
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger que se ejecuta cuando se inserta un miembro en organization_members
CREATE TRIGGER on_org_member_insert
    AFTER INSERT ON organization_members
    FOR EACH ROW EXECUTE FUNCTION public.set_user_org_id();

-- Trigger que se ejecuta cuando se actualiza un miembro
CREATE TRIGGER on_org_member_update
    AFTER UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION public.set_user_org_id();

-- Para usuarios existentes, actualizar el JWT manualmente
-- Esto se ejecuta una vez para poblar los datos existentes
DO $$
DECLARE
    member_record RECORD;
BEGIN
    FOR member_record IN 
        SELECT user_id, organization_id 
        FROM organization_members
    LOOP
        UPDATE auth.users
        SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('org_id', member_record.organization_id::text)
        WHERE id = member_record.user_id;
    END LOOP;
END $$;

COMMENT ON FUNCTION public.get_user_org_id(UUID) IS 'Obtiene la organization_id del usuario desde organization_members';
COMMENT ON FUNCTION public.set_user_org_id() IS 'Actualiza el JWT del usuario con su organization_id';
