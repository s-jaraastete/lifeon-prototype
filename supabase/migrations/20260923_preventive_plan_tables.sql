CREATE TABLE IF NOT EXISTS preventive_plans (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Programa Anual',
    year INTEGER,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Archivado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_preventive_plans_org_active
    ON preventive_plans(organization_id) WHERE status = 'Activo';

CREATE TABLE IF NOT EXISTS preventive_activities (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES preventive_plans(id) ON DELETE CASCADE,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    category TEXT NOT NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    area_name TEXT,
    responsible_user_id TEXT,
    responsible_user_name TEXT,
    responsible_position_id TEXT REFERENCES positions(id) ON DELETE SET NULL,
    responsible_position_name TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    periodicity TEXT NOT NULL,
    applicability TEXT,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    weight NUMERIC NOT NULL DEFAULT 1,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preventive_activities_org ON preventive_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_preventive_activities_plan ON preventive_activities(plan_id);

CREATE TABLE IF NOT EXISTS preventive_evidence (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES preventive_activities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    storage_path TEXT,
    file_size_bytes BIGINT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preventive_evidence_activity ON preventive_evidence(activity_id);

DROP TRIGGER IF EXISTS trg_preventive_plans_updated_at ON preventive_plans;
CREATE TRIGGER trg_preventive_plans_updated_at
    BEFORE UPDATE ON preventive_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_preventive_activities_updated_at ON preventive_activities;
CREATE TRIGGER trg_preventive_activities_updated_at
    BEFORE UPDATE ON preventive_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE preventive_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_evidence ENABLE ROW LEVEL SECURITY;
