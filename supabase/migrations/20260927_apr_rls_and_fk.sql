ALTER TABLE apr_ai_usage
    ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE apr_ai_usage SET organization_id = org_id WHERE organization_id IS NULL;

ALTER TABLE apr_ai_suggestion_cache
    ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE apr_ai_suggestion_cache SET organization_id = org_id WHERE organization_id IS NULL;

ALTER TABLE apr_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE apr_ai_suggestion_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apr_ai_usage_member" ON apr_ai_usage FOR ALL TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id))
  WITH CHECK (organization_id IS NOT NULL AND auth.uid()::text = user_id OR user_id IS NOT NULL);

CREATE POLICY "apr_ai_cache_member" ON apr_ai_suggestion_cache FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND is_org_member(organization_id));

CREATE POLICY "apr_ai_cache_write" ON apr_ai_suggestion_cache FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NOT NULL AND is_org_member(organization_id));
