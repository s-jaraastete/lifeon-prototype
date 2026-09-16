-- Reparación post-bootstrap (FK / columnas organization_id)

INSERT INTO organizations (id, name, industry, size, status)
VALUES
  ('org_demo', 'Constructora y Servicios Santiago SpA', 'Construcción', '51-200', 'Activo'),
  ('org_luis', 'SafetyCo Consultores SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_sergio', 'Constructora Horizonte SpA', 'Construcción', '51-200', 'Activo'),
  ('org_aldo', 'Berríos Ingeniería y Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_gonzalo_c', 'Cabrera Seguridad Industrial SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_gonzalo_b', 'Beristain Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE organization_preferences
    ADD COLUMN IF NOT EXISTS organization_id TEXT;

UPDATE organization_preferences
SET organization_id = CASE WHEN id = 'default_org' THEN 'org_demo' ELSE id END
WHERE organization_id IS NULL;

DO $$ BEGIN
  ALTER TABLE organization_preferences
    ADD CONSTRAINT organization_preferences_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE iper_matrices ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE preventive_docs ADD COLUMN IF NOT EXISTS organization_id TEXT;

UPDATE iper_matrices m
SET organization_id = o.id
FROM organizations o
WHERE m.organization_id IS NULL
  AND (
    m.id LIKE o.id || '\_%'
    OR (o.id = 'org_demo' AND (m.id LIKE 'MA-%' OR m.id ~ '^[0-9]+$'))
  );

UPDATE preventive_docs d
SET organization_id = o.id
FROM organizations o
WHERE d.organization_id IS NULL
  AND d.id LIKE o.id || '\_%';

UPDATE preventive_docs
SET organization_id = 'org_demo'
WHERE organization_id IS NULL AND id LIKE 'DOC-%';

DO $$ BEGIN
  ALTER TABLE iper_matrices
    ADD CONSTRAINT iper_matrices_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE preventive_docs
    ADD CONSTRAINT preventive_docs_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_iper_matrices_org ON iper_matrices(organization_id);
CREATE INDEX IF NOT EXISTS idx_preventive_docs_org ON preventive_docs(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_preferences_org ON organization_preferences(organization_id);

ALTER TABLE iper_matrices
    ADD COLUMN IF NOT EXISTS work_center_id TEXT,
    ADD COLUMN IF NOT EXISTS area_id TEXT,
    ADD COLUMN IF NOT EXISTS process_id TEXT,
    ADD COLUMN IF NOT EXISTS subprocess_id TEXT;

CREATE INDEX IF NOT EXISTS idx_iper_matrices_wc ON iper_matrices(work_center_id);
CREATE INDEX IF NOT EXISTS idx_iper_matrices_area ON iper_matrices(area_id);
CREATE INDEX IF NOT EXISTS idx_iper_matrices_org_status ON iper_matrices(organization_id, status);
