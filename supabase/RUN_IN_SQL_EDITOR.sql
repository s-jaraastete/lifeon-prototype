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

