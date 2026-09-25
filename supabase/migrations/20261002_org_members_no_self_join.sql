-- Close self-join / self-role escalation on organization_members.
-- Client INSERT is denied; membership changes go through service role (API routes).

DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
DROP POLICY IF EXISTS "org_members_update" ON organization_members;
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
DROP POLICY IF EXISTS "org_members_write" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_update" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_insert" ON organization_members;

CREATE POLICY "org_members_select" ON organization_members FOR SELECT TO authenticated
  USING (
    is_org_member(organization_id)
    OR lower(email) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
  );

-- No INSERT for authenticated (service role bypasses RLS).

CREATE POLICY "org_members_update" ON organization_members FOR UPDATE TO authenticated
  USING (is_org_editor(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "org_members_delete" ON organization_members FOR DELETE TO authenticated
  USING (is_org_editor(organization_id));

-- Prevent non-admin editors from granting Administrador via direct client updates.
CREATE OR REPLACE FUNCTION public.organization_members_guard_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      IF current_setting('request.jwt.claim.role', true) = 'service_role'
         OR current_user IN ('postgres', 'supabase_admin') THEN
        RETURN NEW;
      END IF;
      IF NOT public.is_org_editor(OLD.organization_id) THEN
        RAISE EXCEPTION 'Sin permiso para modificar membresía';
      END IF;
      IF NEW.role = 'Administrador' AND OLD.role IS DISTINCT FROM 'Administrador' THEN
        IF NOT EXISTS (
          SELECT 1 FROM organization_members m
          WHERE m.organization_id = OLD.organization_id
            AND m.auth_user_id = auth.uid()
            AND m.status = 'Activo'
            AND m.role = 'Administrador'
        ) THEN
          RAISE EXCEPTION 'Solo un Administrador puede asignar rol Administrador';
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organization_members_guard_role_trigger ON organization_members;
CREATE TRIGGER organization_members_guard_role_trigger
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.organization_members_guard_role();
