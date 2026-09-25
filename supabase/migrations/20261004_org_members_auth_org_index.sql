CREATE INDEX IF NOT EXISTS idx_org_members_auth_org_status
  ON organization_members (auth_user_id, organization_id, status);
