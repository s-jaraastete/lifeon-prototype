-- organization_id on legacy blob tables

ALTER TABLE organization_preferences
    ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE organization_preferences
SET organization_id = CASE
    WHEN id = 'default_org' THEN 'org_demo'
    ELSE id
END
WHERE organization_id IS NULL;

ALTER TABLE iper_matrices
    ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE iper_matrices
SET organization_id = CASE
    WHEN id LIKE 'org\_%' THEN split_part(id, '_', 1) || '_' || split_part(id, '_', 2)
    WHEN id LIKE 'MA-%' OR id ~ '^[0-9]+$' THEN 'org_demo'
    ELSE NULL
END
WHERE organization_id IS NULL;

ALTER TABLE preventive_docs
    ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE preventive_docs
SET organization_id = CASE
    WHEN id LIKE 'org\_%' THEN split_part(id, '_', 1) || '_' || split_part(id, '_', 2)
    WHEN id LIKE 'DOC-%' THEN 'org_demo'
    ELSE NULL
END
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_iper_matrices_org ON iper_matrices(organization_id);
CREATE INDEX IF NOT EXISTS idx_preventive_docs_org ON preventive_docs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_preferences_org ON organization_preferences(organization_id);
