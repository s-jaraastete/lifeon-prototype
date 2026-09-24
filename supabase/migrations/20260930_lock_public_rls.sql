-- Lock public schema: enable RLS everywhere, remove open anon policies, membership model + org_structure.

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

CREATE OR REPLACE FUNCTION public.org_structure_org_id(structure_row_id TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN structure_row_id = 'default_structure' THEN 'org_demo'
    WHEN structure_row_id LIKE 'structure_%' THEN substring(structure_row_id FROM 11)
    ELSE structure_row_id
  END;
$$;

-- Enable RLS on every public heap table
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Drop legacy open policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'organization_preferences', 'org_structure', 'preventive_docs', 'iper_matrices',
    'organizations', 'work_centers', 'areas', 'processes', 'subprocesses',
    'positions', 'organization_members', 'profiles',
    'preventive_plans', 'preventive_activities', 'preventive_evidence', 'technical_documents'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Permitir acceso autenticado y anónimo a %s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Permitir todo en %s" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "bootstrap_open_%s" ON %I', tbl, tbl);
  END LOOP;
END $$;

-- Profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Tenant tables (drop named policies before recreate)
DROP POLICY IF EXISTS "organizations_select_member" ON organizations;
DROP POLICY IF EXISTS "organizations_update_editor" ON organizations;
CREATE POLICY "organizations_select_member" ON organizations FOR SELECT TO authenticated
  USING (is_org_member(id));
CREATE POLICY "organizations_update_editor" ON organizations FOR UPDATE TO authenticated
  USING (is_org_editor(id)) WITH CHECK (is_org_editor(id));

DROP POLICY IF EXISTS "work_centers_member" ON work_centers;
CREATE POLICY "work_centers_member" ON work_centers FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "areas_member" ON areas;
CREATE POLICY "areas_member" ON areas FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "processes_member" ON processes;
CREATE POLICY "processes_member" ON processes FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "subprocesses_member" ON subprocesses;
CREATE POLICY "subprocesses_member" ON subprocesses FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "positions_member" ON positions;
CREATE POLICY "positions_member" ON positions FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "org_members_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_write" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_update" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_insert" ON organization_members;

CREATE POLICY "org_members_select" ON organization_members FOR SELECT TO authenticated
  USING (is_org_member(organization_id));

CREATE POLICY "org_members_write" ON organization_members FOR ALL TO authenticated
  USING (is_org_editor(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "org_members_self_link_select" ON organization_members FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE POLICY "org_members_self_link_update" ON organization_members FOR UPDATE TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  WITH CHECK (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE POLICY "org_members_self_link_insert" ON organization_members FOR INSERT TO authenticated
  WITH CHECK (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "org_preferences_member" ON organization_preferences;
CREATE POLICY "org_preferences_member" ON organization_preferences FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_editor(organization_id));

DROP POLICY IF EXISTS "org_structure_member" ON org_structure;
CREATE POLICY "org_structure_member" ON org_structure FOR ALL TO authenticated
  USING (is_org_member(org_structure_org_id(id)))
  WITH CHECK (is_org_editor(org_structure_org_id(id)));

DROP POLICY IF EXISTS "iper_matrices_member" ON iper_matrices;
CREATE POLICY "iper_matrices_member" ON iper_matrices FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_editor(organization_id));

DROP POLICY IF EXISTS "preventive_docs_member" ON preventive_docs;
CREATE POLICY "preventive_docs_member" ON preventive_docs FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND is_org_editor(organization_id));

DROP POLICY IF EXISTS "preventive_plans_member" ON preventive_plans;
CREATE POLICY "preventive_plans_member" ON preventive_plans FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "preventive_activities_member" ON preventive_activities;
CREATE POLICY "preventive_activities_member" ON preventive_activities FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "preventive_evidence_member" ON preventive_evidence;
CREATE POLICY "preventive_evidence_member" ON preventive_evidence FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

DROP POLICY IF EXISTS "technical_documents_member" ON technical_documents;
CREATE POLICY "technical_documents_member" ON technical_documents FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

-- APR AI tables: RLS on, no client policies (server uses service_role)
DROP POLICY IF EXISTS "apr_ai_usage_member" ON apr_ai_usage;
DROP POLICY IF EXISTS "apr_ai_cache_member" ON apr_ai_suggestion_cache;
DROP POLICY IF EXISTS "apr_ai_cache_write" ON apr_ai_suggestion_cache;

-- Revoke direct table access for anon (PostgREST authenticated + RLS still apply)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
