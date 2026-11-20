-- LifeOn: ejecutar en Supabase → SQL Editor (Run)
-- Proyecto: gezcblnyteijkckabkyh


-- ========== schema.sql ==========
-- =========================================================================
-- LIFEON: ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Ejecutar este script completo en el SQL Editor de Supabase (1-Click Run)
-- =========================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCIÓN PARA ACTUALIZAR TIMESTAMP AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================================
-- TABLA 1: PREFERENCIAS ORGANIZACIONALES (ONBOARDING, SECTOR, VEP / 5X5)
-- =========================================================================
CREATE TABLE IF NOT EXISTS organization_preferences (
    id TEXT PRIMARY KEY DEFAULT 'default_org',
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_org_preferences_updated_at ON organization_preferences;
CREATE TRIGGER trg_org_preferences_updated_at
    BEFORE UPDATE ON organization_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- TABLA 2: ESTRUCTURA ORGANIZACIONAL (ÁREAS, PROCESOS Y SUBPROCESOS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS org_structure (
    id TEXT PRIMARY KEY DEFAULT 'default_structure',
    areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_org_structure_updated_at ON org_structure;
CREATE TRIGGER trg_org_structure_updated_at
    BEFORE UPDATE ON org_structure
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- TABLA 3: DOCUMENTOS PREVENTIVOS Y AUDITORÍAS NORMATIVAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS preventive_docs (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    regulatory_basis TEXT,
    version TEXT DEFAULT 'v1.0',
    status TEXT NOT NULL DEFAULT 'Vigente',
    author TEXT,
    approver TEXT,
    issue_date TEXT,
    expiry_date TEXT,
    days_remaining INTEGER,
    source TEXT DEFAULT 'Plantilla del Sistema',
    has_file BOOLEAN DEFAULT false,
    file_name TEXT,
    file_size TEXT,
    content_sections JSONB DEFAULT '[]'::jsonb,
    audit_checklist JSONB DEFAULT '[]'::jsonb,
    audit_score INTEGER DEFAULT 0,
    audit_status TEXT NOT NULL DEFAULT 'Sin Auditar',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_preventive_docs_updated_at ON preventive_docs;
CREATE TRIGGER trg_preventive_docs_updated_at
    BEFORE UPDATE ON preventive_docs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- TABLA 4: MATRICES IPER
-- =========================================================================
CREATE TABLE IF NOT EXISTS iper_matrices (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    area TEXT,
    work_center TEXT,
    responsible TEXT,
    status TEXT NOT NULL DEFAULT 'Borrador',
    progress INTEGER DEFAULT 0,
    total_risks INTEGER DEFAULT 0,
    critical_risks INTEGER DEFAULT 0,
    last_review TEXT,
    next_review TEXT,
    hazards JSONB DEFAULT '[]'::jsonb,
    acknowledgements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_iper_matrices_updated_at ON iper_matrices;
CREATE TRIGGER trg_iper_matrices_updated_at
    BEFORE UPDATE ON iper_matrices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS) - MODO PRUEBAS / DESARROLLO
-- Permite lectura y escritura transparente para el rol anon (clave pública)
-- =========================================================================
ALTER TABLE organization_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE iper_matrices ENABLE ROW LEVEL SECURITY;

-- Políticas para organization_preferences
DROP POLICY IF EXISTS "Permitir todo en organization_preferences" ON organization_preferences;
CREATE POLICY "Permitir todo en organization_preferences" 
    ON organization_preferences FOR ALL 
    TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- Políticas para org_structure
DROP POLICY IF EXISTS "Permitir todo en org_structure" ON org_structure;
CREATE POLICY "Permitir todo en org_structure" 
    ON org_structure FOR ALL 
    TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- Políticas para preventive_docs
DROP POLICY IF EXISTS "Permitir todo en preventive_docs" ON preventive_docs;
CREATE POLICY "Permitir todo en preventive_docs" 
    ON preventive_docs FOR ALL 
    TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- Políticas para iper_matrices
DROP POLICY IF EXISTS "Permitir todo en iper_matrices" ON iper_matrices;
CREATE POLICY "Permitir todo en iper_matrices" 
    ON iper_matrices FOR ALL 
    TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- Notificación de éxito
COMMENT ON TABLE organization_preferences IS 'Almacena la configuración y preferencias de Onboarding de LifeOn';
COMMENT ON TABLE org_structure IS 'Almacena la estructura organizacional (Áreas, Procesos y Subprocesos)';
COMMENT ON TABLE preventive_docs IS 'Almacena documentos de Planificación y Documentación Preventiva y sus auditorías';
COMMENT ON TABLE iper_matrices IS 'Almacena matrices de identificación de peligros y evaluación de riesgos IPER';


-- ========== 20260911_org_structure_tables.sql ==========
-- =========================================================================
-- LIFEON: MIGRACIÓN ESTRUCTURAL ORGANIZACIONAL Y MULTI-TENANT
-- Archivo: 20260911_org_structure_tables.sql
-- Descripción:
--   Define el modelo relacional normalizado para Estructura Organizacional:
--   organizations -> work_centers -> areas -> processes -> subprocesses
--   organizations -> positions (Cargos transversales de la organización)
--   organizations -> organization_members (Membresías de usuarios en org)
--   Incluye claves foráneas, índices de aislamiento por tenant, soft deletes y RLS.
-- =========================================================================

-- 1. EXTENSIONES Y FUNCIONES AUXILIARES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLA: ORGANIZACIONES (TENANTS)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    legal_name TEXT,
    rut TEXT,
    industry TEXT,
    size TEXT,
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar organizaciones base si no existen para compatibilidad
INSERT INTO organizations (id, name, industry, size, status)
VALUES
    ('org_demo', 'Constructora y Servicios Santiago SpA', 'Construcción', '51 a 100 trabajadores', 'Activo'),
    ('org_luis', 'SafetyCo Consultores SpA', 'Consultoría en Prevención', '1 a 10 trabajadores', 'Activo')
ON CONFLICT (id) DO UPDATE 
SET updated_at = NOW();

-- 3. TABLA: CENTROS DE TRABAJO (WORK CENTERS)
CREATE TABLE IF NOT EXISTS work_centers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_centers_org ON work_centers(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_work_centers_org_name ON work_centers(organization_id, name) WHERE status = 'Activo';

DROP TRIGGER IF EXISTS trg_work_centers_updated_at ON work_centers;
CREATE TRIGGER trg_work_centers_updated_at
    BEFORE UPDATE ON work_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. TABLA: ÁREAS
CREATE TABLE IF NOT EXISTS areas (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_areas_org ON areas(organization_id);
CREATE INDEX IF NOT EXISTS idx_areas_work_center ON areas(work_center_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_areas_workcenter_name ON areas(organization_id, work_center_id, name) WHERE status = 'Activo';

DROP TRIGGER IF EXISTS trg_areas_updated_at ON areas;
CREATE TRIGGER trg_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. TABLA: PROCESOS
CREATE TABLE IF NOT EXISTS processes (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processes_org ON processes(organization_id);
CREATE INDEX IF NOT EXISTS idx_processes_area ON processes(area_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_processes_area_name ON processes(area_id, name) WHERE status = 'Activo';

DROP TRIGGER IF EXISTS trg_processes_updated_at ON processes;
CREATE TRIGGER trg_processes_updated_at
    BEFORE UPDATE ON processes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. TABLA: SUBPROCESOS (OPCIONALES)
CREATE TABLE IF NOT EXISTS subprocesses (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    process_id TEXT NOT NULL REFERENCES processes(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subprocesses_org ON subprocesses(organization_id);
CREATE INDEX IF NOT EXISTS idx_subprocesses_process ON subprocesses(process_id);

DROP TRIGGER IF EXISTS trg_subprocesses_updated_at ON subprocesses;
CREATE TRIGGER trg_subprocesses_updated_at
    BEFORE UPDATE ON subprocesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. TABLA: CARGOS (CATÁLOGO TRANSVERSAL DE ORGANIZACIÓN)
CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    dotation_total INTEGER NOT NULL DEFAULT 1,
    dotation_male INTEGER NOT NULL DEFAULT 0,
    dotation_female INTEGER NOT NULL DEFAULT 0,
    dotation_other INTEGER NOT NULL DEFAULT 0,
    sensitive_workers_count INTEGER NOT NULL DEFAULT 0,
    disabled_workers_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Validación de coherencia de dotación
    CONSTRAINT chk_position_dotation CHECK (
        dotation_total >= (dotation_male + dotation_female + dotation_other)
    )
);

CREATE INDEX IF NOT EXISTS idx_positions_org ON positions(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_positions_org_name ON positions(organization_id, name) WHERE status = 'Activo';

DROP TRIGGER IF EXISTS trg_positions_updated_at ON positions;
CREATE TRIGGER trg_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. TABLA: USUARIOS Y MEMBRESÍAS DE ORGANIZACIÓN
CREATE TABLE IF NOT EXISTS organization_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    cargo_id TEXT REFERENCES positions(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'Lector' CHECK (role IN ('Administrador', 'Editor', 'Lector')),
    status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Invitado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_email ON organization_members(organization_id, email);

DROP TRIGGER IF EXISTS trg_org_members_updated_at ON organization_members;
CREATE TRIGGER trg_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subprocesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- En entorno de desarrollo y pruebas locales con clave anónima:
-- Permitir acceso transparente manteniendo aislamiento a nivel de consulta por organization_id.
CREATE POLICY "Permitir acceso autenticado y anónimo a organizations" ON organizations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a work_centers" ON work_centers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a areas" ON areas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a processes" ON processes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a subprocesses" ON subprocesses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a positions" ON positions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso autenticado y anónimo a organization_members" ON organization_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ========== 20260916_iper_acknowledgements.sql ==========
-- IRL: Toma de conocimiento / envío por trabajador (por matriz)
ALTER TABLE iper_matrices
  ADD COLUMN IF NOT EXISTS acknowledgements JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN iper_matrices.acknowledgements IS 'Registros de envío y toma de conocimiento del IRL por trabajador y cargo';


-- ========== 20260917_apr_ai_usage_and_cache.sql ==========
-- APR Virtual IA: rate limiting and suggestion cache

CREATE TABLE IF NOT EXISTS apr_ai_usage (
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'day')),
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, user_id, window_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_apr_ai_usage_org_day
    ON apr_ai_usage (org_id, window_type, window_start);

CREATE TABLE IF NOT EXISTS apr_ai_suggestion_cache (
    cache_key TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apr_ai_suggestion_cache_expires
    ON apr_ai_suggestion_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_apr_ai_suggestion_cache_org
    ON apr_ai_suggestion_cache (org_id);


-- ========== 20260918_tenant_id_conventions.sql ==========
-- Multi-tenant por prefijo de id (LifeOn dashboard cuentas de prueba)
-- No añade columnas organization_id: el aislamiento se hace en la app.
--
-- organization_preferences.id  → org_sergio | org_luis | default_org (demo)
-- org_structure.id           → structure_org_sergio | default_structure (demo)
-- iper_matrices.id             → org_sergio_m-imp-… | org_demo_… | MA-… (demo seed)
-- preventive_docs.id           → org_sergio_DOC-01 | DOC-01 (legacy demo)
--
-- Verificar datos por cuenta (SQL Editor):
--
-- SELECT id FROM organization_preferences ORDER BY id;
-- SELECT id FROM org_structure ORDER BY id;
-- SELECT id, title FROM iper_matrices WHERE id LIKE 'org_sergio_%' ORDER BY updated_at DESC;
-- SELECT id, title FROM preventive_docs WHERE id LIKE 'org_sergio_%' ORDER BY code;

COMMENT ON TABLE organization_preferences IS 'Una fila por organización (id = orgId). Demo usa default_org.';
COMMENT ON TABLE org_structure IS 'Una fila por organización (id = structure_<orgId>). Demo usa default_structure.';
COMMENT ON TABLE preventive_docs IS 'Documentos preventivos; ids con prefijo <orgId>_ salvo plantillas demo DOC-*';
COMMENT ON TABLE iper_matrices IS 'Matrices IPER; ids con prefijo <orgId>_ para cuentas reales';


-- ========== 20260919_seed_missing_organizations.sql ==========
-- Seed organizations for all LifeOn test accounts (missing from initial migration)

INSERT INTO organizations (id, name, industry, size, status)
VALUES
  ('org_sergio', 'Constructora Horizonte SpA', 'Construcción', '51-200', 'Activo'),
  ('org_aldo', 'Berríos Ingeniería y Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_gonzalo_c', 'Cabrera Seguridad Industrial SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_gonzalo_b', 'Beristain Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  updated_at = NOW();


-- ========== 20260920_profiles_and_member_auth.sql ==========
-- Profiles + extended organization_members for Auth linkage

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_path TEXT,
    personal_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE organization_members
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS identification_type TEXT,
    ADD COLUMN IF NOT EXISTS identification_number TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE organization_members ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_members_org_email_active
    ON organization_members (organization_id, lower(email))
    WHERE status IN ('Activo', 'Invitado');

CREATE INDEX IF NOT EXISTS idx_org_members_auth_user ON organization_members(auth_user_id);

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS logo_path TEXT;


-- ========== 20260921_tenant_columns_legacy.sql ==========
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


-- ========== 20260922_iper_fk_and_status.sql ==========
ALTER TABLE iper_matrices
    ADD COLUMN IF NOT EXISTS work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_iper_matrices_wc ON iper_matrices(work_center_id);
CREATE INDEX IF NOT EXISTS idx_iper_matrices_area ON iper_matrices(area_id);
CREATE INDEX IF NOT EXISTS idx_iper_matrices_org_status ON iper_matrices(organization_id, status);


-- ========== 20260923_preventive_plan_tables.sql ==========
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


-- ========== 20260924_technical_documents.sql ==========
CREATE TABLE IF NOT EXISTS technical_documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Borrador',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technical_documents_org ON technical_documents(organization_id);

DROP TRIGGER IF EXISTS trg_technical_documents_updated_at ON technical_documents;
CREATE TRIGGER trg_technical_documents_updated_at
    BEFORE UPDATE ON technical_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE technical_documents ENABLE ROW LEVEL SECURITY;


-- ========== 20260925_storage_buckets.sql ==========
-- Storage buckets (run in Supabase SQL editor if storage schema not available via migration)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('organization-logos', 'organization-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('program-evidence', 'program-evidence', false, 52428800, NULL),
  ('technical-documents', 'technical-documents', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;


-- ========== 20260926_rls_membership.sql ==========
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


-- ========== 20260927_apr_rls_and_fk.sql ==========
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


-- ========== 20260928_storage_rls.sql ==========
-- Storage RLS (requires is_org_member from 20260926)

CREATE POLICY "avatars_own_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "org_logos_member" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'organization-logos' AND public.is_org_member((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'organization-logos' AND public.is_org_editor((storage.foldername(name))[1]));

CREATE POLICY "program_evidence_member" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'program-evidence' AND public.is_org_member((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'program-evidence' AND public.is_org_editor((storage.foldername(name))[1]));

CREATE POLICY "technical_docs_member" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'technical-documents' AND public.is_org_member((storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'technical-documents' AND public.is_org_editor((storage.foldername(name))[1]));


-- ========== 20260929_seed_rene_alex_carlos.sql ==========
-- Cuentas de prueba vacías: René, Alex, Carlos

INSERT INTO organizations (id, name, industry, size, status)
VALUES
  ('org_rene', 'Ramos Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_alex', 'Ordenes Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_carlos', 'Subiabre Ingeniería SpA', 'Construcción', '21-50', 'Activo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  updated_at = NOW();

INSERT INTO organization_preferences (id, organization_id, preferences)
VALUES
  ('org_rene', 'org_rene', '{"onboardingCompleted":false}'::jsonb),
  ('org_alex', 'org_alex', '{"onboardingCompleted":false}'::jsonb),
  ('org_carlos', 'org_carlos', '{"onboardingCompleted":false}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  updated_at = NOW();

INSERT INTO organization_members (
  id, organization_id, user_id, email, name, first_name, last_name, role, status, permissions
)
VALUES
  ('mem_user_rene', 'org_rene', 'user_rene', 'rene.ramos@safetyclub.cl', 'René Ramos', 'René', 'Ramos', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_alex', 'org_alex', 'user_alex', 'alex.ordenes@safetyclub.cl', 'Alex Ordenes', 'Alex', 'Ordenes', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_carlos', 'org_carlos', 'user_carlos', 'carlos.subiabre@safetyclub.cl', 'Carlos Subiabre', 'Carlos', 'Subiabre', 'Administrador', 'Activo', '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO preventive_plans (id, organization_id, name, status)
VALUES
  ('plan_org_rene', 'org_rene', 'Programa Anual', 'Activo'),
  ('plan_org_alex', 'org_alex', 'Programa Anual', 'Activo'),
  ('plan_org_carlos', 'org_carlos', 'Programa Anual', 'Activo')
ON CONFLICT (id) DO NOTHING;


-- ========== 20260930_lock_public_rls.sql ==========
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


-- ========== 20260931_advisor_remediation.sql ==========
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


-- ========== 20261001_document_deliveries.sql ==========
-- Document deliveries: asignación, snapshot y toma de conocimiento (Mobile + Web)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.evaluation_matches_cargo(ev_cargo text, target_cargo text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN ev_cargo IS NULL OR target_cargo IS NULL OR trim(target_cargo) = '' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM unnest(regexp_split_to_array(trim(ev_cargo), '[,/;•]')) AS t(token)
      WHERE lower(trim(token)) = lower(trim(target_cargo))
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.filter_hazards_for_cargo(hazards jsonb, target_cargo text)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_agg(ev ORDER BY ordinality),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(COALESCE(hazards, '[]'::jsonb)) WITH ORDINALITY AS t(ev, ordinality)
  WHERE public.evaluation_matches_cargo(ev->>'cargo', target_cargo);
$$;

CREATE OR REPLACE FUNCTION public.hash_jsonb_content(payload jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(digest(payload::text, 'sha256'), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assignee_member_id TEXT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    assignee_auth_user_id UUID NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('irl', 'technical_document')),
    source_id TEXT NOT NULL,
    cargo_id TEXT REFERENCES positions(id) ON DELETE SET NULL,
    cargo_name TEXT,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    work_center_name TEXT,
    title TEXT NOT NULL,
    document_code TEXT,
    content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash TEXT NOT NULL,
    source_updated_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pendiente_revision'
        CHECK (status IN ('pendiente_revision', 'pendiente_firma', 'firmado', 'anulado')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    signed_by_auth_user_id UUID,
    signature_path TEXT,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    void_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_deliveries_org ON document_deliveries(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_deliveries_assignee_auth ON document_deliveries(assignee_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_document_deliveries_status ON document_deliveries(status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_document_deliveries_open_assignment
    ON document_deliveries (source_type, source_id, assignee_member_id)
    WHERE status IN ('pendiente_revision', 'pendiente_firma');

DROP TRIGGER IF EXISTS trg_document_deliveries_updated_at ON document_deliveries;
CREATE TRIGGER trg_document_deliveries_updated_at
    BEFORE UPDATE ON document_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.protect_signed_document_delivery()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IN ('firmado', 'anulado') THEN
        IF NEW.content_snapshot IS DISTINCT FROM OLD.content_snapshot
            OR NEW.content_hash IS DISTINCT FROM OLD.content_hash
            OR NEW.assignee_member_id IS DISTINCT FROM OLD.assignee_member_id
            OR NEW.assignee_auth_user_id IS DISTINCT FROM OLD.assignee_auth_user_id
            OR NEW.signed_at IS DISTINCT FROM OLD.signed_at
            OR NEW.signed_by_auth_user_id IS DISTINCT FROM OLD.signed_by_auth_user_id
            OR NEW.source_type IS DISTINCT FROM OLD.source_type
            OR NEW.source_id IS DISTINCT FROM OLD.source_id
        THEN
            RAISE EXCEPTION 'No se puede modificar un registro firmado o anulado';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_signed_document_delivery ON document_deliveries;
CREATE TRIGGER trg_protect_signed_document_delivery
    BEFORE UPDATE ON document_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_signed_document_delivery();

ALTER TABLE document_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_deliveries_select" ON document_deliveries
    FOR SELECT TO authenticated
    USING (
        assignee_auth_user_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_org_editor(organization_id))
    );

REVOKE INSERT, UPDATE, DELETE ON document_deliveries FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for signature evidence
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'acknowledgement-evidence',
    'acknowledgement-evidence',
    false,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ack_evidence_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'acknowledgement-evidence'
        AND (storage.foldername(name))[1] IS NOT NULL
        AND public.is_org_member((storage.foldername(name))[1])
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "ack_evidence_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'acknowledgement-evidence'
        AND (
            (storage.foldername(name))[2] = auth.uid()::text
            OR public.is_org_editor((storage.foldername(name))[1])
        )
    );

CREATE POLICY "ack_evidence_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'acknowledgement-evidence'
        AND (storage.foldername(name))[2] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'acknowledgement-evidence'
        AND (storage.foldername(name))[2] = auth.uid()::text
    );

CREATE POLICY "ack_evidence_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'acknowledgement-evidence'
        AND public.is_org_editor((storage.foldername(name))[1])
    );

-- ---------------------------------------------------------------------------
-- RPC: get_my_irl
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_irl()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_result jsonb := '[]'::jsonb;
    v_member record;
    v_mat record;
    v_filtered jsonb;
    v_wc_display text;
    v_sort_key int;
    v_entry jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    FOR v_member IN
        SELECT
            m.id AS member_id,
            m.organization_id,
            m.cargo_id,
            m.work_center_id,
            p.name AS cargo_name,
            o.name AS org_name
        FROM organization_members m
        LEFT JOIN positions p ON p.id = m.cargo_id
        LEFT JOIN organizations o ON o.id = m.organization_id
        WHERE m.auth_user_id = v_uid
          AND m.status = 'Activo'
          AND m.cargo_id IS NOT NULL
          AND p.name IS NOT NULL
    LOOP
        FOR v_mat IN
            SELECT im.*, wc.name AS wc_fk_name
            FROM iper_matrices im
            LEFT JOIN work_centers wc ON wc.id = im.work_center_id
            WHERE im.organization_id = v_member.organization_id
              AND im.status = 'Vigente'
        LOOP
            v_filtered := public.filter_hazards_for_cargo(v_mat.hazards, v_member.cargo_name);
            IF jsonb_array_length(v_filtered) = 0 THEN
                CONTINUE;
            END IF;

            v_wc_display := COALESCE(v_mat.wc_fk_name, v_mat.work_center, '');
            v_sort_key := CASE
                WHEN v_member.work_center_id IS NOT NULL
                     AND v_mat.work_center_id = v_member.work_center_id THEN 0
                WHEN v_member.work_center_id IS NOT NULL THEN 1
                ELSE 0
            END;

            v_entry := jsonb_build_object(
                'memberId', v_member.member_id,
                'organizationId', v_member.organization_id,
                'organizationName', v_member.org_name,
                'matrixId', v_mat.id,
                'matrixCode', v_mat.code,
                'matrixTitle', v_mat.title,
                'workCenterId', v_mat.work_center_id,
                'workCenterName', v_wc_display,
                'cargoId', v_member.cargo_id,
                'cargoName', v_member.cargo_name,
                'matrixUpdatedAt', v_mat.updated_at,
                'sortKey', v_sort_key,
                'evaluations', v_filtered
            );
            v_result := v_result || jsonb_build_array(v_entry);
        END LOOP;
    END LOOP;

    IF jsonb_array_length(v_result) = 0 THEN
        RETURN '[]'::jsonb;
    END IF;

    RETURN (
        SELECT COALESCE(jsonb_agg(elem ORDER BY (elem->>'sortKey')::int, elem->>'matrixCode'), '[]'::jsonb)
        FROM jsonb_array_elements(v_result) AS elem
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: assign_document
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_document(
    p_organization_id text,
    p_source_type text,
    p_source_id text,
    p_assignee_member_id text,
    p_cargo_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_assignee record;
    v_snapshot jsonb;
    v_hash text;
    v_title text;
    v_code text;
    v_source_updated timestamptz;
    v_wc_id text;
    v_wc_name text;
    v_cargo_id text;
    v_cargo_name text;
    v_new_id uuid;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;
    IF NOT public.is_org_editor(p_organization_id) THEN
        RAISE EXCEPTION 'Sin permiso para asignar documentos';
    END IF;
    IF p_source_type NOT IN ('irl', 'technical_document') THEN
        RAISE EXCEPTION 'Tipo de documento inválido';
    END IF;

    SELECT m.*, p.name AS position_name, wc.name AS wc_name
    INTO v_assignee
    FROM organization_members m
    LEFT JOIN positions p ON p.id = m.cargo_id
    LEFT JOIN work_centers wc ON wc.id = m.work_center_id
    WHERE m.id = p_assignee_member_id
      AND m.organization_id = p_organization_id
      AND m.status = 'Activo';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trabajador no encontrado o inactivo';
    END IF;
    IF v_assignee.auth_user_id IS NULL THEN
        RAISE EXCEPTION 'El trabajador no tiene cuenta de acceso vinculada';
    END IF;

    v_cargo_id := v_assignee.cargo_id;
    v_cargo_name := COALESCE(p_cargo_name, v_assignee.position_name);
    v_wc_id := v_assignee.work_center_id;
    v_wc_name := v_assignee.wc_name;

    IF p_source_type = 'irl' THEN
        DECLARE
            v_mat record;
            v_filtered jsonb;
        BEGIN
            SELECT * INTO v_mat
            FROM iper_matrices
            WHERE id = p_source_id
              AND organization_id = p_organization_id
              AND status = 'Vigente';

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Matriz IRL no vigente o no encontrada';
            END IF;
            IF v_cargo_name IS NULL OR trim(v_cargo_name) = '' THEN
                RAISE EXCEPTION 'Cargo requerido para envío de IRL';
            END IF;

            v_filtered := public.filter_hazards_for_cargo(v_mat.hazards, v_cargo_name);
            IF jsonb_array_length(v_filtered) = 0 THEN
                RAISE EXCEPTION 'No hay evaluaciones para el cargo indicado';
            END IF;

            v_wc_name := COALESCE(v_wc_name, (
                SELECT name FROM work_centers WHERE id = v_mat.work_center_id
            ), v_mat.work_center);

            v_snapshot := jsonb_build_object(
                'kind', 'irl',
                'matrixId', v_mat.id,
                'matrixCode', v_mat.code,
                'matrixTitle', v_mat.title,
                'workCenterName', v_wc_name,
                'cargoName', v_cargo_name,
                'responsible', v_mat.responsible,
                'evaluations', v_filtered
            );
            v_title := 'IRL — ' || v_cargo_name;
            v_code := 'IRL-' || v_mat.code || '-' || upper(left(v_cargo_name, 3));
            v_source_updated := v_mat.updated_at;
        END;
    ELSE
        DECLARE
            v_doc record;
        BEGIN
            SELECT * INTO v_doc
            FROM technical_documents
            WHERE id = p_source_id
              AND organization_id = p_organization_id
              AND status = 'Vigente';

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Documento técnico no vigente o no encontrado';
            END IF;

            v_snapshot := jsonb_build_object(
                'kind', 'technical_document',
                'documentId', v_doc.id,
                'documentType', v_doc.document_type,
                'name', v_doc.name,
                'content', v_doc.content
            );
            v_title := v_doc.name;
            v_code := v_doc.document_type || '-' || v_doc.id;
            v_source_updated := v_doc.updated_at;
        END;
    END IF;

    v_hash := public.hash_jsonb_content(v_snapshot);

    INSERT INTO document_deliveries (
        organization_id,
        assignee_member_id,
        assignee_auth_user_id,
        source_type,
        source_id,
        cargo_id,
        cargo_name,
        work_center_id,
        work_center_name,
        title,
        document_code,
        content_snapshot,
        content_hash,
        source_updated_at,
        status,
        assigned_by
    ) VALUES (
        p_organization_id,
        p_assignee_member_id,
        v_assignee.auth_user_id,
        p_source_type,
        p_source_id,
        v_cargo_id,
        v_cargo_name,
        v_wc_id,
        v_wc_name,
        v_title,
        v_code,
        v_snapshot,
        v_hash,
        v_source_updated,
        'pendiente_revision',
        v_uid
    )
    RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: mark_document_opened
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_document_opened(p_delivery_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row document_deliveries%ROWTYPE;
BEGIN
    SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;
    IF v_row.assignee_auth_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    IF v_row.status NOT IN ('pendiente_revision', 'pendiente_firma') THEN
        RETURN;
    END IF;
    IF v_row.opened_at IS NULL THEN
        UPDATE document_deliveries
        SET opened_at = clock_timestamp()
        WHERE id = p_delivery_id;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: confirm_document_review (pendiente_firma)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.confirm_document_review(p_delivery_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row document_deliveries%ROWTYPE;
BEGIN
    SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;
    IF v_row.assignee_auth_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    IF v_row.status = 'pendiente_revision' THEN
        UPDATE document_deliveries
        SET status = 'pendiente_firma'
        WHERE id = p_delivery_id;
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: register_acknowledgement
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.register_acknowledgement(
    p_delivery_id uuid,
    p_signature_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row document_deliveries%ROWTYPE;
    v_uid uuid := auth.uid();
    v_expected_prefix text;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;
    IF p_signature_path IS NULL OR trim(p_signature_path) = '' THEN
        RAISE EXCEPTION 'Ruta de firma requerida';
    END IF;

    SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;
    IF v_row.assignee_auth_user_id <> v_uid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    IF v_row.status NOT IN ('pendiente_revision', 'pendiente_firma') THEN
        RAISE EXCEPTION 'La entrega no está pendiente de firma';
    END IF;

    v_expected_prefix := v_row.organization_id || '/' || v_uid::text || '/';
    IF position(v_expected_prefix IN p_signature_path) <> 1 THEN
        RAISE EXCEPTION 'Ruta de firma inválida';
    END IF;

    UPDATE document_deliveries
    SET
        status = 'firmado',
        signed_at = clock_timestamp(),
        signed_by_auth_user_id = v_uid,
        signature_path = p_signature_path
    WHERE id = p_delivery_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: void_document_delivery
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.void_document_delivery(
    p_delivery_id uuid,
    p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row document_deliveries%ROWTYPE;
BEGIN
    SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrega no encontrada';
    END IF;
    IF NOT public.is_org_editor(v_row.organization_id) THEN
        RAISE EXCEPTION 'Sin permiso';
    END IF;
    IF v_row.status = 'anulado' THEN
        RETURN;
    END IF;

    UPDATE document_deliveries
    SET
        status = 'anulado',
        voided_at = clock_timestamp(),
        voided_by = auth.uid(),
        void_reason = p_reason
    WHERE id = p_delivery_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_irl() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_document(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_document_opened(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_document_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_acknowledgement(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.void_document_delivery(uuid, text) TO authenticated;


-- ========== 20261002_org_members_no_self_join.sql ==========
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


-- ========== 20261002_organization_display_name.sql ==========
-- Nombre de organización: preferencias de onboarding prevalecen sobre organizations.name

CREATE OR REPLACE FUNCTION public.organization_display_name(p_org_id text)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(trim(op.preferences->>'organizationName'), ''),
    NULLIF(trim(o.name), ''),
    'Empresa'
  )
  FROM organizations o
  LEFT JOIN organization_preferences op
    ON op.id = CASE WHEN p_org_id = 'org_demo' THEN 'default_org' ELSE p_org_id END
  WHERE o.id = p_org_id;
$$;

CREATE OR REPLACE FUNCTION public.get_my_irl()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_result jsonb := '[]'::jsonb;
    v_member record;
    v_mat record;
    v_filtered jsonb;
    v_wc_display text;
    v_sort_key int;
    v_entry jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    FOR v_member IN
        SELECT
            m.id AS member_id,
            m.organization_id,
            m.cargo_id,
            m.work_center_id,
            p.name AS cargo_name,
            public.organization_display_name(m.organization_id) AS org_name
        FROM organization_members m
        LEFT JOIN positions p ON p.id = m.cargo_id
        WHERE m.auth_user_id = v_uid
          AND m.status = 'Activo'
          AND m.cargo_id IS NOT NULL
          AND p.name IS NOT NULL
    LOOP
        FOR v_mat IN
            SELECT im.*, wc.name AS wc_fk_name
            FROM iper_matrices im
            LEFT JOIN work_centers wc ON wc.id = im.work_center_id
            WHERE im.organization_id = v_member.organization_id
              AND im.status = 'Vigente'
        LOOP
            v_filtered := public.filter_hazards_for_cargo(v_mat.hazards, v_member.cargo_name);
            IF jsonb_array_length(v_filtered) = 0 THEN
                CONTINUE;
            END IF;

            v_wc_display := COALESCE(v_mat.wc_fk_name, v_mat.work_center, '');
            v_sort_key := CASE
                WHEN v_member.work_center_id IS NOT NULL
                     AND v_mat.work_center_id = v_member.work_center_id THEN 0
                WHEN v_member.work_center_id IS NOT NULL THEN 1
                ELSE 0
            END;

            v_entry := jsonb_build_object(
                'memberId', v_member.member_id,
                'organizationId', v_member.organization_id,
                'organizationName', v_member.org_name,
                'matrixId', v_mat.id,
                'matrixCode', v_mat.code,
                'matrixTitle', v_mat.title,
                'workCenterId', v_mat.work_center_id,
                'workCenterName', v_wc_display,
                'cargoId', v_member.cargo_id,
                'cargoName', v_member.cargo_name,
                'matrixUpdatedAt', v_mat.updated_at,
                'sortKey', v_sort_key,
                'evaluations', v_filtered
            );
            v_result := v_result || jsonb_build_array(v_entry);
        END LOOP;
    END LOOP;

    IF jsonb_array_length(v_result) = 0 THEN
        RETURN '[]'::jsonb;
    END IF;

    RETURN (
        SELECT COALESCE(jsonb_agg(elem ORDER BY (elem->>'sortKey')::int, elem->>'matrixCode'), '[]'::jsonb)
        FROM jsonb_array_elements(v_result) AS elem
    );
END;
$$;


-- ========== 20261003_apr_drop_permissive_policies.sql ==========
-- Remove permissive APR policies so only service_role (and deny-all for clients) applies.

DROP POLICY IF EXISTS "apr_ai_usage_member" ON apr_ai_usage;
DROP POLICY IF EXISTS "apr_ai_cache_member" ON apr_ai_suggestion_cache;
DROP POLICY IF EXISTS "apr_ai_cache_write" ON apr_ai_suggestion_cache;

-- Keep deny policies from 20260931 (apr_ai_usage_service_only, apr_ai_cache_service_only).


-- ========== 20261004_org_members_auth_org_index.sql ==========
CREATE INDEX IF NOT EXISTS idx_org_members_auth_org_status
  ON organization_members (auth_user_id, organization_id, status);


-- ========== 20261005_artp.sql ==========
-- ARTP: Análisis de Riesgo de la Tarea Planificada

ALTER TABLE iper_matrices
    ADD COLUMN IF NOT EXISTS source_matrix_id TEXT NULL;

COMMENT ON COLUMN iper_matrices.source_matrix_id IS 'Matriz origen cuando este registro es borrador clonado para actualización';

-- ---------------------------------------------------------------------------
-- energy_types
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS energy_types (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_energy_types_system_code
    ON energy_types (code) WHERE organization_id IS NULL AND is_system = true;

CREATE UNIQUE INDEX IF NOT EXISTS uq_energy_types_org_code
    ON energy_types (organization_id, code) WHERE organization_id IS NOT NULL;

INSERT INTO energy_types (id, organization_id, code, label, is_system, active) VALUES
    ('energy_sys_electrica', NULL, 'electrica', 'Eléctrica', true, true),
    ('energy_sys_mecanica', NULL, 'mecanica', 'Mecánica', true, true),
    ('energy_sys_hidraulica', NULL, 'hidraulica', 'Hidráulica', true, true),
    ('energy_sys_neumatica', NULL, 'neumatica', 'Neumática', true, true),
    ('energy_sys_termica', NULL, 'termica', 'Térmica', true, true),
    ('energy_sys_quimica', NULL, 'quimica', 'Química', true, true),
    ('energy_sys_gravitacional', NULL, 'gravitacional', 'Gravitacional', true, true),
    ('energy_sys_presion', NULL, 'presion', 'Presión', true, true),
    ('energy_sys_almacenada', NULL, 'almacenada', 'Energía almacenada', true, true),
    ('energy_sys_otra', NULL, 'otra', 'Otra', true, true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- org_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_tasks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    description TEXT,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL,
    origin TEXT NOT NULL DEFAULT 'manual'
        CHECK (origin IN ('manual', 'iper', 'artp')),
    iper_matrix_id TEXT REFERENCES iper_matrices(id) ON DELETE SET NULL,
    iper_task_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_tasks_org_name_process
    ON org_tasks (organization_id, normalized_name, COALESCE(process_id, ''));

-- ---------------------------------------------------------------------------
-- artp_documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artp_documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL,
    org_task_id TEXT NOT NULL REFERENCES org_tasks(id) ON DELETE RESTRICT,
    current_version_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_artp_documents_org ON artp_documents(organization_id);

-- ---------------------------------------------------------------------------
-- artp_versions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artp_versions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    artp_document_id TEXT NOT NULL REFERENCES artp_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'borrador'
        CHECK (status IN ('borrador', 'en_revision', 'vigente', 'archivado')),
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    process_id TEXT REFERENCES processes(id) ON DELETE SET NULL,
    subprocess_id TEXT REFERENCES subprocesses(id) ON DELETE SET NULL,
    org_task_id TEXT NOT NULL REFERENCES org_tasks(id) ON DELETE RESTRICT,
    task_name TEXT NOT NULL,
    supervisor_member_id TEXT REFERENCES organization_members(id) ON DELETE SET NULL,
    content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_hash TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    UNIQUE (artp_document_id, version_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_artp_versions_one_vigente
    ON artp_versions (artp_document_id) WHERE status = 'vigente';

CREATE INDEX IF NOT EXISTS idx_artp_versions_org ON artp_versions(organization_id);
CREATE INDEX IF NOT EXISTS idx_artp_versions_doc ON artp_versions(artp_document_id);

ALTER TABLE artp_documents
    ADD CONSTRAINT artp_documents_current_version_fkey
    FOREIGN KEY (current_version_id) REFERENCES artp_versions(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Child planning tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artp_version_positions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version_id TEXT NOT NULL REFERENCES artp_versions(id) ON DELETE CASCADE,
    position_id TEXT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    UNIQUE (version_id, position_id)
);

CREATE TABLE IF NOT EXISTS artp_steps (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version_id TEXT NOT NULL REFERENCES artp_versions(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    description TEXT NOT NULL,
    tools TEXT[] NOT NULL DEFAULT '{}',
    UNIQUE (version_id, sequence)
);

CREATE TABLE IF NOT EXISTS artp_step_energies (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL REFERENCES artp_steps(id) ON DELETE CASCADE,
    energy_type_id TEXT NOT NULL REFERENCES energy_types(id) ON DELETE RESTRICT,
    UNIQUE (step_id, energy_type_id)
);

CREATE TABLE IF NOT EXISTS artp_step_hazards (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    step_id TEXT NOT NULL REFERENCES artp_steps(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    catalog_code TEXT,
    classification TEXT CHECK (classification IS NULL OR classification IN (
        'Seguridad', 'Emergencias', 'Higiénicos', 'Psicosociales', 'Músculo-esquelético'
    )),
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'catalog', 'iper', 'ai'))
);

CREATE TABLE IF NOT EXISTS artp_step_risks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    hazard_id TEXT NOT NULL REFERENCES artp_step_hazards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    catalog_code TEXT,
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'catalog', 'iper', 'ai'))
);

CREATE TABLE IF NOT EXISTS artp_step_controls (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    risk_id TEXT NOT NULL REFERENCES artp_step_risks(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    control_type TEXT NOT NULL CHECK (control_type IN (
        'Eliminar / Sustituir',
        'Controles de Ingeniería',
        'Controles Administrativos',
        'Elementos de Protección Personal (EPP)'
    )),
    is_critical BOOLEAN NOT NULL DEFAULT false,
    verification_question TEXT,
    source TEXT NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'catalog', 'iper', 'ai'))
);

CREATE TABLE IF NOT EXISTS artp_iper_links (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    org_task_id TEXT NOT NULL REFERENCES org_tasks(id) ON DELETE CASCADE,
    artp_document_id TEXT NOT NULL REFERENCES artp_documents(id) ON DELETE CASCADE,
    iper_matrix_id TEXT NOT NULL REFERENCES iper_matrices(id) ON DELETE CASCADE,
    task_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'propuesta_pendiente'
        CHECK (status IN ('vinculada', 'propuesta_pendiente')),
    proposed_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artp_iper_links_matrix ON artp_iper_links(iper_matrix_id);

-- ---------------------------------------------------------------------------
-- Executions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artp_executions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    artp_version_id TEXT NOT NULL REFERENCES artp_versions(id) ON DELETE RESTRICT,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'en_ejecucion', 'detenida', 'completada')),
    work_center_id TEXT REFERENCES work_centers(id) ON DELETE SET NULL,
    area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
    specific_location TEXT,
    supervisor_member_id TEXT REFERENCES organization_members(id) ON DELETE SET NULL,
    starts_on DATE,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    environment_ok BOOLEAN,
    environment_notes TEXT,
    people_as_planned BOOLEAN,
    tools_as_planned BOOLEAN,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_artp_executions_org ON artp_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_artp_executions_version ON artp_executions(artp_version_id);

CREATE TABLE IF NOT EXISTS artp_execution_changes (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_id TEXT NOT NULL REFERENCES artp_executions(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('personas', 'entorno', 'herramientas')),
    description TEXT NOT NULL,
    undesired_event TEXT,
    additional_control TEXT,
    responsible_member_id TEXT REFERENCES organization_members(id) ON DELETE SET NULL,
    implementation_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artp_execution_checks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_id TEXT NOT NULL REFERENCES artp_executions(id) ON DELETE CASCADE,
    control_id TEXT NOT NULL REFERENCES artp_step_controls(id) ON DELETE RESTRICT,
    answer TEXT CHECK (answer IS NULL OR answer IN ('si', 'no', 'no_aplica')),
    note TEXT,
    answered_by_member_id TEXT REFERENCES organization_members(id) ON DELETE SET NULL,
    answered_at TIMESTAMPTZ,
    UNIQUE (execution_id, control_id)
);

CREATE TABLE IF NOT EXISTS artp_execution_participants (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    execution_id TEXT NOT NULL REFERENCES artp_executions(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    fit_to_work BOOLEAN,
    alert_ok BOOLEAN,
    fit_declared_at TIMESTAMPTZ,
    alert_declared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (execution_id, member_id)
);

CREATE TABLE IF NOT EXISTS artp_acknowledgements (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL REFERENCES artp_execution_participants(id) ON DELETE CASCADE,
    execution_id TEXT NOT NULL REFERENCES artp_executions(id) ON DELETE CASCADE,
    artp_version_id TEXT NOT NULL REFERENCES artp_versions(id) ON DELETE RESTRICT,
    member_id TEXT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL,
    content_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'confirmado')),
    signed_at TIMESTAMPTZ,
    signature_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (execution_id, member_id)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.artp_version_is_editable(p_version_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM artp_versions v
    WHERE v.id = p_version_id
      AND v.status IN ('borrador', 'en_revision')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_member_id_for_auth(p_org_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id FROM organization_members m
  WHERE m.organization_id = p_org_id
    AND m.auth_user_id = auth.uid()
    AND m.status = 'Activo'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_read_artp_version(p_version_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org TEXT;
  v_status TEXT;
  v_cargo TEXT;
BEGIN
  SELECT organization_id, status INTO v_org, v_status
  FROM artp_versions WHERE id = p_version_id;
  IF v_org IS NULL THEN RETURN false; END IF;
  IF public.is_org_editor(v_org) THEN RETURN true; END IF;
  IF NOT public.is_org_member(v_org) THEN RETURN false; END IF;

  SELECT cargo_id INTO v_cargo FROM organization_members
  WHERE organization_id = v_org AND auth_user_id = auth.uid() AND status = 'Activo'
  LIMIT 1;

  IF v_status = 'vigente' AND v_cargo IS NOT NULL AND EXISTS (
    SELECT 1 FROM artp_version_positions vp
    WHERE vp.version_id = p_version_id AND vp.position_id = v_cargo
  ) THEN RETURN true; END IF;

  IF EXISTS (
    SELECT 1 FROM artp_executions e
    JOIN artp_execution_participants p ON p.execution_id = e.id
    JOIN organization_members m ON m.id = p.member_id
    WHERE e.artp_version_id = p_version_id AND m.auth_user_id = auth.uid()
  ) THEN RETURN true; END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_read_artp_execution(p_execution_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org TEXT;
BEGIN
  SELECT organization_id INTO v_org FROM artp_executions WHERE id = p_execution_id;
  IF v_org IS NULL THEN RETURN false; END IF;
  IF public.is_org_editor(v_org) THEN RETURN true; END IF;
  IF NOT public.is_org_member(v_org) THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM artp_execution_participants p
    JOIN organization_members m ON m.id = p.member_id
    WHERE p.execution_id = p_execution_id AND m.auth_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM artp_executions e
    JOIN organization_members m ON m.id = e.supervisor_member_id
    WHERE e.id = p_execution_id AND m.auth_user_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.build_artp_version_snapshot(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc artp_documents%ROWTYPE;
  v_ver artp_versions%ROWTYPE;
  v_steps JSONB := '[]'::jsonb;
  v_positions JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('positionId', vp.position_id)), '[]'::jsonb)
  INTO v_positions FROM artp_version_positions vp WHERE vp.version_id = p_version_id;

  SELECT COALESCE(jsonb_agg(step_json ORDER BY (step_json->>'sequence')::int), '[]'::jsonb)
  INTO v_steps
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'sequence', s.sequence,
      'description', s.description,
      'tools', s.tools,
      'energies', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', et.id, 'code', et.code, 'label', et.label)), '[]'::jsonb)
        FROM artp_step_energies se JOIN energy_types et ON et.id = se.energy_type_id
        WHERE se.step_id = s.id
      ),
      'hazards', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', h.id, 'name', h.name, 'classification', h.classification,
          'risks', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'id', r.id, 'name', r.name,
              'controls', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                  'id', c.id, 'description', c.description, 'controlType', c.control_type,
                  'isCritical', c.is_critical, 'verificationQuestion', c.verification_question
                )), '[]'::jsonb)
                FROM artp_step_controls c WHERE c.risk_id = r.id
              )
            )), '[]'::jsonb)
            FROM artp_step_risks r WHERE r.hazard_id = h.id
          )
        )), '[]'::jsonb)
        FROM artp_step_hazards h WHERE h.step_id = s.id
      )
    ) AS step_json
    FROM artp_steps s WHERE s.version_id = p_version_id
  ) sub;

  RETURN jsonb_build_object(
    'kind', 'artp',
    'documentId', v_doc.id,
    'documentName', v_doc.name,
    'documentCode', v_doc.code,
    'versionId', v_ver.id,
    'versionNumber', v_ver.version_number,
    'taskName', v_ver.task_name,
    'positions', v_positions,
    'steps', v_steps
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE energy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_version_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_step_energies ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_step_hazards ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_step_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_step_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_iper_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_execution_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_execution_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_execution_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE artp_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "energy_types_select" ON energy_types FOR SELECT TO authenticated
  USING (organization_id IS NULL OR is_org_member(organization_id));

CREATE POLICY "energy_types_insert_org" ON energy_types FOR INSERT TO authenticated
  WITH CHECK (organization_id IS NOT NULL AND is_system = false AND is_org_editor(organization_id));

CREATE POLICY "org_tasks_member" ON org_tasks FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_documents_member" ON artp_documents FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
CREATE POLICY "artp_documents_editor" ON artp_documents FOR INSERT TO authenticated
  WITH CHECK (is_org_editor(organization_id));
CREATE POLICY "artp_documents_update" ON artp_documents FOR UPDATE TO authenticated
  USING (is_org_editor(organization_id)) WITH CHECK (is_org_editor(organization_id));
CREATE POLICY "artp_documents_delete" ON artp_documents FOR DELETE TO authenticated
  USING (is_org_editor(organization_id));

CREATE POLICY "artp_versions_select" ON artp_versions FOR SELECT TO authenticated
  USING (can_read_artp_version(id));
CREATE POLICY "artp_versions_editor_insert" ON artp_versions FOR INSERT TO authenticated
  WITH CHECK (is_org_editor(organization_id));
CREATE POLICY "artp_versions_editor_update" ON artp_versions FOR UPDATE TO authenticated
  USING (is_org_editor(organization_id) AND status IN ('borrador', 'en_revision'))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_child_select" ON artp_version_positions FOR SELECT TO authenticated
  USING (can_read_artp_version(version_id));
CREATE POLICY "artp_child_editor" ON artp_version_positions FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND artp_version_is_editable(version_id))
  WITH CHECK (is_org_editor(organization_id) AND artp_version_is_editable(version_id));

CREATE POLICY "artp_steps_select" ON artp_steps FOR SELECT TO authenticated
  USING (can_read_artp_version(version_id));
CREATE POLICY "artp_steps_editor" ON artp_steps FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND artp_version_is_editable(version_id))
  WITH CHECK (is_org_editor(organization_id) AND artp_version_is_editable(version_id));

CREATE POLICY "artp_step_energies_select" ON artp_step_energies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM artp_steps s WHERE s.id = step_id AND can_read_artp_version(s.version_id)));
CREATE POLICY "artp_step_energies_editor" ON artp_step_energies FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_steps s WHERE s.id = step_id AND artp_version_is_editable(s.version_id)))
  WITH CHECK (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_steps s WHERE s.id = step_id AND artp_version_is_editable(s.version_id)));

CREATE POLICY "artp_step_hazards_select" ON artp_step_hazards FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM artp_steps s WHERE s.id = step_id AND can_read_artp_version(s.version_id)));
CREATE POLICY "artp_step_hazards_editor" ON artp_step_hazards FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_steps s WHERE s.id = step_id AND artp_version_is_editable(s.version_id)))
  WITH CHECK (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_steps s WHERE s.id = step_id AND artp_version_is_editable(s.version_id)));

CREATE POLICY "artp_step_risks_select" ON artp_step_risks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM artp_step_hazards h JOIN artp_steps s ON s.id = h.step_id
    WHERE h.id = hazard_id AND can_read_artp_version(s.version_id)));
CREATE POLICY "artp_step_risks_editor" ON artp_step_risks FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_step_hazards h JOIN artp_steps s ON s.id = h.step_id
    WHERE h.id = hazard_id AND artp_version_is_editable(s.version_id)))
  WITH CHECK (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_step_hazards h JOIN artp_steps s ON s.id = h.step_id
    WHERE h.id = hazard_id AND artp_version_is_editable(s.version_id)));

