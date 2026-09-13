-- Fix: Permitir a usuarios autenticados leer sus propias membresías
-- Necesario para que useOrganization() funcione en el browser client

DROP POLICY IF EXISTS org_members_select ON organization_members;

-- Política dual: puede ver su propia membresía O la de su org (via JWT)
CREATE POLICY org_members_select ON organization_members
    FOR SELECT USING (
        user_id = auth.uid()
        OR organization_id = current_org()
    );
