-- Remediation for common Supabase Security Advisor findings (Splinter).

-- 0011: immutable helper with fixed search_path
CREATE OR REPLACE FUNCTION public.org_structure_org_id(structure_row_id TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN structure_row_id = 'default_structure' THEN 'org_demo'
    WHEN structure_row_id LIKE 'structure_%' THEN substring(structure_row_id FROM 11)
    ELSE structure_row_id
  END;
$$;

-- 0003: auth.uid() / auth.jwt() evaluated once per query
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- 0006: consolidate organization_members policies (one policy per command)
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_write" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_update" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_link_insert" ON organization_members;

CREATE POLICY "org_members_select" ON organization_members FOR SELECT TO authenticated
  USING (
    is_org_member(organization_id)
    OR lower(email) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
  );

CREATE POLICY "org_members_insert" ON organization_members FOR INSERT TO authenticated
  WITH CHECK (
    is_org_editor(organization_id)
    OR lower(email) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
  );

CREATE POLICY "org_members_update" ON organization_members FOR UPDATE TO authenticated
  USING (
    is_org_editor(organization_id)
    OR lower(email) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
  )
  WITH CHECK (
    is_org_editor(organization_id)
    OR lower(email) = lower((SELECT coalesce(auth.jwt() ->> 'email', '')))
  );

CREATE POLICY "org_members_delete" ON organization_members FOR DELETE TO authenticated
  USING (is_org_editor(organization_id));

-- 0008: explicit deny for client roles on service-only APR tables (service_role bypasses RLS)
DROP POLICY IF EXISTS "apr_ai_usage_service_only" ON apr_ai_usage;
CREATE POLICY "apr_ai_usage_service_only" ON apr_ai_usage FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "apr_ai_cache_service_only" ON apr_ai_suggestion_cache;
CREATE POLICY "apr_ai_cache_service_only" ON apr_ai_suggestion_cache FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

-- 0001: indexes on FK columns that may lack covering indexes
CREATE INDEX IF NOT EXISTS idx_preventive_plans_org ON preventive_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_preventive_evidence_org ON preventive_evidence(organization_id);
CREATE INDEX IF NOT EXISTS idx_apr_ai_usage_organization_id ON apr_ai_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_apr_ai_cache_organization_id ON apr_ai_suggestion_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_cargo ON organization_members(cargo_id);
CREATE INDEX IF NOT EXISTS idx_org_members_area ON organization_members(area_id);
CREATE INDEX IF NOT EXISTS idx_org_members_work_center ON organization_members(work_center_id);
CREATE INDEX IF NOT EXISTS idx_technical_documents_created_by ON technical_documents(created_by);

-- 0025: public buckets must not expose broad SELECT (listing) on storage.objects
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;

DROP POLICY IF EXISTS "org_logos_member" ON storage.objects;
CREATE POLICY "org_logos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND public.is_org_editor((storage.foldername(name))[1])
  );
CREATE POLICY "org_logos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND public.is_org_member((storage.foldername(name))[1])
  )
  WITH CHECK (
    bucket_id = 'organization-logos'
    AND public.is_org_editor((storage.foldername(name))[1])
  );
CREATE POLICY "org_logos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'organization-logos'
    AND public.is_org_editor((storage.foldername(name))[1])
  );