CREATE POLICY "artp_step_controls_select" ON artp_step_controls FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM artp_step_risks r JOIN artp_step_hazards h ON h.id = r.hazard_id
    JOIN artp_steps s ON s.id = h.step_id
    WHERE r.id = risk_id AND can_read_artp_version(s.version_id)));
CREATE POLICY "artp_step_controls_editor" ON artp_step_controls FOR ALL TO authenticated
  USING (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_step_risks r JOIN artp_step_hazards h ON h.id = r.hazard_id
    JOIN artp_steps s ON s.id = h.step_id
    WHERE r.id = risk_id AND artp_version_is_editable(s.version_id)))
  WITH CHECK (is_org_editor(organization_id) AND EXISTS (
    SELECT 1 FROM artp_step_risks r JOIN artp_step_hazards h ON h.id = r.hazard_id
    JOIN artp_steps s ON s.id = h.step_id
    WHERE r.id = risk_id AND artp_version_is_editable(s.version_id)));

CREATE POLICY "artp_iper_links_member" ON artp_iper_links FOR ALL TO authenticated
  USING (is_org_member(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_executions_select" ON artp_executions FOR SELECT TO authenticated
  USING (can_read_artp_execution(id));
CREATE POLICY "artp_executions_editor" ON artp_executions FOR ALL TO authenticated
  USING (is_org_editor(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_execution_changes_select" ON artp_execution_changes FOR SELECT TO authenticated
  USING (can_read_artp_execution(execution_id));
CREATE POLICY "artp_execution_changes_editor" ON artp_execution_changes FOR ALL TO authenticated
  USING (is_org_editor(organization_id))
  WITH CHECK (is_org_editor(organization_id));

CREATE POLICY "artp_execution_checks_select" ON artp_execution_checks FOR SELECT TO authenticated
  USING (can_read_artp_execution(execution_id));
CREATE POLICY "artp_execution_checks_write" ON artp_execution_checks FOR ALL TO authenticated
  USING (can_read_artp_execution(execution_id))
  WITH CHECK (can_read_artp_execution(execution_id));

CREATE POLICY "artp_execution_participants_select" ON artp_execution_participants FOR SELECT TO authenticated
  USING (can_read_artp_execution(execution_id));
CREATE POLICY "artp_execution_participants_editor" ON artp_execution_participants FOR ALL TO authenticated
  USING (is_org_editor(organization_id) OR (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.id = member_id AND m.auth_user_id = auth.uid()
    ) AND EXISTS (SELECT 1 FROM artp_executions e WHERE e.id = execution_id AND e.status = 'pendiente')
  ))
  WITH CHECK (is_org_editor(organization_id) OR (
    EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.id = member_id AND m.auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "artp_acknowledgements_select" ON artp_acknowledgements FOR SELECT TO authenticated
  USING (can_read_artp_execution(execution_id));

REVOKE INSERT, UPDATE, DELETE ON artp_acknowledgements FROM authenticated;

-- ---------------------------------------------------------------------------
-- RPC: get_artp_version_detail
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_artp_version_detail(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_doc artp_documents%ROWTYPE;
  v_snapshot JSONB;
BEGIN
  IF NOT public.can_read_artp_version(p_version_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  IF v_ver.status IN ('vigente', 'archivado') AND v_ver.content_snapshot IS NOT NULL
     AND v_ver.content_snapshot <> '{}'::jsonb THEN
    v_snapshot := v_ver.content_snapshot;
  ELSE
    v_snapshot := public.build_artp_version_snapshot(p_version_id);
  END IF;

  RETURN jsonb_build_object(
    'document', jsonb_build_object(
      'id', v_doc.id, 'name', v_doc.name, 'code', v_doc.code, 'description', v_doc.description
    ),
    'version', jsonb_build_object(
      'id', v_ver.id, 'versionNumber', v_ver.version_number, 'status', v_ver.status,
      'taskName', v_ver.task_name, 'contentHash', v_ver.content_hash, 'publishedAt', v_ver.published_at
    ),
    'content', v_snapshot
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: publish_artp_version
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_artp_version(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_hash TEXT;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_ver.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_ver.status NOT IN ('borrador', 'en_revision') THEN
    RAISE EXCEPTION 'La versión no se puede publicar';
  END IF;

  v_snap := public.build_artp_version_snapshot(p_version_id);
  v_hash := encode(digest(v_snap::text, 'sha256'), 'hex');

  UPDATE artp_versions SET status = 'archivado', updated_at = NOW()
  WHERE artp_document_id = v_ver.artp_document_id AND status = 'vigente';

  UPDATE artp_versions SET
    status = 'vigente',
    content_snapshot = v_snap,
    content_hash = v_hash,
    published_at = clock_timestamp(),
    updated_at = NOW()
  WHERE id = p_version_id;

  UPDATE artp_documents SET current_version_id = p_version_id, updated_at = NOW()
  WHERE id = v_ver.artp_document_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: clone_artp_version (new draft from vigente)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clone_artp_version(p_source_version_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src artp_versions%ROWTYPE;
  v_new_id TEXT;
  v_num INTEGER;
  r RECORD;
  new_step_id TEXT;
  old_step_id TEXT;
  new_hazard_id TEXT;
  old_hazard_id TEXT;
  new_risk_id TEXT;
  old_risk_id TEXT;
BEGIN
  SELECT * INTO v_src FROM artp_versions WHERE id = p_source_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_src.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_src.status <> 'vigente' THEN RAISE EXCEPTION 'Solo se versiona desde vigente'; END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_num FROM artp_versions WHERE artp_document_id = v_src.artp_document_id;
  v_new_id := p_source_version_id || '_v' || v_num;

  INSERT INTO artp_versions (
    id, organization_id, artp_document_id, version_number, status,
    work_center_id, area_id, process_id, subprocess_id, org_task_id, task_name,
    supervisor_member_id, created_by
  ) VALUES (
    v_new_id, v_src.organization_id, v_src.artp_document_id, v_num, 'borrador',
    v_src.work_center_id, v_src.area_id, v_src.process_id, v_src.subprocess_id,
    v_src.org_task_id, v_src.task_name, v_src.supervisor_member_id, auth.uid()
  );

  INSERT INTO artp_version_positions (id, organization_id, version_id, position_id)
  SELECT id || '_c' || v_num, organization_id, v_new_id, position_id
  FROM artp_version_positions WHERE version_id = p_source_version_id;

  FOR r IN SELECT id FROM artp_steps WHERE version_id = p_source_version_id ORDER BY sequence LOOP
    old_step_id := r.id;
    new_step_id := old_step_id || '_c' || v_num;
    INSERT INTO artp_steps (id, organization_id, version_id, sequence, description, tools)
    SELECT new_step_id, organization_id, v_new_id, sequence, description, tools
    FROM artp_steps WHERE id = old_step_id;

    INSERT INTO artp_step_energies (id, organization_id, step_id, energy_type_id)
    SELECT id || '_c' || v_num, organization_id, new_step_id, energy_type_id
    FROM artp_step_energies WHERE step_id = old_step_id;

    FOR r IN SELECT id FROM artp_step_hazards WHERE step_id = old_step_id LOOP
      old_hazard_id := r.id;
      new_hazard_id := old_hazard_id || '_c' || v_num;
      INSERT INTO artp_step_hazards SELECT new_hazard_id, organization_id, new_step_id, name, catalog_code, classification, source
      FROM artp_step_hazards WHERE id = old_hazard_id;

      FOR r IN SELECT id FROM artp_step_risks WHERE hazard_id = old_hazard_id LOOP
        old_risk_id := r.id;
        new_risk_id := old_risk_id || '_c' || v_num;
        INSERT INTO artp_step_risks SELECT new_risk_id, organization_id, new_hazard_id, name, catalog_code, source
        FROM artp_step_risks WHERE id = old_risk_id;

        INSERT INTO artp_step_controls (id, organization_id, risk_id, description, control_type, is_critical, verification_question, source)
        SELECT id || '_c' || v_num, organization_id, new_risk_id, description, control_type, is_critical, verification_question, source
        FROM artp_step_controls WHERE risk_id = old_risk_id;
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN v_new_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: transition_artp_execution
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transition_artp_execution(p_execution_id TEXT, p_target_status TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exec artp_executions%ROWTYPE;
  v_ver artp_versions%ROWTYPE;
  v_part RECORD;
  v_ctrl RECORD;
  v_chk artp_execution_checks%ROWTYPE;
BEGIN
  SELECT * INTO v_exec FROM artp_executions WHERE id = p_execution_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ejecución no encontrada'; END IF;
  IF NOT public.is_org_editor(v_exec.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;

  SELECT * INTO v_ver FROM artp_versions WHERE id = v_exec.artp_version_id;

  IF p_target_status = 'en_ejecucion' THEN
    IF v_exec.status <> 'pendiente' THEN RAISE EXCEPTION 'Estado inválido'; END IF;
    IF NOT EXISTS (SELECT 1 FROM artp_execution_participants WHERE execution_id = p_execution_id) THEN
      RAISE EXCEPTION 'Se requiere al menos un participante';
    END IF;
    FOR v_part IN SELECT * FROM artp_execution_participants WHERE execution_id = p_execution_id LOOP
      IF v_part.fit_to_work IS DISTINCT FROM true OR v_part.alert_ok IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Participantes deben declarar condición y alerta';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM artp_acknowledgements a
        WHERE a.execution_id = p_execution_id AND a.member_id = v_part.member_id
          AND a.status = 'confirmado' AND a.content_hash = v_ver.content_hash
      ) THEN
        RAISE EXCEPTION 'Falta toma de conocimiento confirmada';
      END IF;
    END LOOP;
    IF v_exec.environment_ok IS DISTINCT FROM true AND NOT EXISTS (
      SELECT 1 FROM artp_execution_changes c
      WHERE c.execution_id = p_execution_id AND c.category = 'entorno' AND c.implementation_verified = true
    ) THEN
      RAISE EXCEPTION 'Condiciones de entorno no verificadas';
    END IF;
    IF v_exec.people_as_planned = false AND NOT EXISTS (
      SELECT 1 FROM artp_execution_changes c
      WHERE c.execution_id = p_execution_id AND c.category = 'personas' AND c.implementation_verified = true
    ) THEN
      RAISE EXCEPTION 'Gestión del cambio de personas pendiente';
    END IF;
    IF v_exec.tools_as_planned = false AND NOT EXISTS (
      SELECT 1 FROM artp_execution_changes c
      WHERE c.execution_id = p_execution_id AND c.category = 'herramientas' AND c.implementation_verified = true
    ) THEN
      RAISE EXCEPTION 'Gestión del cambio de herramientas pendiente';
    END IF;
    FOR v_ctrl IN
      SELECT c.* FROM artp_step_controls c
      JOIN artp_step_risks r ON r.id = c.risk_id
      JOIN artp_step_hazards h ON h.id = r.hazard_id
      JOIN artp_steps s ON s.id = h.step_id
      WHERE s.version_id = v_exec.artp_version_id AND c.is_critical = true
    LOOP
      SELECT * INTO v_chk FROM artp_execution_checks
      WHERE execution_id = p_execution_id AND control_id = v_ctrl.id;
      IF v_chk.answer IS NULL OR v_chk.answer <> 'si' THEN
        RAISE EXCEPTION 'Controles críticos sin verificar';
      END IF;
    END LOOP;
    UPDATE artp_executions SET status = 'en_ejecucion', started_at = clock_timestamp(), updated_at = NOW()
    WHERE id = p_execution_id;
  ELSIF p_target_status = 'completada' THEN
    IF v_exec.status NOT IN ('en_ejecucion', 'detenida') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
    UPDATE artp_executions SET status = 'completada', ended_at = clock_timestamp(), updated_at = NOW()
    WHERE id = p_execution_id;
  ELSIF p_target_status = 'detenida' THEN
    UPDATE artp_executions SET status = 'detenida', updated_at = NOW() WHERE id = p_execution_id;
  ELSE
    RAISE EXCEPTION 'Transición no soportada';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: register_artp_acknowledgement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_artp_acknowledgement(
    p_ack_id TEXT,
    p_signature_path TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ack artp_acknowledgements%ROWTYPE;
  v_exec artp_executions%ROWTYPE;
  v_ver artp_versions%ROWTYPE;
  v_uid uuid := auth.uid();
  v_expected_prefix text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO v_ack FROM artp_acknowledgements WHERE id = p_ack_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Registro no encontrado'; END IF;
  SELECT * INTO v_exec FROM artp_executions WHERE id = v_ack.execution_id;
  IF v_exec.status <> 'pendiente' THEN RAISE EXCEPTION 'Ejecución no admite firma'; END IF;
  IF v_ack.auth_user_id <> v_uid THEN RAISE EXCEPTION 'No autorizado'; END IF;
  SELECT * INTO v_ver FROM artp_versions WHERE id = v_ack.artp_version_id;
  IF v_ver.content_hash IS DISTINCT FROM v_ack.content_hash THEN
    RAISE EXCEPTION 'Versión del ARTP no coincide';
  END IF;
  v_expected_prefix := v_ack.organization_id || '/' || v_uid::text || '/';
  IF position(v_expected_prefix IN p_signature_path) <> 1 THEN
    RAISE EXCEPTION 'Ruta de firma inválida';
  END IF;
  UPDATE artp_acknowledgements SET
    status = 'confirmado',
    signed_at = clock_timestamp(),
    signature_path = p_signature_path
  WHERE id = p_ack_id;
END;
$$;

-- RPC: ensure_artp_acknowledgement (creates pending row for participant)
CREATE OR REPLACE FUNCTION public.ensure_artp_acknowledgement(
    p_execution_id TEXT,
    p_member_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exec artp_executions%ROWTYPE;
    v_ver artp_versions%ROWTYPE;
    v_uid uuid := auth.uid();
    v_part_id TEXT;
    v_ack_id TEXT;
    v_auth uuid;
BEGIN
    SELECT * INTO v_exec FROM artp_executions WHERE id = p_execution_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Ejecución no encontrada'; END IF;
    SELECT * INTO v_ver FROM artp_versions WHERE id = v_exec.artp_version_id;
    SELECT auth_user_id INTO v_auth FROM organization_members WHERE id = p_member_id;
    IF v_auth IS NULL OR v_auth <> v_uid THEN
        RAISE EXCEPTION 'No autorizado';
    END IF;
    v_part_id := p_execution_id || '_' || p_member_id;
    INSERT INTO artp_execution_participants (id, organization_id, execution_id, member_id)
    VALUES (v_part_id, v_exec.organization_id, p_execution_id, p_member_id)
    ON CONFLICT (execution_id, member_id) DO NOTHING;
    v_ack_id := v_part_id || '_ack';
    INSERT INTO artp_acknowledgements (
        id, organization_id, participant_id, execution_id, artp_version_id,
        member_id, auth_user_id, content_hash, status
    ) VALUES (
        v_ack_id, v_exec.organization_id, v_part_id, p_execution_id, v_ver.id,
        p_member_id, v_uid, v_ver.content_hash, 'pendiente'
    )
    ON CONFLICT (execution_id, member_id) DO UPDATE SET content_hash = EXCLUDED.content_hash
    RETURNING id INTO v_ack_id;
    RETURN v_ack_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_artp_acknowledgement(TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.publish_artp_version(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clone_artp_version(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_artp_execution(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_artp_acknowledgement(TEXT, TEXT) TO authenticated;


-- ========== 20261006_artp_planning_snapshot.sql ==========
-- Preserve planning metadata (antecedentes, gestión de cambios, firmas) in published snapshots
CREATE OR REPLACE FUNCTION public.build_artp_version_snapshot(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc artp_documents%ROWTYPE;
  v_ver artp_versions%ROWTYPE;
  v_steps JSONB := '[]'::jsonb;
  v_positions JSONB := '[]'::jsonb;
  v_planning JSONB := '{}'::jsonb;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);

  SELECT COALESCE(jsonb_agg(jsonb_build_object('positionId', vp.position_id)), '[]'::jsonb)
  INTO v_positions FROM artp_version_positions vp WHERE vp.version_id = p_version_id;

  SELECT COALESCE(jsonb_agg(step_json ORDER BY (step_json->>'sequence')::int), '[]'::jsonb)
  INTO v_steps
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'sequence', s.sequence,
      'description', s.description,
      'tools', s.tools,
      'energies', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', et.id, 'code', et.code, 'label', et.label)), '[]'::jsonb)
        FROM artp_step_energies se JOIN energy_types et ON et.id = se.energy_type_id
        WHERE se.step_id = s.id
      ),
      'hazards', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', h.id, 'name', h.name, 'classification', h.classification,
          'risks', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'id', r.id, 'name', r.name,
              'controls', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                  'id', c.id, 'description', c.description, 'controlType', c.control_type,
                  'isCritical', c.is_critical, 'verificationQuestion', c.verification_question
                )), '[]'::jsonb)
                FROM artp_step_controls c WHERE c.risk_id = r.id
              )
            )), '[]'::jsonb)
            FROM artp_step_risks r WHERE r.hazard_id = h.id
          )
        )), '[]'::jsonb)
        FROM artp_step_hazards h WHERE h.step_id = s.id
      )
    ) AS step_json
    FROM artp_steps s WHERE s.version_id = p_version_id
  ) sub;

  RETURN jsonb_build_object(
    'kind', 'artp',
    'documentId', v_doc.id,
    'documentName', v_doc.name,
    'documentCode', v_doc.code,
    'versionId', v_ver.id,
    'versionNumber', v_ver.version_number,
    'taskName', v_ver.task_name,
    'positions', v_positions,
    'steps', v_steps,
    'planning', v_planning
  );
END;
$$;


-- ========== 20261007_artp_planning_detail_publish.sql ==========
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.get_artp_version_detail(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_doc artp_documents%ROWTYPE;
  v_snapshot JSONB;
  v_planning JSONB;
BEGIN
  IF NOT public.can_read_artp_version(p_version_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);

  IF v_ver.status IN ('vigente', 'archivado') AND v_ver.content_snapshot IS NOT NULL
     AND v_ver.content_snapshot <> '{}'::jsonb THEN
    v_snapshot := v_ver.content_snapshot;
  ELSE
    v_snapshot := public.build_artp_version_snapshot(p_version_id);
    IF v_planning <> '{}'::jsonb THEN
      v_snapshot := v_snapshot || jsonb_build_object('planning', v_planning);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'document', jsonb_build_object(
      'id', v_doc.id, 'name', v_doc.name, 'code', v_doc.code, 'description', v_doc.description
    ),
    'version', jsonb_build_object(
      'id', v_ver.id, 'versionNumber', v_ver.version_number, 'status', v_ver.status,
      'taskName', v_ver.task_name, 'contentHash', v_ver.content_hash, 'publishedAt', v_ver.published_at
    ),
    'content', v_snapshot
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_artp_version(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_hash TEXT;
  v_planning JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_ver.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_ver.status NOT IN ('borrador', 'en_revision') THEN
    RAISE EXCEPTION 'La versión no se puede publicar';
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_snap := public.build_artp_version_snapshot(p_version_id);
  IF v_planning <> '{}'::jsonb THEN
    v_snap := v_snap || jsonb_build_object('planning', v_planning);
  END IF;
  v_hash := encode(digest(v_snap::text, 'sha256'), 'hex');

  UPDATE artp_versions SET status = 'archivado', updated_at = NOW()
  WHERE artp_document_id = v_ver.artp_document_id AND status = 'vigente';

  UPDATE artp_versions SET
    status = 'vigente',
    content_snapshot = v_snap,
    content_hash = v_hash,
    published_at = clock_timestamp(),
    updated_at = NOW()
  WHERE id = p_version_id;

  UPDATE artp_documents SET current_version_id = p_version_id, updated_at = NOW()
  WHERE id = v_ver.artp_document_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_artp_version_for_signatures(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_planning JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_ver.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_ver.status <> 'borrador' THEN
    RAISE EXCEPTION 'Solo borradores pueden enviarse a firma';
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_snap := public.build_artp_version_snapshot(p_version_id);
  IF v_planning <> '{}'::jsonb THEN
    v_snap := v_snap || jsonb_build_object('planning', v_planning);
  END IF;

  UPDATE artp_versions SET
    status = 'en_revision',
    content_snapshot = v_snap,
    updated_at = NOW()
  WHERE id = p_version_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_artp_version_for_signatures(TEXT) TO authenticated;


-- ========== 20261008_artp_signature_deliveries.sql ==========
-- ARTP en revisión: crear entregas móviles (document_deliveries) para trabajadores y supervisor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE document_deliveries DROP CONSTRAINT IF EXISTS document_deliveries_source_type_check;
ALTER TABLE document_deliveries ADD CONSTRAINT document_deliveries_source_type_check
  CHECK (source_type IN ('irl', 'technical_document', 'artp'));

CREATE OR REPLACE FUNCTION public.hash_jsonb_content(payload jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.digest(convert_to(payload::text, 'UTF8'), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.apply_artp_signature_to_planning(
  p_version_id TEXT,
  p_member_id TEXT,
  p_assignee_role TEXT,
  p_signature_path TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_planning JSONB;
  v_workers JSONB;
  v_wc JSONB;
  v_signed JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_signed := jsonb_build_object(
    'signatureStoragePath', p_signature_path,
    'signedAt', to_jsonb(clock_timestamp())
  );

  IF p_assignee_role IN ('supervisor', 'worker_and_supervisor') THEN
    v_wc := COALESCE(v_planning->'workContext', '{}'::jsonb);
    v_wc := v_wc || v_signed;
    v_planning := jsonb_set(v_planning, '{workContext}', v_wc, true);
  END IF;

  IF p_assignee_role IN ('worker', 'worker_and_supervisor') THEN
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN elem->>'memberId' = p_member_id THEN elem || v_signed
          ELSE elem
        END
      ),
      '[]'::jsonb
    )
    INTO v_workers
    FROM jsonb_array_elements(COALESCE(v_planning->'workers', '[]'::jsonb)) AS elem;

    v_planning := jsonb_set(v_planning, '{workers}', v_workers, true);
  END IF;

  UPDATE artp_versions
  SET
    content_snapshot = jsonb_set(
      COALESCE(content_snapshot, '{}'::jsonb),
      '{planning}',
      v_planning,
      true
    ),
    updated_at = NOW()
  WHERE id = p_version_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_artp_version_signature_deliveries(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_doc artp_documents%ROWTYPE;
  v_snap JSONB;
  v_planning JSONB;
  v_workers JSONB;
  v_worker JSONB;
  v_member_id TEXT;
  v_assignee organization_members%ROWTYPE;
  v_uid uuid := auth.uid();
  v_hash TEXT;
  v_title TEXT;
  v_code TEXT;
  v_delivery_snap JSONB;
  v_supervisor_id TEXT;
  v_target_members TEXT[] := ARRAY[]::TEXT[];
  v_existing UUID;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Versión no encontrada';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT public.is_org_editor(v_ver.organization_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  IF v_ver.status <> 'en_revision' THEN
    RETURN;
  END IF;

  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;
  v_snap := COALESCE(v_ver.content_snapshot, public.build_artp_version_snapshot(p_version_id));
  v_planning := COALESCE(v_snap->'planning', '{}'::jsonb);
  v_workers := COALESCE(v_planning->'workers', '[]'::jsonb);
  v_hash := public.hash_jsonb_content(v_snap);
  v_title := 'ARTP — ' || COALESCE(NULLIF(trim(v_ver.task_name), ''), v_doc.name, 'Tarea');
  v_code := COALESCE(NULLIF(trim(v_doc.code), ''), 'ARTP') || '-V' || v_ver.version_number::text;

  FOR v_worker IN SELECT value FROM jsonb_array_elements(v_workers) AS t(value)
  LOOP
    v_member_id := NULLIF(trim(v_worker->>'memberId'), '');
    IF v_member_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_assignee
    FROM organization_members m
    WHERE m.id = v_member_id
      AND m.organization_id = v_ver.organization_id
      AND m.status = 'Activo';

    IF NOT FOUND OR v_assignee.auth_user_id IS NULL THEN
      CONTINUE;
    END IF;

    v_target_members := array_append(v_target_members, v_member_id);

    v_delivery_snap := v_snap || jsonb_build_object(
      'assigneeRole', 'worker',
      'assigneeWorkerId', v_worker->>'id'
    );

    SELECT id INTO v_existing
    FROM document_deliveries
    WHERE source_type = 'artp'
      AND source_id = p_version_id
      AND assignee_member_id = v_member_id
      AND status = 'firmado'
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
      UPDATE document_deliveries
      SET
        title = v_title,
        document_code = v_code,
        content_snapshot = v_delivery_snap,
        content_hash = v_hash,
        updated_at = NOW()
      WHERE id = v_existing;
    ELSE
    SELECT id INTO v_existing
    FROM document_deliveries
    WHERE source_type = 'artp'
      AND source_id = p_version_id
      AND assignee_member_id = v_member_id
      AND status IN ('pendiente_revision', 'pendiente_firma')
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
      UPDATE document_deliveries
      SET
        title = v_title,
        document_code = v_code,
        content_snapshot = v_delivery_snap,
        content_hash = v_hash,
        cargo_id = v_assignee.cargo_id,
        cargo_name = (
          SELECT name FROM positions WHERE id = v_assignee.cargo_id
        ),
        work_center_id = v_assignee.work_center_id,
        work_center_name = (
          SELECT name FROM work_centers WHERE id = v_assignee.work_center_id
        ),
        updated_at = NOW()
      WHERE id = v_existing;
    ELSE
      INSERT INTO document_deliveries (
        organization_id,
        assignee_member_id,
        assignee_auth_user_id,
        source_type,
        source_id,
        cargo_id,
        cargo_name,
        work_center_id,
        work_center_name,
        title,
        document_code,
        content_snapshot,
        content_hash,
        source_updated_at,
        status,
        assigned_by
      ) VALUES (
        v_ver.organization_id,
        v_member_id,
        v_assignee.auth_user_id,
        'artp',
        p_version_id,
        v_assignee.cargo_id,
        (SELECT name FROM positions WHERE id = v_assignee.cargo_id),
        v_assignee.work_center_id,
        (SELECT name FROM work_centers WHERE id = v_assignee.work_center_id),
        v_title,
        v_code,
        v_delivery_snap,
        v_hash,
        v_ver.updated_at,
        'pendiente_revision',
        v_uid
      );
    END IF;
    END IF;
  END LOOP;

  v_supervisor_id := NULLIF(trim(v_planning->'workContext'->>'supervisorMemberId'), '');
  IF v_supervisor_id IS NOT NULL THEN
    SELECT * INTO v_assignee
    FROM organization_members m
    WHERE m.id = v_supervisor_id
      AND m.organization_id = v_ver.organization_id
      AND m.status = 'Activo';

    IF FOUND AND v_assignee.auth_user_id IS NOT NULL THEN
      IF NOT (v_supervisor_id = ANY (v_target_members)) THEN
        v_target_members := array_append(v_target_members, v_supervisor_id);
      END IF;

      v_delivery_snap := v_snap || jsonb_build_object(
        'assigneeRole',
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM jsonb_array_elements(v_workers) AS w
            WHERE NULLIF(trim(w.value->>'memberId'), '') = v_supervisor_id
          ) THEN 'worker_and_supervisor'
          ELSE 'supervisor'
        END
      );

      SELECT id INTO v_existing
      FROM document_deliveries
      WHERE source_type = 'artp'
        AND source_id = p_version_id
        AND assignee_member_id = v_supervisor_id
        AND status = 'firmado'
      LIMIT 1;

      IF v_existing IS NOT NULL THEN
        UPDATE document_deliveries
        SET
          title = v_title,
          document_code = v_code,
          content_snapshot = v_delivery_snap,
          content_hash = v_hash,
          updated_at = NOW()
        WHERE id = v_existing;
      ELSE
      SELECT id INTO v_existing
      FROM document_deliveries
      WHERE source_type = 'artp'
        AND source_id = p_version_id
        AND assignee_member_id = v_supervisor_id
        AND status IN ('pendiente_revision', 'pendiente_firma')
      LIMIT 1;

      IF v_existing IS NOT NULL THEN
        UPDATE document_deliveries
        SET
          title = v_title,
          document_code = v_code,
          content_snapshot = v_delivery_snap,
          content_hash = v_hash,
          updated_at = NOW()
        WHERE id = v_existing;
      ELSE
        INSERT INTO document_deliveries (
          organization_id,
          assignee_member_id,
          assignee_auth_user_id,
          source_type,
          source_id,
          cargo_id,
          cargo_name,
          work_center_id,
          work_center_name,
          title,
          document_code,
          content_snapshot,
          content_hash,
          source_updated_at,
          status,
          assigned_by
        ) VALUES (
          v_ver.organization_id,
          v_supervisor_id,
          v_assignee.auth_user_id,
          'artp',
          p_version_id,
          v_assignee.cargo_id,
          (SELECT name FROM positions WHERE id = v_assignee.cargo_id),
          v_assignee.work_center_id,
          (SELECT name FROM work_centers WHERE id = v_assignee.work_center_id),
          v_title,
          v_code,
          v_delivery_snap,
          v_hash,
          v_ver.updated_at,
          'pendiente_revision',
          v_uid
        );
      END IF;
      END IF;
    END IF;
  END IF;

  UPDATE document_deliveries
  SET
    status = 'anulado',
    voided_at = clock_timestamp(),
    voided_by = v_uid,
    void_reason = 'Ya no figura en la planificación ARTP'
  WHERE source_type = 'artp'
    AND source_id = p_version_id
    AND status IN ('pendiente_revision', 'pendiente_firma')
    AND NOT (assignee_member_id = ANY (v_target_members));
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_artp_version_for_signatures(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_planning JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_ver.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_ver.status <> 'borrador' THEN
    RAISE EXCEPTION 'Solo borradores pueden enviarse a firma';
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_snap := public.build_artp_version_snapshot(p_version_id);
  IF v_planning <> '{}'::jsonb THEN
    v_snap := v_snap || jsonb_build_object('planning', v_planning);
  END IF;

  UPDATE artp_versions SET
    status = 'en_revision',
    content_snapshot = v_snap,
    updated_at = NOW()
  WHERE id = p_version_id;

  PERFORM public.sync_artp_version_signature_deliveries(p_version_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.register_acknowledgement(
  p_delivery_id uuid,
  p_signature_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row document_deliveries%ROWTYPE;
  v_uid uuid := auth.uid();
  v_expected_prefix text;
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF p_signature_path IS NULL OR trim(p_signature_path) = '' THEN
    RAISE EXCEPTION 'Ruta de firma requerida';
  END IF;

  SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrega no encontrada';
  END IF;
  IF v_row.assignee_auth_user_id <> v_uid THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF v_row.status NOT IN ('pendiente_revision', 'pendiente_firma') THEN
    RAISE EXCEPTION 'La entrega no está pendiente de firma';
  END IF;

  v_expected_prefix := v_row.organization_id || '/' || v_uid::text || '/';
  IF position(v_expected_prefix IN p_signature_path) <> 1 THEN
    RAISE EXCEPTION 'Ruta de firma inválida';
  END IF;

  UPDATE document_deliveries
  SET
    status = 'firmado',
    signed_at = clock_timestamp(),
    signed_by_auth_user_id = v_uid,
    signature_path = p_signature_path
  WHERE id = p_delivery_id;

  IF v_row.source_type = 'artp' THEN
    v_role := COALESCE(v_row.content_snapshot->>'assigneeRole', 'worker');
    PERFORM public.apply_artp_signature_to_planning(
      v_row.source_id,
      v_row.assignee_member_id,
      v_role,
      p_signature_path
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_artp_version_signature_deliveries(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_artp_signature_to_planning(TEXT, TEXT, TEXT, TEXT) TO authenticated;


-- ========== 20261009_artp_signature_tracking.sql ==========
-- Seguimiento de firmas ARTP, lectura para firmantes y publicación automática al completar.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.can_read_artp_version(p_version_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org TEXT;
  v_status TEXT;
  v_cargo TEXT;
BEGIN
  SELECT organization_id, status INTO v_org, v_status
  FROM artp_versions WHERE id = p_version_id;
  IF v_org IS NULL THEN RETURN false; END IF;
  IF public.is_org_editor(v_org) THEN RETURN true; END IF;
  IF NOT public.is_org_member(v_org) THEN RETURN false; END IF;

  IF EXISTS (
    SELECT 1 FROM document_deliveries d
    WHERE d.source_type = 'artp'
      AND d.source_id = p_version_id
      AND d.assignee_auth_user_id = auth.uid()
      AND d.status <> 'anulado'
  ) THEN
    RETURN true;
  END IF;

  SELECT cargo_id INTO v_cargo FROM organization_members
  WHERE organization_id = v_org AND auth_user_id = auth.uid() AND status = 'Activo'
  LIMIT 1;

  IF v_status = 'vigente' AND v_cargo IS NOT NULL AND EXISTS (
    SELECT 1 FROM artp_version_positions vp
    WHERE vp.version_id = p_version_id AND vp.position_id = v_cargo
  ) THEN RETURN true; END IF;

  IF EXISTS (
    SELECT 1 FROM artp_executions e
    JOIN artp_execution_participants p ON p.execution_id = e.id
    JOIN organization_members m ON m.id = p.member_id
    WHERE e.artp_version_id = p_version_id AND m.auth_user_id = auth.uid()
  ) THEN RETURN true; END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_artp_version_core(
  p_version_id TEXT,
  p_require_editor BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_snap JSONB;
  v_hash TEXT;
  v_planning JSONB;
BEGIN
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF p_require_editor AND NOT public.is_org_editor(v_ver.organization_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  IF v_ver.status NOT IN ('borrador', 'en_revision') THEN
    RAISE EXCEPTION 'La versión no se puede publicar';
  END IF;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);
  v_snap := public.build_artp_version_snapshot(p_version_id);
  IF v_planning <> '{}'::jsonb THEN
    v_snap := v_snap || jsonb_build_object('planning', v_planning);
  END IF;
  v_hash := encode(extensions.digest(convert_to(v_snap::text, 'UTF8'), 'sha256'), 'hex');

  UPDATE artp_versions SET status = 'archivado', updated_at = NOW()
  WHERE artp_document_id = v_ver.artp_document_id AND status = 'vigente';

  UPDATE artp_versions SET
    status = 'vigente',
    content_snapshot = v_snap,
    content_hash = v_hash,
    published_at = clock_timestamp(),
    updated_at = NOW()
  WHERE id = p_version_id;

  UPDATE artp_documents SET current_version_id = p_version_id, updated_at = NOW()
  WHERE id = v_ver.artp_document_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_artp_version(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.publish_artp_version_core(p_version_id, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.try_auto_publish_artp_if_fully_signed(p_version_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_pending INT;
  v_signed INT;
BEGIN
  SELECT status INTO v_status FROM artp_versions WHERE id = p_version_id;
  IF v_status IS DISTINCT FROM 'en_revision' THEN
    RETURN;
  END IF;

  SELECT
    count(*) FILTER (WHERE status IN ('pendiente_revision', 'pendiente_firma')),
    count(*) FILTER (WHERE status = 'firmado')
  INTO v_pending, v_signed
  FROM document_deliveries
  WHERE source_type = 'artp'
    AND source_id = p_version_id
    AND status <> 'anulado';

  IF COALESCE(v_signed, 0) < 1 OR COALESCE(v_pending, 0) > 0 THEN
    RETURN;
  END IF;

  PERFORM public.publish_artp_version_core(p_version_id, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_artp_signature_progress(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signers JSONB;
  v_pending INT;
  v_total INT;
BEGIN
  IF NOT public.can_read_artp_version(p_version_id)
     AND NOT EXISTS (
       SELECT 1 FROM artp_versions v
       WHERE v.id = p_version_id AND public.is_org_editor(v.organization_id)
     ) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'memberId', d.assignee_member_id,
    'name', m.name,
    'role', COALESCE(d.content_snapshot->>'assigneeRole', 'worker'),
    'status', d.status,
    'signedAt', d.signed_at
  ) ORDER BY m.name), '[]'::jsonb)
  INTO v_signers
  FROM document_deliveries d
  JOIN organization_members m ON m.id = d.assignee_member_id
  WHERE d.source_type = 'artp'
    AND d.source_id = p_version_id
    AND d.status <> 'anulado';

  SELECT
    count(*) FILTER (WHERE status IN ('pendiente_revision', 'pendiente_firma')),
    count(*)
  INTO v_pending, v_total
  FROM document_deliveries
  WHERE source_type = 'artp'
    AND source_id = p_version_id
    AND status <> 'anulado';

  RETURN jsonb_build_object(
    'signers', v_signers,
    'pending', COALESCE(v_pending, 0),
    'total', COALESCE(v_total, 0),
    'allSigned', COALESCE(v_total, 0) > 0 AND COALESCE(v_pending, 0) = 0
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_artp_documents()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(t) ORDER BY t."assignedAt" DESC)
    FROM (
      SELECT
        v.id AS "versionId",
        v.task_name AS "taskName",
        v.version_number AS "versionNumber",
        v.status AS "documentStatus",
        d.id AS "deliveryId",
        d.status AS "mySignatureStatus",
        COALESCE(d.content_snapshot->>'assigneeRole', 'worker') AS "assigneeRole",
        d.title AS title,
        d.assigned_at AS "assignedAt"
      FROM document_deliveries d
      JOIN artp_versions v ON v.id = d.source_id
      WHERE d.source_type = 'artp'
        AND d.assignee_auth_user_id = v_uid
        AND d.status <> 'anulado'
    ) t
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.register_acknowledgement(
  p_delivery_id uuid,
  p_signature_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row document_deliveries%ROWTYPE;
  v_uid uuid := auth.uid();
  v_expected_prefix text;
  v_role text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  IF p_signature_path IS NULL OR trim(p_signature_path) = '' THEN
    RAISE EXCEPTION 'Ruta de firma requerida';
  END IF;

  SELECT * INTO v_row FROM document_deliveries WHERE id = p_delivery_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrega no encontrada';
  END IF;
  IF v_row.assignee_auth_user_id <> v_uid THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF v_row.status NOT IN ('pendiente_revision', 'pendiente_firma') THEN
    RAISE EXCEPTION 'La entrega no está pendiente de firma';
  END IF;

  v_expected_prefix := v_row.organization_id || '/' || v_uid::text || '/';
  IF position(v_expected_prefix IN p_signature_path) <> 1 THEN
    RAISE EXCEPTION 'Ruta de firma inválida';
  END IF;

  UPDATE document_deliveries
  SET
    status = 'firmado',
    signed_at = clock_timestamp(),
    signed_by_auth_user_id = v_uid,
    signature_path = p_signature_path
  WHERE id = p_delivery_id;

  IF v_row.source_type = 'artp' THEN
    v_role := COALESCE(v_row.content_snapshot->>'assigneeRole', 'worker');
    PERFORM public.apply_artp_signature_to_planning(
      v_row.source_id,
      v_row.assignee_member_id,
      v_role,
      p_signature_path
    );
    PERFORM public.try_auto_publish_artp_if_fully_signed(v_row.source_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_artp_signature_progress(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_artp_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_artp_version(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.publish_artp_version_core(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.try_auto_publish_artp_if_fully_signed(TEXT) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM artp_versions WHERE status = 'en_revision'
  LOOP
    PERFORM public.try_auto_publish_artp_if_fully_signed(r.id);
  END LOOP;
END;
$$;


-- ========== 20261010_artp_delete_and_signature_dedupe.sql ==========
-- Anula solicitudes de firma duplicadas y permite eliminar el ARTP desde el listado.

UPDATE document_deliveries d
SET
  status = 'anulado',
  voided_at = clock_timestamp(),
  void_reason = 'Duplicado: la persona ya había firmado'
WHERE d.source_type = 'artp'
  AND d.status IN ('pendiente_revision', 'pendiente_firma')
  AND EXISTS (
    SELECT 1
    FROM document_deliveries signed
    WHERE signed.source_type = 'artp'
      AND signed.source_id = d.source_id
      AND signed.assignee_member_id = d.assignee_member_id
      AND signed.status = 'firmado'
      AND signed.id <> d.id
  );

CREATE OR REPLACE FUNCTION public.delete_artp_document(p_document_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc artp_documents%ROWTYPE;
BEGIN
  SELECT * INTO v_doc FROM artp_documents WHERE id = p_document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Documento no encontrado';
  END IF;
  IF NOT public.is_org_editor(v_doc.organization_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM artp_executions e
    JOIN artp_versions v ON v.id = e.artp_version_id
    WHERE v.artp_document_id = p_document_id
  ) THEN
    RAISE EXCEPTION 'No se puede eliminar: este ARTP tiene ejecuciones registradas';
  END IF;

  DELETE FROM document_deliveries
  WHERE source_type = 'artp'
    AND source_id IN (
      SELECT id FROM artp_versions WHERE artp_document_id = p_document_id
    );

  DELETE FROM artp_documents WHERE id = p_document_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_artp_document(TEXT) TO authenticated;


-- ========== 20261011_artp_clone_version.sql ==========
-- Nueva versión de un ARTP vigente: copia el documento formal (snapshot + pasos),
-- sin firmas, y lo deja como borrador actual para editarlo.

CREATE OR REPLACE FUNCTION public.get_artp_version_detail(p_version_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ver artp_versions%ROWTYPE;
  v_doc artp_documents%ROWTYPE;
  v_snapshot JSONB;
  v_planning JSONB;
  v_built_steps INT;
  v_stored_steps INT;
BEGIN
  IF NOT public.can_read_artp_version(p_version_id) THEN
    RAISE EXCEPTION 'Sin permiso';
  END IF;
  SELECT * INTO v_ver FROM artp_versions WHERE id = p_version_id;
  SELECT * INTO v_doc FROM artp_documents WHERE id = v_ver.artp_document_id;

  v_planning := COALESCE(v_ver.content_snapshot->'planning', '{}'::jsonb);

  IF v_ver.status IN ('vigente', 'archivado') AND v_ver.content_snapshot IS NOT NULL
     AND v_ver.content_snapshot <> '{}'::jsonb THEN
    v_snapshot := v_ver.content_snapshot;
  ELSE
    v_snapshot := public.build_artp_version_snapshot(p_version_id);
    v_built_steps := COALESCE(
      CASE WHEN jsonb_typeof(v_snapshot->'steps') = 'array'
        THEN jsonb_array_length(v_snapshot->'steps') ELSE 0 END,
      0
    );
    v_stored_steps := COALESCE(
      CASE WHEN jsonb_typeof(v_ver.content_snapshot->'steps') = 'array'
        THEN jsonb_array_length(v_ver.content_snapshot->'steps') ELSE 0 END,
      0
    );
    IF v_built_steps = 0 AND v_stored_steps > 0 THEN
      v_snapshot := v_ver.content_snapshot;
    END IF;
    IF v_planning <> '{}'::jsonb THEN
      v_snapshot := v_snapshot || jsonb_build_object('planning', v_planning);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'document', jsonb_build_object(
      'id', v_doc.id, 'name', v_doc.name, 'code', v_doc.code, 'description', v_doc.description
    ),
    'version', jsonb_build_object(
      'id', v_ver.id, 'versionNumber', v_ver.version_number, 'status', v_ver.status,
      'taskName', v_ver.task_name, 'contentHash', v_ver.content_hash, 'publishedAt', v_ver.published_at
    ),
    'content', v_snapshot
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.clone_artp_version(p_source_version_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src artp_versions%ROWTYPE;
  v_new_id TEXT;
  v_num INTEGER;
  v_snap JSONB;
  v_planning JSONB;
  v_workers JSONB;
  v_steps JSONB := '[]'::jsonb;
  v_id_map JSONB := '{}'::jsonb;
  v_answers JSONB := '{}'::jsonb;
  v_step JSONB;
  v_hazards JSONB;
  v_hazard JSONB;
  v_risks JSONB;
  v_risk JSONB;
  v_controls JSONB;
  v_control JSONB;
  v_old TEXT;
  v_new TEXT;
  v_tools TEXT[];
  step_rec RECORD;
  hazard_rec RECORD;
  risk_rec RECORD;
  control_rec RECORD;
  energy_rec RECORD;
  answer_rec RECORD;
  step_elem JSONB;
  hazard_elem JSONB;
  risk_elem JSONB;
  control_elem JSONB;
  energy_elem JSONB;
BEGIN
  SELECT * INTO v_src FROM artp_versions WHERE id = p_source_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versión no encontrada'; END IF;
  IF NOT public.is_org_editor(v_src.organization_id) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF v_src.status <> 'vigente' THEN
    RAISE EXCEPTION 'Solo se versiona desde un ARTP vigente';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_num
  FROM artp_versions WHERE artp_document_id = v_src.artp_document_id;

  v_new_id := v_src.artp_document_id || '_ver_' || v_num;

  v_snap := COALESCE(v_src.content_snapshot, '{}'::jsonb);
  IF COALESCE(
    CASE WHEN jsonb_typeof(v_snap->'steps') = 'array' THEN jsonb_array_length(v_snap->'steps') ELSE 0 END,
    0
  ) = 0 THEN
    v_snap := public.build_artp_version_snapshot(p_source_version_id)
      || jsonb_build_object('planning', COALESCE(v_snap->'planning', '{}'::jsonb));
  END IF;

  v_planning := COALESCE(v_snap->'planning', '{}'::jsonb);
  v_planning := jsonb_set(
    v_planning,
    '{workContext}',
    COALESCE(v_planning->'workContext', '{}'::jsonb)
      - 'signatureStoragePath' - 'signedAt' - 'supervisorSignatureDataUrl',
    true
  );

  IF jsonb_typeof(v_planning->'workers') = 'array' THEN
    SELECT COALESCE(
      jsonb_agg(elem - 'signatureStoragePath' - 'signedAt' - 'signatureDataUrl'),
      '[]'::jsonb
    )
    INTO v_workers
    FROM jsonb_array_elements(v_planning->'workers') AS elem;
    v_planning := jsonb_set(v_planning, '{workers}', v_workers, true);
  END IF;

  IF jsonb_typeof(v_snap->'steps') = 'array' THEN
    FOR step_rec IN SELECT value AS elem FROM jsonb_array_elements(v_snap->'steps') LOOP
      v_step := step_rec.elem;
      v_old := COALESCE(NULLIF(v_step->>'id', ''), 'step');
      v_new := v_old || '_c' || v_num;
      v_id_map := v_id_map || jsonb_build_object(v_old, v_new);
      v_step := jsonb_set(v_step, '{id}', to_jsonb(v_new));

      v_hazards := '[]'::jsonb;
      IF jsonb_typeof(v_step->'hazards') = 'array' THEN
        FOR hazard_rec IN SELECT value AS elem FROM jsonb_array_elements(v_step->'hazards') LOOP
          v_hazard := hazard_rec.elem;
          v_old := COALESCE(NULLIF(v_hazard->>'id', ''), 'hz');
          v_new := v_old || '_c' || v_num;
          v_id_map := v_id_map || jsonb_build_object(v_old, v_new);
          v_hazard := jsonb_set(v_hazard, '{id}', to_jsonb(v_new));

          v_risks := '[]'::jsonb;
          IF jsonb_typeof(v_hazard->'risks') = 'array' THEN
            FOR risk_rec IN SELECT value AS elem FROM jsonb_array_elements(v_hazard->'risks') LOOP
              v_risk := risk_rec.elem;
              v_old := COALESCE(NULLIF(v_risk->>'id', ''), 'rk');
              v_new := v_old || '_c' || v_num;
              v_id_map := v_id_map || jsonb_build_object(v_old, v_new);
              v_risk := jsonb_set(v_risk, '{id}', to_jsonb(v_new));

              v_controls := '[]'::jsonb;
              IF jsonb_typeof(v_risk->'controls') = 'array' THEN
                FOR control_rec IN SELECT value AS elem FROM jsonb_array_elements(v_risk->'controls') LOOP
                  v_control := control_rec.elem;
                  v_old := COALESCE(NULLIF(v_control->>'id', ''), 'ct');
                  v_new := v_old || '_c' || v_num;
                  v_id_map := v_id_map || jsonb_build_object(v_old, v_new);
                  v_control := jsonb_set(v_control, '{id}', to_jsonb(v_new));
                  v_controls := v_controls || jsonb_build_array(v_control);
                END LOOP;
              END IF;

              v_risk := jsonb_set(v_risk, '{controls}', v_controls, true);
              v_risks := v_risks || jsonb_build_array(v_risk);
            END LOOP;
          END IF;

          v_hazard := jsonb_set(v_hazard, '{risks}', v_risks, true);
          v_hazards := v_hazards || jsonb_build_array(v_hazard);
        END LOOP;
      END IF;

      v_step := jsonb_set(v_step, '{hazards}', v_hazards, true);
      v_steps := v_steps || jsonb_build_array(v_step);
    END LOOP;
  END IF;

  IF jsonb_typeof(v_planning->'controlAnswers') = 'object' THEN
    FOR answer_rec IN SELECT * FROM jsonb_each(v_planning->'controlAnswers') LOOP
      v_answers := v_answers || jsonb_build_object(
        COALESCE(v_id_map->>answer_rec.key, answer_rec.key),
        answer_rec.value
      );
    END LOOP;
    v_planning := jsonb_set(v_planning, '{controlAnswers}', v_answers, true);
  END IF;

  v_snap := jsonb_set(v_snap, '{steps}', v_steps, true);
  v_snap := jsonb_set(v_snap, '{planning}', v_planning, true);

  INSERT INTO artp_versions (
    id, organization_id, artp_document_id, version_number, status,
    work_center_id, area_id, process_id, subprocess_id, org_task_id, task_name,
    supervisor_member_id, content_snapshot, created_by
  ) VALUES (
    v_new_id, v_src.organization_id, v_src.artp_document_id, v_num, 'borrador',
    v_src.work_center_id, v_src.area_id, v_src.process_id, v_src.subprocess_id,
    v_src.org_task_id, v_src.task_name, v_src.supervisor_member_id, v_snap, auth.uid()
  );

  INSERT INTO artp_version_positions (id, organization_id, version_id, position_id)
  SELECT v_new_id || '_pos_' || row_number() OVER (ORDER BY position_id),
         organization_id, v_new_id, position_id
  FROM artp_version_positions
  WHERE version_id = p_source_version_id;

  FOR step_rec IN SELECT value AS elem FROM jsonb_array_elements(v_steps) LOOP
    step_elem := step_rec.elem;
    v_tools := ARRAY(
      SELECT jsonb_array_elements_text(
        CASE
          WHEN jsonb_typeof(step_elem->'tools') = 'array' THEN step_elem->'tools'
          ELSE '[]'::jsonb
        END
      )
    );

    INSERT INTO artp_steps (id, organization_id, version_id, sequence, description, tools)
    VALUES (
      step_elem->>'id',
      v_src.organization_id,
      v_new_id,
      COALESCE((step_elem->>'sequence')::int, 1),
      COALESCE(NULLIF(step_elem->>'description', ''), '—'),
      COALESCE(v_tools, ARRAY[]::text[])
    );

    IF jsonb_typeof(step_elem->'energies') = 'array' THEN
      FOR energy_rec IN SELECT value AS elem FROM jsonb_array_elements(step_elem->'energies') LOOP
        energy_elem := energy_rec.elem;
        IF energy_elem->>'id' IS NOT NULL AND EXISTS (
          SELECT 1 FROM energy_types WHERE id = energy_elem->>'id'
        ) THEN
          INSERT INTO artp_step_energies (id, organization_id, step_id, energy_type_id)
          VALUES (
            (step_elem->>'id') || '_en_' || (energy_elem->>'id'),
            v_src.organization_id,
            step_elem->>'id',
            energy_elem->>'id'
          )
          ON CONFLICT (step_id, energy_type_id) DO NOTHING;
        END IF;
      END LOOP;
    END IF;

    IF jsonb_typeof(step_elem->'hazards') <> 'array' THEN
      CONTINUE;
    END IF;

    FOR hazard_rec IN SELECT value AS elem FROM jsonb_array_elements(step_elem->'hazards') LOOP
      hazard_elem := hazard_rec.elem;
      INSERT INTO artp_step_hazards (
        id, organization_id, step_id, name, catalog_code, classification, source
      ) VALUES (
        hazard_elem->>'id',
        v_src.organization_id,
        step_elem->>'id',
        COALESCE(NULLIF(hazard_elem->>'name', ''), '—'),
        NULLIF(hazard_elem->>'catalog_code', ''),
        CASE
          WHEN hazard_elem->>'classification' IN (
            'Seguridad', 'Emergencias', 'Higiénicos', 'Psicosociales', 'Músculo-esquelético'
          ) THEN hazard_elem->>'classification'
          ELSE NULL
        END,
        CASE
          WHEN hazard_elem->>'source' IN ('manual', 'catalog', 'iper', 'ai') THEN hazard_elem->>'source'
          ELSE 'manual'
        END
      );

      IF jsonb_typeof(hazard_elem->'risks') <> 'array' THEN
        CONTINUE;
      END IF;

      FOR risk_rec IN SELECT value AS elem FROM jsonb_array_elements(hazard_elem->'risks') LOOP
        risk_elem := risk_rec.elem;
        INSERT INTO artp_step_risks (id, organization_id, hazard_id, name, catalog_code, source)
        VALUES (
          risk_elem->>'id',
          v_src.organization_id,
          hazard_elem->>'id',
          COALESCE(NULLIF(risk_elem->>'name', ''), '—'),
          NULLIF(risk_elem->>'catalog_code', ''),
          CASE
            WHEN risk_elem->>'source' IN ('manual', 'catalog', 'iper', 'ai') THEN risk_elem->>'source'
            ELSE 'manual'
          END
        );

        IF jsonb_typeof(risk_elem->'controls') <> 'array' THEN
          CONTINUE;
        END IF;

        FOR control_rec IN SELECT value AS elem FROM jsonb_array_elements(risk_elem->'controls') LOOP
          control_elem := control_rec.elem;
          INSERT INTO artp_step_controls (
            id, organization_id, risk_id, description, control_type, is_critical, verification_question, source
          ) VALUES (
            control_elem->>'id',
            v_src.organization_id,
            risk_elem->>'id',
            COALESCE(NULLIF(control_elem->>'description', ''), '—'),
            CASE
              WHEN control_elem->>'controlType' IN (
                'Eliminar / Sustituir',
                'Controles de Ingeniería',
                'Controles Administrativos',
                'Elementos de Protección Personal (EPP)'
              ) THEN control_elem->>'controlType'
              ELSE 'Controles Administrativos'
            END,
            COALESCE((control_elem->>'isCritical')::boolean, false),
            NULLIF(control_elem->>'verificationQuestion', ''),
            CASE
              WHEN control_elem->>'source' IN ('manual', 'catalog', 'iper', 'ai') THEN control_elem->>'source'
              ELSE 'manual'
            END
          );
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  UPDATE artp_documents
  SET current_version_id = v_new_id, updated_at = NOW()
  WHERE id = v_src.artp_document_id;

  RETURN v_new_id;
END;
$$;


-- ========== 20261012_process_safety.sql ==========
-- Seguridad de Procesos: actividades de implementación por elemento (1-20) e historial de avance.
-- Pilares y elementos son constantes en código (types/processSafety.ts).

-- ---------------------------------------------------------------------------
-- ps_activities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ps_activities (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    element_number SMALLINT NOT NULL CHECK (element_number BETWEEN 1 AND 20),
    phase TEXT NOT NULL
        CHECK (phase IN ('Preparación', 'Operación', 'Monitoreo y revisión')),
    code TEXT,
    title TEXT NOT NULL,
    responsible TEXT,
    planned_start DATE,
    planned_end DATE,
    progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    sort_order INT NOT NULL DEFAULT 0,
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ps_activities_dates_chk
        CHECK (planned_start IS NULL OR planned_end IS NULL OR planned_end >= planned_start)
);

CREATE INDEX IF NOT EXISTS idx_ps_activities_org_element
    ON ps_activities (organization_id, element_number, sort_order);

DROP TRIGGER IF EXISTS trg_ps_activities_updated_at ON ps_activities;
CREATE TRIGGER trg_ps_activities_updated_at
    BEFORE UPDATE ON ps_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- ps_progress_log: un registro por actividad y día (gana el último cambio del día)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ps_progress_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    activity_id TEXT NOT NULL REFERENCES ps_activities(id) ON DELETE CASCADE,
    progress SMALLINT NOT NULL CHECK (progress BETWEEN 0 AND 100),
    recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_ps_progress_log_activity_day UNIQUE (activity_id, recorded_on)
);

CREATE INDEX IF NOT EXISTS idx_ps_progress_log_org ON ps_progress_log (organization_id, recorded_on);

-- El historial se escribe en la base para que ningún cliente pueda omitirlo.
CREATE OR REPLACE FUNCTION ps_log_activity_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.progress IS NOT DISTINCT FROM OLD.progress THEN
    RETURN NEW;
  END IF;
  INSERT INTO ps_progress_log (organization_id, activity_id, progress, recorded_on, recorded_by)
  VALUES (NEW.organization_id, NEW.id, NEW.progress, CURRENT_DATE, auth.uid())
  ON CONFLICT (activity_id, recorded_on)
  DO UPDATE SET progress = EXCLUDED.progress, recorded_by = EXCLUDED.recorded_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ps_activities_progress_log ON ps_activities;
CREATE TRIGGER trg_ps_activities_progress_log
    AFTER INSERT OR UPDATE OF progress ON ps_activities
    FOR EACH ROW EXECUTE FUNCTION ps_log_activity_progress();

-- ---------------------------------------------------------------------------
-- RLS: miembros leen, editores escriben. El log solo se lee (lo escribe el trigger).
-- ---------------------------------------------------------------------------
ALTER TABLE ps_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ps_progress_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ps_activities_select" ON ps_activities;
CREATE POLICY "ps_activities_select" ON ps_activities FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
DROP POLICY IF EXISTS "ps_activities_insert" ON ps_activities;
CREATE POLICY "ps_activities_insert" ON ps_activities FOR INSERT TO authenticated
  WITH CHECK (is_org_editor(organization_id));
DROP POLICY IF EXISTS "ps_activities_update" ON ps_activities;
CREATE POLICY "ps_activities_update" ON ps_activities FOR UPDATE TO authenticated
  USING (is_org_editor(organization_id)) WITH CHECK (is_org_editor(organization_id));
DROP POLICY IF EXISTS "ps_activities_delete" ON ps_activities;
CREATE POLICY "ps_activities_delete" ON ps_activities FOR DELETE TO authenticated
  USING (is_org_editor(organization_id));

DROP POLICY IF EXISTS "ps_progress_log_select" ON ps_progress_log;
CREATE POLICY "ps_progress_log_select" ON ps_progress_log FOR SELECT TO authenticated
  USING (is_org_member(organization_id));


-- ========== bootstrap_data.sql ==========
-- Datos iniciales LifeOn (cuentas de prueba / multi-tenant)
-- Ejecutar después de las migraciones 20260911–20260925

INSERT INTO organizations (id, name, industry, size, status)
VALUES
  ('org_demo', 'Constructora y Servicios Santiago SpA', 'Construcción', '51-200', 'Activo'),
  ('org_luis', 'SafetyCo Consultores SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_sergio', 'Constructora Horizonte SpA', 'Construcción', '51-200', 'Activo'),
  ('org_aldo', 'Berríos Ingeniería y Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_gonzalo_c', 'Cabrera Seguridad Industrial SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_gonzalo_b', 'Beristain Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_rene', 'Ramos Prevención SpA', 'Consultoría en Prevención', '1-20', 'Activo'),
  ('org_alex', 'Ordenes Construcción SpA', 'Construcción', '21-50', 'Activo'),
  ('org_carlos', 'Subiabre Ingeniería SpA', 'Construcción', '21-50', 'Activo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  updated_at = NOW();

INSERT INTO organization_preferences (id, organization_id, preferences)
VALUES
  ('default_org', 'org_demo', '{"onboardingCompleted":false}'::jsonb),
  ('org_luis', 'org_luis', '{"onboardingCompleted":false}'::jsonb),
  ('org_sergio', 'org_sergio', '{"onboardingCompleted":false}'::jsonb),
  ('org_aldo', 'org_aldo', '{"onboardingCompleted":false}'::jsonb),
  ('org_gonzalo_c', 'org_gonzalo_c', '{"onboardingCompleted":false}'::jsonb),
  ('org_gonzalo_b', 'org_gonzalo_b', '{"onboardingCompleted":false}'::jsonb),
  ('org_rene', 'org_rene', '{"onboardingCompleted":false}'::jsonb),
  ('org_alex', 'org_alex', '{"onboardingCompleted":false}'::jsonb),
  ('org_carlos', 'org_carlos', '{"onboardingCompleted":false}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  preferences = organization_preferences.preferences || EXCLUDED.preferences,
  updated_at = NOW();

INSERT INTO organization_members (
  id, organization_id, user_id, email, name, first_name, last_name, role, status, permissions
)
VALUES
  ('mem_user_luis', 'org_luis', 'user_luis', 'luis.godoy@safetyclub.cl', 'Luis Godoy', 'Luis', 'Godoy', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_sergio', 'org_sergio', 'user_sergio', 'sergio.jara@safetyclub.cl', 'Sergio Jara', 'Sergio', 'Jara', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_aldo', 'org_aldo', 'user_aldo', 'aldo.berrios@safetyclub.cl', 'Aldo Berríos', 'Aldo', 'Berríos', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_gonzalo_c', 'org_gonzalo_c', 'user_gonzalo_c', 'gonzalo.cabrera@safetyclub.cl', 'Gonzalo Cabrera', 'Gonzalo', 'Cabrera', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_gonzalo_b', 'org_gonzalo_b', 'user_gonzalo_b', 'gonzalo.beristain@safetyclub.cl', 'Gonzalo Beristain', 'Gonzalo', 'Beristain', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_demo_sergio', 'org_demo', 'demo_sergio', 'sergio.jara@lifeon.cl', 'Sergio A. Jara Astete', 'Sergio A.', 'Jara Astete', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_rene', 'org_rene', 'user_rene', 'rene.ramos@safetyclub.cl', 'René Ramos', 'René', 'Ramos', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_alex', 'org_alex', 'user_alex', 'alex.ordenes@safetyclub.cl', 'Alex Ordenes', 'Alex', 'Ordenes', 'Administrador', 'Activo', '{}'::jsonb),
  ('mem_user_carlos', 'org_carlos', 'user_carlos', 'carlos.subiabre@safetyclub.cl', 'Carlos Subiabre', 'Carlos', 'Subiabre', 'Administrador', 'Activo', '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO preventive_plans (id, organization_id, name, status)
SELECT 'plan_' || o.id, o.id, 'Programa Anual', 'Activo'
FROM organizations o
ON CONFLICT (id) DO NOTHING;

