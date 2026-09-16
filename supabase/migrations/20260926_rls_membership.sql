-- Membership-based RLS (requires Supabase Auth session)

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members m
    WHERE m.organization_id = target_org_id
      AND m.auth_user_id = auth.uid()
      AND m.status IN ('Activo', 'Invitado')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_editor(target_org_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members m
    WHERE m.organization_id = target_org_id
      AND m.auth_user_id = auth.uid()
      AND m.status = 'Activo'
      AND m.role IN ('Administrador', 'Editor')
  );
$$;

-- Profiles: own row
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Helper to replace open policies on tenant tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'organizations', 'work_centers', 'areas', 'processes', 'subprocesses',
    'positions', 'organization_members', 'organization_preferences',
    'iper_matrices', 'preventive_docs', 'preventive_plans', 'preventive_activities',
    'preventive_evidence', 'technical_documents'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Permitir acceso autenticado y anónimo a %s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Permitir todo en %s" ON %I', tbl, tbl);
  END LOOP;
END $$;

-- organizations: members can read their org
CREATE POLICY "organizations_select_member" ON organizations FOR SELECT TO authenticated
  USING (is_org_member(id));

CREATE POLICY "organizations_update_editor" ON organizations FOR UPDATE TO authenticated
  USING (is_org_editor(id)) WITH CHECK (is_org_editor(id));

-- Generic pattern for org-scoped tables
CREATE POLICY "work_centers_member" ON work_centers FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "areas_member" ON areas FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "processes_member" ON processes FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "subprocesses_member" ON subprocesses FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "positions_member" ON positions FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "org_members_select" ON organization_members FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "org_members_write" ON organization_members FOR ALL TO authenticated
  USING (is_org_editor(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "org_preferences_member" ON organization_preferences FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_editor(organization_id));

CREATE POLICY "iper_matrices_member" ON iper_matrices FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_editor(organization_id));

CREATE POLICY "preventive_docs_member" ON preventive_docs FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_editor(organization_id));

CREATE POLICY "preventive_plans_member" ON preventive_plans FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "preventive_activities_member" ON preventive_activities FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "preventive_evidence_member" ON preventive_evidence FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "technical_documents_member" ON technical_documents FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

-- Legacy open anon access removed; service/bootstrap must use authenticated users
