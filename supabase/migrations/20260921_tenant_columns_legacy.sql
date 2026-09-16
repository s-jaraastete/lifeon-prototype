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
    ADD COLUMN IF NOT EXISTS organization_id TEXT;

UPDATE iper_matrices m
SET organization_id = o.id
FROM organizations o
WHERE m.organization_id IS NULL
  AND (
    m.id LIKE o.id || '\_%'
    OR (o.id = 'org_demo' AND (m.id LIKE 'MA-%' OR m.id ~ '^[0-9]+$'))
  );

DO $$ BEGIN
  ALTER TABLE iper_matrices
    ADD CONSTRAINT iper_matrices_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE preventive_docs
    ADD COLUMN IF NOT EXISTS organization_id TEXT;

UPDATE preventive_docs d
SET organization_id = o.id
FROM organizations o
WHERE d.organization_id IS NULL AND d.id LIKE o.id || '\_%';

UPDATE preventive_docs
SET organization_id = 'org_demo'
WHERE organization_id IS NULL AND id LIKE 'DOC-%';

DO $$ BEGIN
  ALTER TABLE preventive_docs
    ADD CONSTRAINT preventive_docs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_iper_matrices_org ON iper_matrices(organization_id);
CREATE INDEX IF NOT EXISTS idx_preventive_docs_org ON preventive_docs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_preferences_org ON organization_preferences(organization_id);
